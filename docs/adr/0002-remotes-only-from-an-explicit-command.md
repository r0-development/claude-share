# Hooks and the timer touch only the share; project remotes are pushed only by a command the user typed

Claude Code hooks (Stop, SessionStart) and the 15-minute timer keep the share in sync unattended, so memory, plans and
settings follow the user without any command. They never push to a project's remote. Handoffs, `.env` values and
real-branch pushes happen only inside `cs sync`, which shows a plan screen and asks for one confirmation before touching
any remote. Reason: project remotes are often owned by an employer or client; work must never leave a machine without
the user's explicit consent, and a background job cannot ask. This is deliberate — do not "improve" the hooks to push
handoffs automatically.

Kept on 2026-09-17 (issue #18), when the share cycle became one entry point (`syncShare` in `src/sharesync.ts`) for
`cs sync`, the hooks and the timer: what differs is only the `ask` function `cs sync` passes for a file changed on both
machines. The hook path calls the share cycle and nothing else — it never receives a Checkout or an `ask`, so it can
neither reach a project remote nor stall on a question.
