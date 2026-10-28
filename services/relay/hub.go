package main

import (
	"fmt"
	"sync"
)

// subscriberBuffer is the per-connection frame queue. A subscriber that falls
// this far behind is dropped and reconnects with Last-Event-ID instead of
// applying backpressure to the publisher.
const subscriberBuffer = 128

// Event is one fan-out frame. Data is already compacted JSON and is never
// rewritten by the hub.
type Event struct {
	ID   string
	Type string
	Data []byte
}

// Subscriber is one open /stream connection.
type Subscriber struct {
	topic string
	ch    chan Event
}

// Topic returns the seed topic this subscriber listens to.
func (s *Subscriber) Topic() string { return s.topic }

// Events is the receive side of the subscription.
func (s *Subscriber) Events() <-chan Event { return s.ch }

// Hub fans events out to subscribers per topic and keeps a short replay
// window so reconnecting clients can resume from Last-Event-ID.
type Hub struct {
	mu           sync.Mutex
	subs         map[*Subscriber]struct{}
	history      map[string][]Event
	lastID       map[string]uint64
	historyLimit int
}

// NewHub builds a hub with a bounded per-topic replay window.
func NewHub(historyLimit int) *Hub {
	if historyLimit < 0 {
		historyLimit = 0
	}
	return &Hub{
		subs:         make(map[*Subscriber]struct{}),
		history:      make(map[string][]Event),
		lastID:       make(map[string]uint64),
		historyLimit: historyLimit,
	}
}

// Subscribe registers a subscriber and returns the frames that arrived after
// lastID. Registration and replay selection happen under one lock, so no event
// can slip between the snapshot and the live stream.
func (h *Hub) Subscribe(topic, lastID string) (*Subscriber, []Event) {
	h.mu.Lock()
	defer h.mu.Unlock()

	sub := &Subscriber{topic: topic, ch: make(chan Event, subscriberBuffer)}
	h.subs[sub] = struct{}{}

	return sub, h.replayLocked(topic, lastID)
}

// Unsubscribe removes a subscriber and closes its channel. It is safe to call
// more than once.
func (h *Hub) Unsubscribe(sub *Subscriber) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.subs[sub]; !ok {
		return
	}
	delete(h.subs, sub)
	close(sub.ch)
}

// Publish stores the event in the replay window and fans it out. It returns
// the number of subscribers that accepted the frame.
//
// The id is forced to stay monotonic within a topic: a late or duplicate
// engine minute is bumped to last+1 so reconnect cursors never go backwards.
func (h *Hub) Publish(topic, eventType string, data []byte, id uint64) int {
	h.mu.Lock()
	defer h.mu.Unlock()

	if last, ok := h.lastID[topic]; ok && id <= last {
		id = last + 1
	}
	h.lastID[topic] = id

	event := Event{ID: formatID(id), Type: eventType, Data: data}

	if h.historyLimit > 0 {
		history := append(h.history[topic], event)
		if len(history) > h.historyLimit {
			history = history[len(history)-h.historyLimit:]
		}
		h.history[topic] = history
	}

	fanout := 0
	for sub := range h.subs {
		if sub.topic != topic {
			continue
		}
		select {
		case sub.ch <- event:
			fanout++
		default:
			// Slowest subscriber: close it and let the client reconnect
			// with a cursor rather than blocking every other listener.
			delete(h.subs, sub)
			close(sub.ch)
		}
	}
	return fanout
}

// Stats returns the live subscriber count and the number of known topics.
func (h *Hub) Stats() (clients, topics int) {
	h.mu.Lock()
	defer h.mu.Unlock()
	return len(h.subs), len(h.history)
}

func (h *Hub) replayLocked(topic, lastID string) []Event {
	if lastID == "" {
		return nil
	}
	cursor, ok := parseID(lastID)
	if !ok {
		return nil
	}

	history := h.history[topic]
	replay := make([]Event, 0, len(history))
	for _, event := range history {
		id, ok := parseID(event.ID)
		if ok && id > cursor {
			replay = append(replay, event)
		}
	}
	return replay
}

func formatID(id uint64) string {
	return fmt.Sprintf("%08d", id)
}

func parseID(raw string) (uint64, bool) {
	var id uint64
	if raw == "" {
		return 0, false
	}
	for _, r := range raw {
		if r < '0' || r > '9' {
			return 0, false
		}
		id = id*10 + uint64(r-'0')
	}
	return id, true
}
