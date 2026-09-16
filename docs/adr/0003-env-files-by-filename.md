# `.env` files travel by filename convention, values merge per key, newest wins

Decided 2026-09-16. Which `.env*` files `cs sync` carries is decided by the filename and git status, with no per-project
question: files git tracks (`.env.example`) are git's business; gitignored `.env`, `.env.production`, … travel with their
values, encrypted in the share; gitignored `*.local` files (`.env.local`, `.env.*.local`) travel **keys only** — a new
key appears on the other machine with the value from `.env.example` if one exists, else empty, and `cs` reports keys
still to fill. Values merge per key with newest-wins; only a key changed on both sides since the last sync prompts.
Reason: `.local` files hold site-specific values (IPs, ports) that must differ per machine, while the *set* of keys
must not drift; per-key merge never loses an unrelated key. A per-project `env = false` opts out; `env.local = [...]`
names extra site-specific files.
