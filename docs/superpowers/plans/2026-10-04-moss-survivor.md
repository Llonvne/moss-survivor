# Moss Survivor Implementation Plan

> Implement inline using the executing-plans workflow.

**Goal:** Deliver the approved playable survival game and source repository.
**Architecture:** Pure TypeScript simulation owns movement, collision, progression and run state. Phaser renders the state and handles keyboard/pointer input. HTML controls own start, upgrades, pause and result overlays.
**Tech Stack:** Phaser 3, TypeScript, Vite, Node test runner.
**Spec:** `docs/design.md`

## Global Constraints
- One arena, one hero, three enemies, three-choice upgrades, boss and five-minute goal.
- Desktop keyboard and mobile touch; no backend or external artwork dependency.
- GitHub public; Sites audience remains its default unless separately requested.

## Review Focus
- Diagonal input must not increase speed: simulation test.
- Pause and upgrade selection must freeze damage and elapsed time: simulation tests.
- Restart must clear enemies and upgrades: simulation test and browser smoke.
- Death must not transition to victory on the same frame: simulation test.
- Touch cancellation and resize must not leave movement stuck: browser touch smoke.

## Task 1: Simulation
- [ ] Write tests in `tests/model.test.ts` for initial state, movement, attacks, damage, upgrades, boss timing and reset; run to observe failure.
- [ ] Implement `src/model.ts`: `Run` with `start`, `update(dt,input)`, `chooseUpgrade(id)`, `pause`, `resume`; state is exposed for rendering.
- [ ] Run `npm test` until green.

## Task 2: Playable surface
- [ ] Add Phaser scene in `src/scene.ts`, generated pixel textures in `src/art.ts`, DOM UI in `src/main.ts`, responsive stylesheet and favicon.
- [ ] Run `npm run build`; browser-check start, automatic kills, upgrade selection, pause, restart and touch movement.

## Task 3: Delivery
- [ ] Document controls and local development; commit and push to GitHub.
- [ ] Register one Sites project, package verified static output, deploy and verify terminal success.

## Execution ledger
- Scope and stack approved in conversation; proceed without asking for duplicate approval.
- GitHub repo verified public and empty. New isolated checkout used.
- Sites helper scripts are not present in this environment; inspect supported tool route before delivery.
