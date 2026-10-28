package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func newTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	srv := httptest.NewServer(NewServer(NewHub(16), nil))
	t.Cleanup(srv.Close)
	return srv
}

type sseFrame map[string]string

func (f sseFrame) event() string { return f["event"] }
func (f sseFrame) id() string    { return f["id"] }
func (f sseFrame) data() string  { return f["data"] }

func readFrame(t *testing.T, scanner *bufio.Scanner) sseFrame {
	t.Helper()
	frame := sseFrame{}
	for scanner.Scan() {
		line := scanner.Text()
		if line == "" {
			if len(frame) == 0 {
				continue
			}
			// The stream opens with a `retry:` hint block; it is not an event.
			if len(frame) == 1 && frame["retry"] != "" {
				frame = sseFrame{}
				continue
			}
			return frame
		}
		if strings.HasPrefix(line, ":") {
			continue // heartbeat comment
		}
		key, value, ok := strings.Cut(line, ": ")
		if !ok {
			continue
		}
		frame[key] = value
	}
	if err := scanner.Err(); err != nil {
		t.Fatalf("read stream: %v", err)
	}
	t.Fatal("stream closed before a frame arrived")
	return nil
}

func openStream(t *testing.T, srv *httptest.Server, topic, lastID string) *bufio.Scanner {
	t.Helper()
	ctx, cancel := context.WithCancel(context.Background())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, srv.URL+"/stream?seed="+topic, nil)
	if err != nil {
		cancel()
		t.Fatalf("new request: %v", err)
	}
	if lastID != "" {
		req.Header.Set("Last-Event-ID", lastID)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		cancel()
		t.Fatalf("open stream: %v", err)
	}
	t.Cleanup(func() {
		cancel()
		resp.Body.Close()
	})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("stream status = %d, want 200", resp.StatusCode)
	}
	return bufio.NewScanner(resp.Body)
}

func publish(t *testing.T, srv *httptest.Server, body string) publishResponse {
	t.Helper()
	resp, err := http.Post(srv.URL+"/publish", "application/json", strings.NewReader(body))
	if err != nil {
		t.Fatalf("publish: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		payload, _ := io.ReadAll(resp.Body)
		t.Fatalf("publish status = %d: %s", resp.StatusCode, payload)
	}
	var out publishResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		t.Fatalf("decode publish response: %v", err)
	}
	return out
}

func TestPublishFansOutToSubscribers(t *testing.T) {
	srv := newTestServer(t)
	scanner := openStream(t, srv, "7", "")

	if hello := readFrame(t, scanner); hello.event() != "hello" || !strings.Contains(hello.data(), `"7"`) {
		t.Fatalf("hello frame = %#v", hello)
	}

	out := publish(t, srv, `{"type":"state","seed":7,"minute":4315,"stateHash":"9f2c71bd"}`)
	if out.Published != 1 || out.Fanout != 1 {
		t.Fatalf("publish response = %+v, want published=1 fanout=1", out)
	}

	frame := readFrame(t, scanner)
	if frame.id() != "00004315" {
		t.Errorf("id = %q, want 00004315", frame.id())
	}
	if frame.event() != "state" {
		t.Errorf("event = %q, want state", frame.event())
	}
	if !strings.Contains(frame.data(), `"minute":4315`) {
		t.Errorf("data = %q, want the compacted payload", frame.data())
	}
}

func TestStreamOnlySeesItsTopic(t *testing.T) {
	srv := newTestServer(t)
	scanner := openStream(t, srv, "7", "")
	readFrame(t, scanner) // hello

	if out := publish(t, srv, `{"type":"state","seed":8,"minute":1}`); out.Fanout != 0 {
		t.Fatalf("fanout to topic 8 = %d, want 0", out.Fanout)
	}
	publish(t, srv, `{"type":"state","seed":7,"minute":2}`)

	frame := readFrame(t, scanner)
	if frame.id() != "00000002" {
		t.Fatalf("received event %q, want topic 7's minute 2", frame.id())
	}
}

func TestStreamReplaysAfterLastEventID(t *testing.T) {
	srv := newTestServer(t)
	for minute := 1; minute <= 3; minute++ {
		publish(t, srv, fmt.Sprintf(`{"type":"state","seed":9,"minute":%d}`, minute))
	}

	scanner := openStream(t, srv, "9", "00000001")
	if hello := readFrame(t, scanner); hello.event() != "hello" {
		t.Fatalf("first frame = %#v, want hello", hello)
	}

	if frame := readFrame(t, scanner); frame.id() != "00000002" {
		t.Fatalf("first replayed id = %q, want 00000002", frame.id())
	}
	if frame := readFrame(t, scanner); frame.id() != "00000003" {
		t.Fatalf("second replayed id = %q, want 00000003", frame.id())
	}
}

func TestPublishRejectsOversizePayload(t *testing.T) {
	srv := newTestServer(t)
	body := `{"type":"state","seed":1,"pad":"` + strings.Repeat("x", maxPublishBytes) + `"}`

	resp, err := http.Post(srv.URL+"/publish", "application/json", strings.NewReader(body))
	if err != nil {
		t.Fatalf("publish: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusRequestEntityTooLarge {
		t.Fatalf("status = %d, want 413", resp.StatusCode)
	}
}

func TestPublishRejectsInvalidJSON(t *testing.T) {
	srv := newTestServer(t)
	resp, err := http.Post(srv.URL+"/publish", "application/json", strings.NewReader(`{"seed":`))
	if err != nil {
		t.Fatalf("publish: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", resp.StatusCode)
	}
}

func TestHealthzReportsClientsAndTopics(t *testing.T) {
	srv := newTestServer(t)
	scanner := openStream(t, srv, "3", "")
	readFrame(t, scanner) // hello
	publish(t, srv, `{"type":"state","seed":3,"minute":10}`)

	resp, err := http.Get(srv.URL + "/healthz")
	if err != nil {
		t.Fatalf("healthz: %v", err)
	}
	defer resp.Body.Close()

	var health healthResponse
	if err := json.NewDecoder(resp.Body).Decode(&health); err != nil {
		t.Fatalf("decode healthz: %v", err)
	}
	if !health.OK || health.Clients != 1 || health.Topics != 1 {
		t.Fatalf("healthz = %+v, want ok with 1 client and 1 topic", health)
	}
}

func TestPublishKeepsIDsMonotonicPerTopic(t *testing.T) {
	hub := NewHub(4)
	sub, _ := hub.Subscribe("1", "")
	defer hub.Unsubscribe(sub)

	hub.Publish("1", "state", []byte(`{}`), 5)
	hub.Publish("1", "state", []byte(`{}`), 5)

	first := <-sub.Events()
	second := <-sub.Events()
	if first.ID != "00000005" || second.ID != "00000006" {
		t.Fatalf("ids = %s, %s; want 00000005, 00000006", first.ID, second.ID)
	}
}

func TestSlowSubscriberIsDroppedInsteadOfBlockingPublisher(t *testing.T) {
	hub := NewHub(0)
	sub, _ := hub.Subscribe("1", "")
	defer hub.Unsubscribe(sub)

	done := make(chan int, 1)
	go func() {
		for i := 0; i < subscriberBuffer+1; i++ {
			hub.Publish("1", "state", []byte(`{}`), uint64(i+1))
		}
		done <- hub.Publish("1", "state", []byte(`{}`), 999)
	}()

	select {
	case fanout := <-done:
		if fanout != 0 {
			t.Fatalf("fanout after drop = %d, want 0", fanout)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("publisher blocked on a slow subscriber")
	}

	// Draining the closed channel terminates, which is what the HTTP handler
	// sees before it returns and lets the client reconnect with a cursor.
	for range sub.Events() {
	}
}
