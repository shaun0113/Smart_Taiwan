from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
import requests
import random
from datetime import datetime, timedelta

from auth import create_access_token, get_current_user, hash_password, verify_password
from database import get_auth_db
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

OTP_STORE = {}

class OTPRequest(BaseModel):
    email: EmailStr

class RegisterRequest(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    otp: str 

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)

@router.post("/send-otp") 
def send_otp(req: OTPRequest):
    email = req.email.lower().strip()
    otp_code = str(random.randint(100000, 999999))
    expire_time = datetime.now() + timedelta(minutes=5)
    
    OTP_STORE[email] = {"otp": otp_code, "expires": expire_time}

    print(f"\n================================")
    print(f"【專題測試】發送驗證碼至 {email}")
    print(f"【驗證碼】: {otp_code}")
    print(f"================================\n")

    return {"msg": "驗證碼已發送至您的信箱"}

# @router.post("/send-otp") 
# def send_otp(req: OTPRequest):
    # email = req.email.lower().strip()
    # otp_code = str(random.randint(100000, 999999))
    # expire_time = datetime.now() + timedelta(minutes=5)
    # 
    # OTP_STORE[email] = {"otp": otp_code, "expires": expire_time}
# 
    # url = "https://api.brevo.com/v3/smtp/email"
    # headers = {
        # "accept": "application/json",
        # "api-key": os.getenv("BREVO_API_KEY"),
        # "content-type": "application/json"
    # }
    # payload = {
        # "sender": {"name": "智遊台灣 Smart Tour", "email": "shaun13@gmail.com"}, # 替換信箱
        # "to": [{"email": email}],
        # "subject": "智遊台灣 - 帳號驗證碼",
        # "htmlContent": f"<h3>歡迎使用智遊台灣 Smart Tour！</h3><p>您的驗證碼為：<strong>{otp_code}</strong></p><p>此驗證碼將於 5 分鐘後失效，請勿將驗證碼外洩給他人。</p>"
    # }
# 
    # try:
        # response = requests.post(url, json=payload, headers=headers)
        # response.raise_for_status()
        # return {"msg": "驗證碼發送成功"}
    # except Exception as e:
        # print(f"Brevo API 發信失敗: {e}")
        # raise HTTPException(status_code=500, detail="驗證碼寄送失敗，請確認 API Key 是否正確")

@router.post("/register", status_code=201)
def register(req: RegisterRequest):
    email = req.email.lower().strip()
    username = req.username.strip()

    # 驗證碼防護檢查
    otp_record = OTP_STORE.get(email)
    if not otp_record:
        raise HTTPException(status_code=400, detail="請先獲取驗證碼")
    if datetime.now() > otp_record["expires"]:
        raise HTTPException(status_code=400, detail="驗證碼已過期，請重新獲取")
    if otp_record["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="驗證碼錯誤")
        
    del OTP_STORE[email] 

    with get_auth_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM users WHERE email = %s OR username = %s",
                (email, username),
            )
            if cursor.fetchone():
                raise HTTPException(status_code=409, detail="Email 或使用者名稱已被使用")

            cursor.execute(
                "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
                (username, email, hash_password(req.password)),
            )
            user_id = cursor.lastrowid

    token = create_access_token(user_id, email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user_id, "username": username, "email": email},
    }

@router.post("/login")
def login(req: LoginRequest):
    email = req.email.lower().strip()
    with get_auth_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, username, email, password_hash FROM users WHERE email = %s",
                (email,),
            )
            user = cursor.fetchone()

    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email 或密碼錯誤")

    token = create_access_token(user["id"], user["email"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user["id"], "username": user["username"], "email": user["email"]},
    }

class GoogleLoginRequest(BaseModel):
    credential: str

GOOGLE_CLIENT_ID = "255342514400-0lq6v0h1cpj92or171ukfrv14sfhnefi.apps.googleusercontent.com"

@router.post("/google-login")
def google_login(req: GoogleLoginRequest):
    try:
        idinfo = id_token.verify_oauth2_token(
            req.credential, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        email = idinfo['email'].lower().strip()
        username = idinfo.get('name', email.split('@')[0]).strip()
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="無效的 Google 登入憑證") from exc

    with get_auth_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id, username, email FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()

            if not user:
                dummy_password_hash = hash_password("Google_OAuth_User_Default_Password")
                cursor.execute(
                    "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
                    (username, email, dummy_password_hash),
                )
                user_id = cursor.lastrowid
                user = {"id": user_id, "username": username, "email": email}
            else:
                user_id = user["id"]

    token = create_access_token(user_id, email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user_id, "username": user["username"], "email": user["email"]},
    }

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8, max_length=72)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str = Field(min_length=8, max_length=72)
    otp: str 

@router.post("/change-password")
def change_password(req: ChangePasswordRequest, current_user=Depends(get_current_user)):
    with get_auth_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT password_hash FROM users WHERE id = %s", (current_user["id"],))
            user = cursor.fetchone()
            
            if not user or not verify_password(req.old_password, user["password_hash"]):
                raise HTTPException(status_code=400, detail="舊密碼輸入錯誤")
            
            new_hash = hash_password(req.new_password)
            cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hash, current_user["id"]))
    return {"status": "success", "msg": "密碼修改成功"}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    email = req.email.lower().strip()
    
    # 驗證碼防護檢查
    otp_record = OTP_STORE.get(email)
    if not otp_record:
        raise HTTPException(status_code=400, detail="請先獲取驗證碼")
    if datetime.now() > otp_record["expires"]:
        raise HTTPException(status_code=400, detail="驗證碼已過期，請重新獲取")
    if otp_record["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="驗證碼錯誤")
        
    del OTP_STORE[email]

    with get_auth_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="找不到此電子郵件對應的帳號")
            
            new_hash = hash_password(req.new_password)
            cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hash, user["id"]))
    return {"status": "success", "msg": "密碼重設成功，請使用新密碼登入"}

@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return {"user": current_user}

@router.get("/users")
def get_all_users(current_user=Depends(get_current_user)):
    ADMIN_EMAILS = ["shaunshih13@gmail.com"]
    if current_user["email"] not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="權限不足，僅限管理員查看")

    with get_auth_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id, username, email FROM users ORDER BY id DESC")
            users = cursor.fetchall()

    safe_users = [{"id": u["id"], "username": u["username"], "email": u["email"]} for u in users]
    return {"users": safe_users}

@router.delete("/users/{user_id}")
def delete_user(user_id: int, current_user=Depends(get_current_user)):
    ADMIN_EMAILS = ["shaunshih13@gmail.com"]
    if current_user["email"] not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="權限不足，僅限管理員執行")

    with get_auth_db() as connection:
        with connection.cursor() as cursor:
            if current_user["id"] == user_id:
                raise HTTPException(status_code=400, detail="無法刪除自己的管理員帳號")
            cursor.execute("DELETE FROM itineraries WHERE user_id = %s", (user_id,))
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="找不到該使用者")
    return {"status": "success", "msg": "帳號已成功刪除"}