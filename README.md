# 智遊台灣 Smart Taiwan

智遊台灣是一個以 React + Vite 為前端、FastAPI 為後端的台灣旅遊行程規劃系統。使用者可以註冊或以 Google 登入，依照城市、天數、同行人數與偏好取得景點推薦，產生並管理旅遊行程。

## 專案結構

```text
Smart_Taiwan/
├─ backend/
│  ├─ main.py                 FastAPI 應用程式與行程 API
│  ├─ auth_routes.py          註冊、登入、Google OAuth、帳號管理
│  ├─ auth.py                 JWT 與密碼雜湊
│  ├─ database.py             Railway / Aiven MySQL 連線與初始化
│  ├─ profile_routes.py       個人資料 API
│  ├─ smart_tour_engine.py    景點查詢與 Gemini 行程產生
│  ├─ test_databases.py       資料庫連線檢查
│  └─ DATABASE_SETUP.md       雙資料庫設定說明
├─ frontend/
│  ├─ src/App.jsx             登入狀態與頁面切換
│  ├─ src/pages/Home.jsx      首頁
│  ├─ src/pages/AuthPage.jsx  登入與註冊
│  ├─ src/pages/Dashboard.jsx 行程、分享與管理介面
│  └─ src/services/           認證與個人資料 API client
├─ HANDOFF.md                 開發交接與待辦事項
└─ test_models.py             Gemini 模型基本測試
```

## 需求

- Python 3.10+
- Node.js 18+
- npm
- 兩個 MySQL 資料庫：帳號資料庫與旅遊資料庫
- Gemini API key
- Google OAuth Web Client ID（只有使用 Google 登入時需要）

## 後端設定

在 `backend/.env` 建立環境變數。不要將 `.env` 或任何 API key、資料庫密碼提交到 Git。

```env
# Railway：使用者、登入與行程資料
AUTH_DB_HOST=
AUTH_DB_PORT=3306
AUTH_DB_USER=
AUTH_DB_PASSWORD=
AUTH_DB_NAME=
AUTH_DB_SSL=false

# Aiven：景點、交通與旅遊資料
TRAVEL_DB_HOST=
TRAVEL_DB_PORT=3306
TRAVEL_DB_USER=
TRAVEL_DB_PASSWORD=
TRAVEL_DB_NAME=
TRAVEL_DB_SSL=true
TRAVEL_DB_SSL_CA=

# SmartTourEngine 目前仍使用 DB_* 查詢旅遊資料；可先填入對應的旅遊資料庫
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=

# AI，可使用逗號分隔多組 key，或使用 GEMINI_API_KEY / GEMINI_API_KEY_1...
GEMINI_API_KEYS=

# JWT
JWT_SECRET=
JWT_EXPIRE_HOURS=24
```

`AUTH_DB_*` 是帳號資料庫設定；`TRAVEL_DB_*` 是旅遊資料庫設定。Railway 若使用 Public Networking，請填入公開 host，不要使用 `mysql.railway.internal`。完整資料庫注意事項請參考 [backend/DATABASE_SETUP.md](backend/DATABASE_SETUP.md)。

安裝並啟動後端：

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
python backend\test_databases.py
python -m uvicorn main:app --app-dir backend --reload --port 8000
```

API 文件：<http://127.0.0.1:8000/docs>

如果使用現有的 `.venv-1`，可以直接啟用：

```powershell
.\.venv-1\Scripts\Activate.ps1
```

## 前端設定與啟動

```powershell
cd frontend
npm install
npm run dev
```

Vite 預設會在 <http://localhost:5173> 啟動。

前端目前有多個 API client，API URL 尚未完全集中：`profile.js` 支援 `VITE_API_BASE_URL`，但認證、Dashboard 仍有部分 URL 寫在程式碼中。部署或更換後端網址前，請先閱讀 [HANDOFF.md](HANDOFF.md) 的高優先級待辦。

正式建置：

```powershell
npm run build
npm run preview
```

## 主要功能

- Email / 密碼註冊與登入
- Google 登入
- JWT 登入狀態驗證
- AI 景點推薦
- AI 產生、修改旅遊行程
- 儲存、重新命名、刪除個人行程
- 分享行程與瀏覽分享內容
- 個人資料修改
- 管理員使用者清單與刪除功能

## 主要 API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google-login`
- `GET /api/auth/me`
- `GET|PUT /api/profile`
- `POST /api/v1/recommend-spots`
- `POST /api/v1/analyze-selection`
- `POST /api/v1/generate-final`
- `POST /api/v1/modify-itinerary`
- `GET|POST|PUT|DELETE /api/v1/itineraries`
- `GET|POST|DELETE /api/v1/shared-itineraries`

需要登入的 endpoint 使用：

```http
Authorization: Bearer <access_token>
```

## 測試與檢查

```powershell
python -m pytest
cd frontend
npm run build
```

資料庫連線可使用：

```powershell
python backend\test_databases.py
```

## 注意事項

- `JWT_SECRET` 不應使用預設值 `change-this-secret-before-deployment`。
- FastAPI 目前允許所有 CORS origin，正式環境應限制為實際前端網域。
- 前端 token 目前放在 `localStorage`；若有更高的帳號安全需求，應評估改用 HttpOnly cookie。
- `frontend/dist` 是建置輸出，請依部署策略決定是否追蹤；不要把 build 產物與原始碼變更混在功能提交中。
