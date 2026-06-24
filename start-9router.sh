#!/usr/bin/env bash
# Start 9Router AI Gateway
# Binds to 0.0.0.0:20128 agar semua Docker container bisa akses via host.docker.internal

export PORT=20128
export HOSTNAME=0.0.0.0
export NODE_ENV=production

9router --log --skip-update "$@"
