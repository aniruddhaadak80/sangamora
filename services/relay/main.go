// Command relay is sangamora's pure-fan-out SSE hub.
//
// It computes nothing: /publish ingests one compacted JSON event, the hub fans
// it out to every /stream subscriber on the same seed topic, and /healthz
// reports liveness. See docs/api/relay-sse.md for the wire contract.
package main

import (
	"context"
	"errors"
	"flag"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	addr := flag.String("addr", defaultAddr(), "listen address (default :7331, or :$RELAY_PORT)")
	history := flag.Int("history", 1024, "events kept per topic for Last-Event-ID replay")
	// Advisory only: publishers are expected to tick about once a second, but
	// bursts are accepted by design.
	flag.Duration("publish-rate", time.Second, "advisory publish interval (does not throttle)")
	flag.Parse()

	logger := log.New(os.Stdout, "relay ", log.LstdFlags|log.LUTC)
	server := &http.Server{
		Addr:              *addr,
		Handler:           NewServer(NewHub(*history), logger),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		logger.Printf("listening on %s", *addr)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Fatalf("serve: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		logger.Printf("shutdown: %v", err)
	}
}

func defaultAddr() string {
	if port := os.Getenv("RELAY_PORT"); port != "" {
		return net.JoinHostPort("", port)
	}
	return ":7331"
}
