# Where Should We Go?

A web page for deciding a group trip by vote. One person creates a trip and lists the candidate activities. Friends open the link and vote. When voting closes, the top-voted activities become the confirmed itinerary.

Requirements are in [docs/PRD.md](docs/PRD.md).

Status: Milestone 0 complete. Supabase project created and linked. Nothing is deployed yet.

## Layout

- `index.html`: the page (added in milestone 1)
- `supabase/`: database schema and rules as SQL files
- `tests/`: automated tests; results are saved to `tests/REPORT.md` before every deploy

## Secrets

This repository is public. It holds no passwords or service keys. The Supabase project URL and public key used by the page are designed to be public.
