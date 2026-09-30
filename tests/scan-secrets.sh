#!/bin/sh
# Fails if any secret value from .env appears in a git-tracked or staged file. Prints file names only.
cd "$(dirname "$0")/.." || exit 2
[ -f .env ] || { echo "no .env to scan against"; exit 0; }
bad=0
for key in SUPABASE_SECRET_KEY SUPABASE_SERVICE_ROLE_KEY SUPABASE_DB_PASSWORD SMTP_PASS; do
  val=$(grep "^$key=" .env | cut -d= -f2-)
  [ -n "$val" ] || continue
  hits=$( (git ls-files; git diff --cached --name-only) | sort -u | while read -r f; do [ -f "$f" ] && grep -lF -- "$val" "$f"; done)
  if [ -n "$hits" ]; then echo "SECRET $key found in: $hits"; bad=1; fi
done
[ $bad -eq 0 ] && echo "secret scan clean"
exit $bad
