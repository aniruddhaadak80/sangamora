# Security Policy

## Reporting a vulnerability

**Use GitHub's private security advisory flow — never a public issue, and
never a direct email.**

1. Open [security/advisories/new](https://github.com/aniruddhaadak80/sangamora/security/advisories/new)
   (or the **Security** tab → *Report a vulnerability*).
2. Include, at minimum:
   - the affected commit / ref / release tag,
   - step-by-step reproduction or a proof of concept,
   - impact assessment (what an attacker gains),
   - environment details (runtime versions, deployment target).

This private flow also doubles as the channel for code-of-conduct reports —
same privacy guarantees, same triage.

## Supported versions

sangamora ships from a rolling trunk. Only `main` receives security fixes;
older release tags are frozen snapshots.

| Component                             | Status                                            |
| ------------------------------------- | ------------------------------------------------- |
| `main` branch (HEAD)                  | ✅ Active development — all fixes land here        |
| Latest published release tag (`v*`)   | ✅ Receives cherry-picks for severe issues when feasible |
| Any older tag / version               | ❌ Unsupported — upgrade to the latest release      |

There is no API-key surface to rotate (the project is zero-API-key by
design), so upgrading is nearly always safe and cheap.

## Areas of interest to this project specifically

- **Determinism integrity** — anything that changes output for a fixed
  `MELA_SEED` (hash-injection, seeded RNG corruption, generator tampering).
- **TS ↔ Rust parity** — a divergence that would let `crates/flow` (wasm) and
  `packages/core` disagree about the same world.
- **SSE relay (`services/relay`, Go)** — cross-origin event injection,
  unbounded broadcast fan-out/connection exhaustion, tick payload spoofing.
- **Agent service (`services/agents`, FastAPI)** — unbounded request cost,
  unsafe tool execution, injection through simulation prompts.
- **Generated content** — code executed from generated artifacts, or secrets
  accidentally encoded into generated files.
- **CI/CD** — workflow-injection via untrusted PR input (`pull_request_target`
  misuse), secret leakage into build logs.

## Response policy & SLA

| Stage                          | Target                                   |
| ------------------------------ | ---------------------------------------- |
| Acknowledgement (private ack)  | **< 72 hours** from report               |
| Triage decision                | **< 7 days** — severity, exploitability, plan |
| Fix & coordinated disclosure   | ASAP, assets merged to `main` before publishing |
| Public advisory                | After a fix ships; reporter credited (or kept anonymous on request) |

We follow GitHub's coordinated vulnerability disclosure guidance. Reporters
who responsibly disclose are credited in release notes unless they prefer
otherwise.

## Scope notes

- The sandbox is a **simulation**: there is no production Mela data, no
  credentials, and nothing internet-reachably dangerous by design — but a
  flaw that makes the sandbox lie about its determinism *is* a security bug.
- Issues with reproducible non-security bugs (crashes, wrong crowd math) do
  **not** belong here: use the issue template instead.
