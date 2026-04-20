#!/bin/sh
set -e
mkdir -p data/images
chown 1001:1001 data/images
exec su-exec appuser "$@"
