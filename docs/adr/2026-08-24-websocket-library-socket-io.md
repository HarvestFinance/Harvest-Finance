# ADR — WebSocket Library: Socket.IO via @nestjs/platform-socket.io

- **Date:** 2026-08-24
- **Status:** Accepted

## Context

The product needs push updates for live dashboards: platform/farmer metrics
alerts and per-vault activity streams (deposits, withdrawals, harvests,
milestones). The HTTP API alone cannot deliver low-latency fan-out, and the
team wanted room/namespace semantics with fallback transports for
restrictive networks.

> **Provenance note:** historical deliberation is not recorded; this ADR
> captures the observed architecture and the rationale going forward.

## Decision

The project uses **Socket.IO** through NestJS's official wrappers
(`@nestjs/websockets`, `@nestjs/platform-socket.io`):

- Two gateways in `src/realtime/`:
  - `RealtimeGateway` (namespace `/realtime`) — admin and farmer rooms,
    metrics/alert broadcasts.
  - `VaultGateway` (namespace `vault-activity`) — JWT-authenticated
    handshake, ownership-checked `subscribe:vault` rooms, vault activity
    events.
- `main.ts` sets the default adapter:
  `app.useWebSocketAdapter(new IoAdapter(app))`.
- Socket.io server lifecycle is closed during graceful shutdown.

**Single-instance constraint:** no Redis socket.io adapter is installed
(`@socket.io/redis-adapter` is absent), so WebSocket fan-out is tied to the
single backend process. Horizontal scaling requires adding the Redis
adapter first (see [deployment-runbook.md](../deployment-runbook.md)).

## Alternatives Considered

| Alternative | Trade-off |
|-------------|-----------|
| **Raw `ws`** | Lighter, but no rooms/namespaces/reconnection semantics out of the box; every concern becomes custom code |
| **Server-Sent Events** | One-way only — insufficient for subscribe/unsubscribe control messages used by the vault gateway |
| **SockJS + STOMP** | Legacy ecosystem, weaker NestJS integration |
| **Managed push (Ably/Pusher/Firebase)** | External cost/vendor dependency for a self-hosted-first deployment model |

## Consequences

- **Benefits:** first-class NestJS gateway decorators/guards; rooms map
  naturally to per-vault subscriptions; automatic reconnection and polling
  fallback improve behavior on flaky mobile connections common among field
  users.
- **Costs:** sticky sessions or a shared adapter become mandatory once more
  than one backend replica serves WebSockets; today's rolling deploy
  (`--scale backend=2`) works only because WS clients reconnect to whichever
  instance holds their rooms' state — per-vault emits originate from the
  same process that handled the mutation.
- **Operational implications:** load balancers must forward
  `Upgrade: websocket` headers; monitor connection counts when scaling
  replicas (see runbook).
