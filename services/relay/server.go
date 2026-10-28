package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// maxPublishBytes is the snapshot-v1 ceiling: 64 KiB of compacted JSON.
const maxPublishBytes = 64 << 10

// heartbeatInterval keeps idle proxies from closing an SSE stream.
const heartbeatInterval = 15 * time.Second

// Server is the HTTP surface of the relay.
type Server struct {
	hub    *Hub
	logger *log.Logger
}

// NewServer wires the routes to a hub.
func NewServer(hub *Hub, logger *log.Logger) http.Handler {
	if logger == nil {
		logger = log.Default()
	}
	s := &Server{hub: hub, logger: logger}

	mux := http.NewServeMux()
	mux.HandleFunc("/publish", s.handlePublish)
	mux.HandleFunc("/stream", s.handleStream)
	mux.HandleFunc("/healthz", s.handleHealth)
	return mux
}

type healthResponse struct {
	OK      bool `json:"ok"`
	Clients int  `json:"clients"`
	Topics  int  `json:"topics"`
}

type publishResponse struct {
	Published int `json:"published"`
	Fanout    int `json:"fanout"`
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w, http.MethodGet)
		return
	}
	clients, topics := s.hub.Stats()
	writeJSON(w, http.StatusOK, healthResponse{OK: true, Clients: clients, Topics: topics})
}

func (s *Server) handlePublish(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w, http.MethodPost)
		return
	}

	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, maxPublishBytes))
	if err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			writeError(w, http.StatusRequestEntityTooLarge, "payload exceeds 64 KiB")
			return
		}
		writeError(w, http.StatusBadRequest, "could not read body")
		return
	}
	if len(bytes.TrimSpace(body)) == 0 {
		writeError(w, http.StatusBadRequest, "empty body")
		return
	}

	var compact bytes.Buffer
	if err := json.Compact(&compact, body); err != nil {
		writeError(w, http.StatusBadRequest, "body is not valid JSON")
		return
	}

	var envelope struct {
		Seed   json.Number `json:"seed"`
		Minute json.Number `json:"minute"`
		Type   string      `json:"type"`
	}
	decoder := json.NewDecoder(bytes.NewReader(compact.Bytes()))
	decoder.UseNumber()
	if err := decoder.Decode(&envelope); err != nil {
		writeError(w, http.StatusBadRequest, "body must be a JSON object")
		return
	}

	topic := strings.TrimSpace(r.URL.Query().Get("seed"))
	if topic == "" {
		topic = strings.TrimSpace(envelope.Seed.String())
	}
	if topic == "" {
		topic = "0"
	}

	var id uint64
	if envelope.Minute != "" {
		parsed, err := strconv.ParseUint(envelope.Minute.String(), 10, 64)
		if err != nil {
			writeError(w, http.StatusBadRequest, "minute must be a non-negative integer")
			return
		}
		id = parsed
	}

	eventType := strings.TrimSpace(envelope.Type)
	if eventType == "" {
		eventType = "message"
	}

	fanout := s.hub.Publish(topic, eventType, compact.Bytes(), id)
	writeJSON(w, http.StatusOK, publishResponse{Published: 1, Fanout: fanout})
}

func (s *Server) handleStream(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w, http.MethodGet)
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		writeError(w, http.StatusInternalServerError, "streaming unsupported")
		return
	}

	topic := strings.TrimSpace(r.URL.Query().Get("seed"))
	if topic == "" {
		topic = "0"
	}

	sub, replay := s.hub.Subscribe(topic, r.Header.Get("Last-Event-ID"))
	defer s.hub.Unsubscribe(sub)

	headers := w.Header()
	headers.Set("Content-Type", "text/event-stream; charset=utf-8")
	headers.Set("Cache-Control", "no-cache, no-transform")
	headers.Set("Connection", "keep-alive")
	headers.Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)

	fmt.Fprint(w, "retry: 1000\n\n")
	hello, _ := json.Marshal(map[string]string{"topic": topic})
	fmt.Fprintf(w, "event: hello\ndata: %s\n\n", hello)
	flusher.Flush()

	for _, event := range replay {
		if err := writeEvent(w, event); err != nil {
			return
		}
	}
	if len(replay) > 0 {
		flusher.Flush()
	}

	heartbeat := time.NewTicker(heartbeatInterval)
	defer heartbeat.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case event, open := <-sub.Events():
			if !open {
				return
			}
			if err := writeEvent(w, event); err != nil {
				return
			}
			flusher.Flush()
		case <-heartbeat.C:
			if _, err := io.WriteString(w, ": ping\n\n"); err != nil {
				return
			}
			flusher.Flush()
		}
	}
}

func writeEvent(w io.Writer, event Event) error {
	_, err := fmt.Fprintf(w, "id: %s\nevent: %s\ndata: %s\n\n", event.ID, event.Type, event.Data)
	return err
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func methodNotAllowed(w http.ResponseWriter, allowed string) {
	w.Header().Set("Allow", allowed)
	writeError(w, http.StatusMethodNotAllowed, "method not allowed")
}
