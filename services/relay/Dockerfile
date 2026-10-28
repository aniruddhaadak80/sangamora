# syntax=docker/dockerfile:1
# sangamora relay — static Go binary, distroless runtime.
#
#   docker build -t sangamora-relay services/relay
#   docker run -p 7331:7331 -e RELAY_PORT=7331 sangamora-relay

FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/relay .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/relay /relay
EXPOSE 7331
USER nonroot:nonroot
ENTRYPOINT ["/relay"]
