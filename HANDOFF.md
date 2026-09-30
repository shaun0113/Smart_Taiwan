# 開發交接文件

## 目前狀態

智遊台灣目前已具備基本的前後端流程：

- React / Vite 前端可正常建置。
- FastAPI 後端提供登入、個人資料、AI 景點推薦、行程儲存與分享 API。
- 使用者認證使用 JWT；密碼使用 bcrypt 雜湊。
- Google Identity Services 登入已接上後端驗證。
- 帳號資料與行程存在 Railway MySQL；旅遊資料預期存在 Aiven MySQL。
- `npm run build` 已驗證可成功完成。

## 本機啟動順序

1. 建立並填寫 `backend/.env`。
2. 啟用 Python virtual environment。
3. 安裝 `backend/requirements.txt`。
4. 執行 `python backend/test_databases.py` 確認資料庫連線。
5. 啟動 `python -m uvicorn main:app --app-dir backend --reload --port 8000`。
6. 另一個終端機執行 `cd frontend`、`npm install`、`npm run dev`。
7. 開啟 Vite 顯示的網址，測試註冊、登入、產生行程與儲存行程。

## 優先處理事項

### P0：統一前端 API base URL

目前 API URL 分散在多個檔案：

- `frontend/src/services/profile.js` 使用 `VITE_API_BASE_URL`，沒有設定時回退到 localhost。
- `frontend/src/services/auth.js` 固定使用 `http://127.0.0.1:8000`。
- `frontend/src/pages/AuthPage.jsx` 依 hostname 切換 localhost / Render。
- `frontend/src/pages/Dashboard.jsx` 也有自己的 hostname 判斷。

這會造成部署後重新整理頁面時，`App.jsx` 呼叫 `getMe()` 仍可能連到本機 API，導致使用者被登出。

建議：

1. 建立共用的 `frontend/src/services/api.js`。
2. 只從 `import.meta.env.VITE_API_BASE_URL` 讀取 API 來源。
3. `auth.js`、`profile.js`、`AuthPage.jsx`、`Dashboard.jsx` 全部使用同一個 client。
4. 建立 `frontend/.env.example`，只放公開的 URL 範例，不放秘密。
5. 在本機與 Render 分別設定 `VITE_API_BASE_URL`。

### P1：修正 Google SDK lifecycle

`AuthPage.jsx` 目前以遞迴 `setTimeout` 等待 Google SDK。SDK 載入失敗時會持續輪詢，元件卸載時也沒有取消 timer；effect 重跑時可能重複 render Google button。

建議加入：

- script `onload` / `onerror`。
- `useRef` 保存 timer 與初始化狀態。
- effect cleanup 清除 timer。
- render 前清空或確認 Google button container 尚未初始化。
- Google 登入按鈕的獨立 loading 狀態。

### P1：統一認證流程

`AuthPage.jsx` 目前自行 fetch login / register，而 `services/auth.js` 也有重複的 login / register 實作。兩邊對 localStorage 的處理不同：AuthPage 沒有儲存 `user`，service 有儲存。

建議保留單一實作，統一：

- access token key。
- user cache key。
- API error parser。
- 登入成功後的狀態更新。
- token 過期時的 logout 行為。

### P1：補上後端設定與部署保護

- 正式環境必須設定真正的 `JWT_SECRET`。
- CORS 不應長期使用 `allow_origins=["*"]` 搭配 credentials。
- 不要將管理員 email 直接硬編碼在 `auth_routes.py`，應改為環境變數或角色欄位。
- Google OAuth 設定應確認 production domain 已加入 Authorized JavaScript origins。
- Google 使用者自動產生 username 時，需處理 username 唯一鍵衝突。

## 建議補強

### 前端

- 加上 email、username、password 的 `id` / `htmlFor`。
- 加上 `autoComplete`：`email`、`username`、`current-password`、`new-password`。
- 錯誤訊息加上 `role="alert"` 與 `aria-live`。
- 對 fetch response 做安全 JSON parsing，避免非 JSON 錯誤頁造成誤導訊息。
- 加入 request cancellation，避免頁面離開後仍更新 state。
- 增加密碼顯示切換與密碼規則提示。
- 手機與桌面測試登入、註冊、Google button、錯誤訊息不溢出。

### 後端

- 為認證、行程 CRUD、分享行程補上自動化測試。
- 對 request body、AI 回應與資料庫錯誤建立一致的錯誤格式。
- 為 `SmartTourEngine` 補上資料庫連線關閉與 timeout 的測試。
- 確認 `DB_*` 與 `TRAVEL_DB_*` 的責任，避免旅遊資料查詢使用錯誤資料庫。
- 將資料庫 migration 從 startup 自動建表逐步改成可追蹤 migration。
- 加入健康檢查 endpoint，例如 `/health`，並檢查資料庫與 Gemini 設定狀態。

## 交接時的驗收清單

- [ ] 本機 backend 可啟動且 `/docs` 可開啟。
- [ ] `test_databases.py` 通過。
- [ ] 前端 `npm run build` 通過。
- [ ] 新帳號註冊成功。
- [ ] Email 登入與錯誤密碼行為正確。
- [ ] Google 登入成功，且重新整理後仍保持登入。
- [ ] 沒有 token 時，受保護 API 會回到登入頁。
- [ ] 可產生、修改、儲存、重新命名與刪除行程。
- [ ] 可建立與讀取分享行程。
- [ ] 非管理員不能使用管理員 API。
- [ ] Render production environment 的 API URL、JWT secret、Gemini key、雙資料庫變數已設定。
- [ ] production CORS 只允許正式前端來源。

## 目前工作樹注意事項

建置前端會更新 `frontend/dist`。提交功能變更前，請確認這些檔案是否由部署流程產生，以及是否應該納入版本控制。不要為了清理 build 輸出而回復其他開發者尚未提交的修改。
