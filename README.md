# personality-to-art

心理量表與 AI 藝術生成研究平台。受試者填寫 TIPI、PANAS 與自我描述後，系統依作答結果合成 prompt，並呼叫本地 FLUX.1 服務生成個人化圖像。

## 系統架構

```
                  ┌─────────────┐
  受試者 / 管理員 │   nextjs    │ Next.js App Router (port 3000)
  ─────────────▶  │  (web+ai+db)│
                  └──┬──────┬───┘
                     │      │
              ┌──────┘      └──────────┐
              ▼                        ▼
        ┌──────────┐            ┌────────────┐
        │ postgres │            │    flux    │ FastAPI + FLUX.1-dev
        │  (db)    │            │   (ai)     │ GPU 推論
        └──────────┘            └────────────┘

  cloudflared (web) ── 對外 Tunnel，不直接暴露 port
```

三個隔離網路：`db`（postgres ↔ nextjs）、`ai`（flux ↔ nextjs）、`web`（nextjs ↔ cloudflared）。

## 功能

- 公開填答，受試者不需帳號。
- 問卷題目、計分規則、快速標籤、文案由資料庫動態設定。
- Big Five 依資料庫中 `tipiScoring` 即時計算。
- 依 Big Five + PANAS 合成英文 prompt，送至 FLUX.1-dev 生圖。
- 結果頁使用帶時效的 participant token 控制存取。
- 管理後台：統計、受試者查閱與刪除、CSV 匯出、問卷設定、測試生圖、畫作重新分析。

## 技術棧

- **前後端**：Next.js 16, React 19, TypeScript, Tailwind CSS
- **資料庫**：PostgreSQL 16 + Prisma 7
- **圖像生成**：FastAPI + Diffusers + FLUX.1-dev（本地 GPU）
- **部署**：Docker Compose + Cloudflare Tunnel

## 需求

- Docker + Docker Compose v2
- NVIDIA GPU + NVIDIA Container Toolkit
- Hugging Face 帳號，且已在 [black-forest-labs/FLUX.1-dev](https://huggingface.co/black-forest-labs/FLUX.1-dev) 接受授權
- 可用的 OpenAI 相容 chat / vision API

## 快速開始

### 1. 初始化

```bash
make setup
```

建立 `.env`（從 `.env.example` 複製）與 `data/` 目錄。

### 2. 編輯 `.env`

最少需填寫：

| 變數 | 說明 |
|------|------|
| `POSTGRES_PASSWORD` | 資料庫密碼 |
| `ADMIN_PASSWORD` | 管理員登入密碼 |
| `SESSION_SECRET` | Cookie 簽章密鑰，至少 32 字元（`openssl rand -hex 32`）|
| `FLUX_API_SECRET` | nextjs ↔ flux 內部認證密鑰（`openssl rand -hex 32`）|
| `CHAT_API_ENDPOINT` | 提示詞合成 / 畫作分析 API 端點 |
| `CHAT_API_KEY` | 上述 API 金鑰 |
| `CHAT_MODEL_NAME` | 提示詞合成模型名稱 |
| `VISION_MODEL_NAME` | 畫作分析模型名稱 |
| `HF_TOKEN` | Hugging Face token |

選填：

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `POSTGRES_USER` | `eq_user` | 資料庫使用者 |
| `POSTGRES_DB` | `eq_research` | 資料庫名稱 |
| `FLUX_MODEL_ID` | `black-forest-labs/FLUX.1-dev` | FLUX 模型 |
| `FLUX_GUIDANCE_SCALE` | `3.5` | Guidance scale |
| `FLUX_MAX_SEQUENCE_LENGTH` | `512` | 最大序列長度 |
| `FLUX_QUANT` | `bf16` | 量化模式：`bf16`（~32GB）、`int8`（~21GB）、`int4`（~16GB）|
| `CLOUDFLARE_TUNNEL_TOKEN` | — | Cloudflare Tunnel token |
| `APP_ORIGIN` | — | 生產環境允許的 origin，用於 POST API origin 檢查 |
| `ALLOWED_DEV_ORIGINS` | — | 開發模式額外允許的 origin，逗號分隔 |

### 3. 啟動

```bash
make up
```

啟動 `postgres`、`flux`、`nextjs`、`cloudflared`。`nextjs` 容器啟動時會自動套用 migration 後執行應用。

FLUX 模型首次啟動需從 Hugging Face 下載（視網速約 10–30 分鐘），下載後快取於 `data/hf_cache/`。

```bash
make ps    # 查看容器狀態
make logs  # 追蹤 nextjs / flux 日誌
```

## 開發模式

```bash
make dev-up    # 啟動 Docker hot-reload 模式（next dev）
make dev-down
```

使用 `docker-compose.dev.yml` 覆寫 nextjs 服務：掛載整個工作目錄，使用 `npm run dev`。

## 容器啟動流程

### nextjs

1. entrypoint 以 root 修正 `data/images` 目錄權限，降權為 `appuser`（UID 1001）
2. `prisma migrate deploy`
3. `node server.js`

### flux

1. 載入 FLUX.1 模型至 GPU（首次需下載）
2. FastAPI 監聽 `0.0.0.0:8000`（僅限 `ai` 網路）

## 專案結構

```
.
├── src/
│   ├── app/
│   │   ├── admin/          # 管理後台
│   │   ├── api/            # API routes
│   │   ├── survey/         # 問卷頁
│   │   ├── generating/     # 生圖等待頁
│   │   ├── result/         # 結果頁
│   │   └── done/           # 完成頁
│   ├── components/         # 共用 UI 元件
│   └── lib/                # auth, db, llm, flux, session-token...
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── flux-api/               # FLUX FastAPI 服務
├── data/                   # 圖片、Postgres volume、HF cache（gitignore）
├── entrypoint.sh           # nextjs 容器啟動腳本
├── Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml
└── Makefile
```

## 資料表

### `Participant`
基本資料（姓名、年齡、性別）、TIPI 10 題原始分數、PANAS 12 題原始分數、Big Five 計算結果（`extraversion`, `agreeableness`, `conscientiousness`, `stability`, `openness`）、自我描述。

### `Prompt`
關聯 Participant、生成 prompt 文字、圖片路徑、畫作分析結果。

### `Setting`
key/value 動態設定，管理後台可調整：`maxRetries`, `fluxSteps`, `tipiQuestions`, `tipiScoring`, `panasItems`, `quickTags`, `descriptions`。

## API

### 公開

| Method | Path | 說明 |
|--------|------|------|
| `POST` | `/api/participant` | 建立受試者 |
| `POST` | `/api/generate` | 觸發生圖 |
| `GET` | `/api/participant/:id/latest-prompt` | 查詢最新 prompt 狀態 |
| `GET` | `/api/images/:filename` | 取得圖片（需 token）|

### 管理（需 `eq_admin` cookie）

| Method | Path | 說明 |
|--------|------|------|
| `POST` | `/api/admin/login` / `logout` | 登入 / 登出 |
| `GET` | `/api/admin/check` | 驗證登入狀態 |
| `GET` | `/api/admin/participants` | 列出受試者 |
| `GET` / `DELETE` | `/api/admin/participants/:id` | 查閱 / 刪除 |
| `GET` | `/api/admin/stats` | 統計數據 |
| `GET` / `POST` | `/api/admin/settings` | 讀取 / 更新設定 |
| `GET` | `/api/admin/export` | 匯出 CSV |
| `POST` | `/api/admin/test-generate` | 測試生圖 |
| `POST` | `/api/admin/analyze/:promptId` | 重新分析畫作 |

## 常用指令

```bash
make setup      # 初始化 .env 與 data 目錄
make up         # 啟動整個 stack
make down       # 關閉服務
make dev-up     # 啟動開發模式
make dev-down   # 關閉開發模式
make ps         # 查看容器狀態
make logs       # 追蹤 nextjs / flux 日誌

npx prisma studio                    # 開啟 Prisma GUI（需設定 POSTGRES_HOST）
npx prisma migrate dev --name <name> # 建立新 migration
npx tsc --noEmit                     # 型別檢查
```

## 疑難排解

**FLUX 啟不起來**
- 確認 NVIDIA Container Toolkit 已安裝（`nvidia-smi` 可正常執行）
- 確認 `HF_TOKEN` 有效且已接受 FLUX.1-dev 授權
- `docker compose logs -f flux` 查看模型載入錯誤

**nextjs 啟動後無法寫入圖片**
- 確認 `make setup` 已執行；若 `data/images` 已存在且為 root 所有，容器 entrypoint 會自動修正。

**本機執行 prisma cli 時連線失敗**
- 確認 postgres 容器已啟動
- 在 `.env` 加入 `POSTGRES_HOST=localhost`，或直接填寫完整 `DATABASE_URL`
