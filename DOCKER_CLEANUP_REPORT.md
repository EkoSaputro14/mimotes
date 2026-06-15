# Docker Storage Cleanup Report

**Date:** 2026-06-14
**VHDX:** `C:\Users\SMANSA\AppData\Local\Docker\wsl\disk\docker_data.vhdx`

---

## Before Cleanup

| Category | Size | Reclaimable |
|----------|------|-------------|
| Images | 85.25 GB | 15.65 GB |
| Containers | 274.7 MB | 204.4 MB |
| Volumes | 2.46 GB | 0 B |
| Build Cache | 26.43 GB | 20.53 GB |
| **Total** | **~114 GB** | **~36.4 GB** |

**Root Cause:** 114 dangling images from repeated `docker compose build --no-cache` runs + 26 GB accumulated build cache.

---

## Cleanup Executed

### Step 1: Removed 9 orphaned stopped containers
- `gifted_swirles`, `funny_cartwright`, `youthful_turing`, `condescending_goldwasser`, `strange_gauss`, `laughing_knuth`, `elegant_dubinsky`, `determined_goldberg`, `ollama_hermes_proxy_docker`
- All were exited (error) containers from old builds, 3 days to 3 weeks old

### Step 2: Removed all dangling images
- `docker image prune -f`
- Unreferenced `<none>:<none>` images cleaned up
- **Freed: ~70 GB of image data**

### Step 3: Removed all build cache
- `docker builder prune -a`
- 259 build cache entries deleted
- **Freed: 26.43 GB**

### Step 4: Removed orphaned network
- `ai-agent-proxy_default` — no containers using it

---

## After Cleanup

| Category | Before | After | Saved |
|----------|--------|-------|-------|
| Images | 85.25 GB | 15.55 GB | **69.7 GB** |
| Containers | 274.7 MB | 70.3 MB | 204 MB |
| Build Cache | 26.43 GB | 0 B | **26.43 GB** |
| C: free space | 0 GB | 7.4 GB | **7.4 GB** |

**Total data removed from WSL: ~96 GB**

---

## What Was Preserved (DO NOT DELETE)

| Item | Type | Why |
|------|------|-----|
| `mimotes_postgres_data` | Volume | PostgreSQL database |
| `mimotes_uploads_data` | Volume | User uploaded files |
| `mimotes-app:latest` | Image | Current app build |
| `mimotes-migrate:latest` | Image | DB migration |
| `mimotes-paddleocr:latest` | Image | OCR service |
| All running containers | Container | Active services |

---

## Remaining Active Images (15.55 GB)

| Image | Size |
|-------|------|
| ghcr.io/open-webui/open-webui:main | 6.7 GB |
| mimotes-paddleocr | 2.68 GB |
| jc21/nginx-proxy-manager | 1.59 GB |
| mimotes-migrate | 1.95 GB |
| pgvector/pgvector:pg16 | 621 MB |
| mimotes-app | 608 MB |
| searxng/searxng | 375 MB |
| qdrant/qdrant | 274 MB |
| redis:alpine | 134 MB |
| node:20-alpine | 194 MB |
| python:3.11-slim | 186 MB |
| adguard/adguardhome | 110 MB |
| cloudflare/cloudflared | 93.9 MB |
| netbirdio/netbird | 70 MB |

---

## VHDX Compaction (Required to Shrink File)

The VHDX file is still 108 GB on disk because dynamically expanding VHDs
**never auto-shrink**. You must compact it manually.

### Instructions

```powershell
# 1. Stop Docker Desktop completely
#    Right-click tray icon → Quit Docker Desktop

# 2. Shutdown WSL
wsl --shutdown

# 3. Verify all WSL distros are stopped
wsl -l -v
# Both should show "Stopped"

# 4. Compact using PowerShell (Hyper-V module)
Optimize-VHD -Path "C:\Users\SMANSA\AppData\Local\Docker\wsl\disk\docker_data.vhdx" -Mode Full

# If Optimize-VHD is not available, use diskpart:
# open diskpart as Administrator, then:
# select vdisk file="C:\Users\SMANSA\AppData\Local\Docker\wsl\disk\docker_data.vhdx"
# compact vdisk
# exit

# 5. Restart Docker Desktop
```

**Expected result:** VHDX should shrink from ~108 GB to ~15-20 GB
(actual Docker data after cleanup is only ~18 GB).

---

## Prevention: Limit Future Growth

Add `C:\Users\SMANSA\.wslconfig` to prevent unbounded growth:

```ini
[wsl2]
memory=8GB
swap=2GB
```

And stop using `--no-cache` for every build. Use normal `docker compose build`
which reuses cached layers, or manually prune after `--no-cache` builds:

```bash
docker builder prune -a --filter "until=72h"
```
