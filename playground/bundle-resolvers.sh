#!/usr/bin/env bash
set -euo pipefail

# Bundles every handler.ts under amplify/data/resolvers/** using esbuild
# and writes handler.js next to each source file.
#
# Usage:
#   ./amplify/data/bundle-resolvers.sh
#
# Requirements:
# - pnpm available (corepack enable / corepack prepare pnpm@latest --activate)
# - esbuild installed in the project (pnpm add -D esbuild)

SEARCH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/resolvers"

if [ ! -d "$SEARCH_DIR" ]; then
  echo "No resolvers directory found at: $SEARCH_DIR" >&2
  exit 0
fi

echo "Searching for handler.ts files under: $SEARCH_DIR"

# echo "Running type checking on amplify/data/resolvers ..."
# pnpm exec -- tsc --project ./amplify/data/tsconfig.json --noEmit || {
#   echo "Type checking failed in amplify/data/resolvers. Please fix the errors." >&2
#   exit 1
# }

# echo "Running linter on amplify/data/resolvers/ to ensure no new issues were introduced..."
# pnpm eslint ./playground/resolvers --fix --ext ts,json,graphql || {
#   echo "Linting errors found in ./playground/resolvers. Please fix them." >&2
#   exit 1
# }

EXIT_CODE=0
while IFS= read -r -d '' file; do
  if [ EXIT_CODE -ne 0 ]; then
    echo "Skipping remaining files due to previous errors." >&2
    break
  fi
  
  outfile="${file%.ts}.js"
  echo "\nBundling: $file to $outfile" 

  npx tsdown "$file" --config tsdown.resolvers.config.ts \
    -d "$(dirname "$outfile")" \
    --outfile "$outfile" \
    --log-level=info || {
      echo "tsdown build failed for $file" >&2
      EXIT_CODE=1
      continue
    }

  echo "Wrote: $outfile"

done < <(find "$SEARCH_DIR" -type f -name '*handler.ts' -print0)

if [ "$EXIT_CODE" -ne 0 ]; then
  echo "One or more bundling operations failed." >&2
  exit "$EXIT_CODE"
fi

echo "Done. Bundled resolvers placed next to each handler.ts (handler.js)."
exit "$EXIT_CODE"
