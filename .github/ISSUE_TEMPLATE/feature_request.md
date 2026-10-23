---
name: Feature request
about: Propose a new simulation capability, visual layer, or locale addition
title: "[feat]: "
labels: ["enhancement"]
assignees: []
---

### Problem it solves

<!-- What can't a pilgrim-marshal (the operator watching the crowd) do today? -->

### Proposed solution

<!-- API shape, UI sketch, or generator behavior — concrete beats vague. -->

### Determinism contract

- Does the proposal change engine output for a given `MELA_SEED`?
  - [ ] No — pure presentation / agent machinery
  - [ ] Yes — core math change, needs a parity fixture in `packages/core` **and** `crates/flow`

### Alternatives considered

-

### Scope check

- [ ] Works without any API key (hard requirement)
- [ ] Fits the existing folder map (see CONTRIBUTING.md)
- [ ] Testable in vitest / pytest / `cargo test` / `go test`

### Open questions

-
