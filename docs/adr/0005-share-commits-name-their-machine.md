# Share commits name their machine in a `Cs-Machine` trailer; `stampOf` reads it back

Decided 2026-09-17 (issue #17). Every commit cs makes in the share goes through the Share module's `commit`
(`src/share.ts`), which appends a `Cs-Machine: <machine>` trailer to the message — the same trailer a handoff carries.
`stampOf(share, file)` is the one decoder: for a committed, unmodified file it returns the commit's time and that
machine; for a file modified since (or never committed) its mtime and no machine. Bare `cs` and the `.env` merge use
it to say whose value is newest ("take 2 keys from desk"). History from before the trailer still decodes, in this
order: the trailer, then the `sync(<machine>): …` subject cs sync has always used, then a `cs@<machine>` author email.
Subjects stay as they were — `sync(desk): 3 file(s) …`, `projects: add x`, `remove x` — for people reading `git log`.

Reason: before this, "commit as this machine" was spelled at fifteen sites as `git.commit(repo, …, "cs", "cs@<machine>")`,
and the decoder in the `.env` observer parsed two formats back. The author email is only a fallback git uses when the
share resolves no identity of its own, so on a machine with a global git identity every non-sync commit carried no
machine at all and the merge reported "in the share" instead of the machine. A trailer is written regardless of
identity, survives a rebase, and has a decoder with a unit test (`tests/share.test.ts`).

## Considered options

- Keep the author-email encoding and just centralise it. Rejected: it stays wrong wherever git resolves an identity,
  which is the common case outside the e2e script.
- Prefix every subject with `<machine>:` like the sync commits. Rejected: it changes what a person reads in the share's
  log for no gain over a trailer, and old subjects would still need the fallback decoder.
- Author every share commit as `cs@<machine>` unconditionally (`--author`). Rejected: the share's history would stop
  naming the person; the machine is metadata, not authorship.
