# 雙資料庫設定

- `get_auth_db()`：Railway，供註冊、登入、會員帳號使用。
- `get_travel_db()`：Aiven，供景點、交通與旅遊資料使用。
- `get_db()`：為相容舊登入程式保留，實際指向 Railway。

## 本機執行

1. 複製 `.env.example` 為 `.env`，填入自己的憑證。
2. Railway 必須使用 Public Networking 的 Host 與 Port，不能使用 `mysql.railway.internal`。
3. 執行：

```bash
cd backend
source venv/bin/activate
python test_databases.py
uvicorn main:app --reload --port 8000
```

API 文件：`http://127.0.0.1:8000/docs`
