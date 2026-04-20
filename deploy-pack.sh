#!/usr/bin/env bash
# 在來源機器執行：建置 Docker image、匯出 DB、打包成 deploy.tar.gz
set -euo pipefail

PACK_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT="$PACK_DIR/deploy.tar.gz"
STAGING="$PACK_DIR/.deploy_staging"

cd "$PACK_DIR"

echo "==> 清理暫存..."
rm -rf "$STAGING"
mkdir -p "$STAGING"

# ── 1. 建置 image ───────────────────────────────────────────────
echo "==> 建置 Docker image..."
docker compose build --no-cache

# ── 2. 儲存 image ───────────────────────────────────────────────
echo "==> 匯出 image（可能需要幾分鐘）..."
mkdir -p "$STAGING/docker_images"

NEXTJS_IMAGE=$(docker compose images -q nextjs 2>/dev/null | head -1 || true)
FLUX_IMAGE=$(docker compose images -q flux 2>/dev/null | head -1 || true)

if [ -n "$NEXTJS_IMAGE" ]; then
  docker save "$NEXTJS_IMAGE" | gzip > "$STAGING/docker_images/nextjs.tar.gz"
  echo "   nextjs image 已儲存"
else
  echo "   [警告] 找不到 nextjs image，跳過（目標機器將重新 build）"
fi

if [ -n "$FLUX_IMAGE" ]; then
  docker save "$FLUX_IMAGE" | gzip > "$STAGING/docker_images/flux.tar.gz"
  echo "   flux image 已儲存"
else
  echo "   [警告] 找不到 flux image，跳過（目標機器將重新 build）"
fi

# ── 3. 匯出資料庫 ───────────────────────────────────────────────
echo "==> 匯出 PostgreSQL 資料庫..."
source .env 2>/dev/null || true
: "${POSTGRES_USER:=eq_user}"
: "${POSTGRES_DB:=eq_research}"

# 確保 postgres container 正在執行
if ! docker compose ps postgres | grep -q "running\|Up"; then
  echo "   啟動 postgres container..."
  docker compose up -d postgres
  echo -n "   等待 postgres 就緒..."
  for i in $(seq 1 30); do
    docker compose exec postgres pg_isready -U "$POSTGRES_USER" -q 2>/dev/null && break
    sleep 2; echo -n "."
  done
  echo ""
fi

docker compose exec -T postgres pg_dump \
  -U "$POSTGRES_USER" \
  --format=custom \
  --no-acl \
  --no-owner \
  "$POSTGRES_DB" > "$STAGING/db.dump"
echo "   資料庫匯出完成：$(du -sh "$STAGING/db.dump" | cut -f1)"

# ── 4. 複製必要檔案 ─────────────────────────────────────────────
echo "==> 複製專案檔案（排除 node_modules / data / .git）..."
rsync -a --info=progress2 \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='data' \
  --exclude='.deploy_staging' \
  --exclude='deploy.tar.gz' \
  --exclude='tsconfig.tsbuildinfo' \
  "$PACK_DIR/" "$STAGING/app/"

# 生成圖片
if [ -d data/images ] && [ "$(ls -A data/images 2>/dev/null)" ]; then
  echo "==> 複製已生成的圖片..."
  cp -r data/images "$STAGING/images_data"
fi

# ── 5. 建立目標機還原腳本 ────────────────────────────────────────
cat > "$STAGING/restore.sh" << 'RESTORE_SCRIPT'
#!/usr/bin/env bash
# 在目標機器執行：還原所有服務
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$DEPLOY_DIR/app"
cd "$APP_DIR"

echo "==> 建立目錄結構..."
mkdir -p data/images data/postgres data/hf_cache

# ── 載入 image ──────────────────────────────────────────────────
if ls "$DEPLOY_DIR"/docker_images/*.tar.gz 1>/dev/null 2>&1; then
  echo "==> 載入 Docker image..."
  for f in "$DEPLOY_DIR"/docker_images/*.tar.gz; do
    echo "   載入 $f ..."
    docker load < "$f"
  done
else
  echo "   [未找到 image] 將從原始碼重新 build..."
  docker compose build
fi

# ── 複製圖片 ────────────────────────────────────────────────────
if [ -d "$DEPLOY_DIR/images_data" ] && [ "$(ls -A "$DEPLOY_DIR/images_data" 2>/dev/null)" ]; then
  echo "==> 還原已生成的圖片..."
  cp -rn "$DEPLOY_DIR/images_data/." data/images/
fi

# ── 啟動 postgres ───────────────────────────────────────────────
echo "==> 啟動 PostgreSQL..."
docker compose up -d postgres

echo -n "   等待 postgres 就緒..."
source .env 2>/dev/null || true
: "${POSTGRES_USER:=eq_user}"
: "${POSTGRES_DB:=eq_research}"

for i in $(seq 1 30); do
  docker compose exec postgres pg_isready -U "$POSTGRES_USER" -q 2>/dev/null && break
  sleep 2; echo -n "."
done
echo " OK"

# ── 還原資料庫 ──────────────────────────────────────────────────
if [ -f "$DEPLOY_DIR/db.dump" ] && [ -s "$DEPLOY_DIR/db.dump" ]; then
  echo "==> 還原資料庫..."
  docker compose exec -T postgres psql -U "$POSTGRES_USER" -c \
    "DROP DATABASE IF EXISTS ${POSTGRES_DB}; CREATE DATABASE ${POSTGRES_DB};" 2>/dev/null || true
  docker compose exec -T postgres pg_restore \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --no-acl --no-owner --exit-on-error \
    < "$DEPLOY_DIR/db.dump"
  echo "   資料庫還原完成"
else
  echo "   [跳過] 找不到 db.dump，Prisma migrate 將建立空白資料庫"
fi

# ── 啟動所有服務 ────────────────────────────────────────────────
echo "==> 啟動所有服務..."
docker compose up -d --remove-orphans

echo ""
echo "=============================="
echo " 部署完成！"
echo "=============================="
echo " 檢查狀態：cd app && docker compose ps"
echo " 查看日誌：cd app && docker compose logs -f nextjs"
RESTORE_SCRIPT

chmod +x "$STAGING/restore.sh"

# ── 6. 打包 ────────────────────────────────────────────────────
echo "==> 打包成 deploy.tar.gz..."
tar -czf "$OUTPUT" -C "$(dirname "$STAGING")" "$(basename "$STAGING")" \
  --transform "s|$(basename "$STAGING")|deploy|"

rm -rf "$STAGING"

echo ""
echo "=============================="
echo " 打包完成！"
echo " 檔案：$OUTPUT"
echo " 大小：$(du -sh "$OUTPUT" | cut -f1)"
echo "=============================="
echo ""
echo " 傳送到目標機器："
echo "   scp deploy.tar.gz user@target:/home/user/"
echo ""
echo " 目標機器執行："
echo "   tar -xzf deploy.tar.gz"
echo "   cd deploy"
echo "   bash restore.sh"
