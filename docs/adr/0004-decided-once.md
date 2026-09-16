# `cs sync` decides once: execution trusts the plan's facts and re-checks only the secret-file guard

Decided 2026-09-17 (issue #16). The facts about a project's checkout on this machine — its units, their branch, dirty
and unpushed counts, why a unit cannot be carried, files that look secret, the handoffs waiting on the remote — are
observed once by the Checkout module (`src/checkout.ts`) and decided on once by the pure plan (`src/plan.ts`). Every
action and question the plan produces carries the checkout, unit, handoff or `.env` state it was decided on, and the
verbs `send`, `apply` and `push` execute on exactly those objects. They do not re-derive dirty, ahead or "is anything
waiting" and they never skip or re-decide on their own; `cs handoff` and `cs resume` run the same plan with
`--overwrite` / `--replace` standing in for the plan screen's answers. Reason: the previous shape observed in one
module, decided in a second, regrouped by name in a third and re-decided in a fourth, so counts and outcomes depended on
four places agreeing, and every new command re-derived where a checkout is.

Two things are deliberately re-checked at execution time, because they are safety properties rather than decisions:
the secret-file deny list (a `.env` created while the plan screen was open must never leave the machine) and the push
lease on the handoff ref (a handoff another machine put there since the fetch is never overwritten unless the plan said
to send over that very handoff, and then it is backed up first). The losing side of any overwrite goes to a
`refs/cs/backup/…` ref inside the verb, never left to the caller.

## Considered options

- Re-verify dirty / ahead in the verbs "for safety". Rejected: it reintroduces the double decision; a tree that became
  clean between plan and execution sends an empty snapshot, which is harmless, whereas a second opinion that disagrees
  with the plan screen the user just confirmed is not.
- A Checkout class with methods. Rejected: the codebase is functions over data everywhere; a plain record is
  JSON-able in tests and the verbs take exactly what they need.
