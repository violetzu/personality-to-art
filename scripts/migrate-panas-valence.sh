#!/bin/sh
set -e
export $(cat "$(dirname "$0")/../.env" | grep -v '^#' | xargs)
node "$(dirname "$0")/migrate-panas-valence.mjs"
