from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field

from auth import create_access_token, get_current_user, hash_password, verify_password
from database import get_auth_db
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


@router.post("/register", status_code=201)
def register(req: RegisterRequest):
    email = req.email.lower().strip()
    username = req.username.strip()

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
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
        },
    }
class GoogleLoginRequest(BaseModel):
    credential: str

GOOGLE_CLIENT_ID = "255342514400-0lq6v0h1cpj92or171ukfrv14sfhnefi.apps.googleusercontent.com"

@router.post("/google-login")
def google_login(req: GoogleLoginRequest):
    try:
        idinfo = id_token.verify_oauth2_token(
            req.credential, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        email = idinfo['email'].lower().strip()
        username = idinfo.get('name', email.split('@')[0]).strip()
        
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="無效的 Google 登入憑證") from exc

    with get_auth_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, username, email FROM users WHERE email = %s",
                (email,),
            )
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
        "user": {
            "id": user_id,
            "username": user["username"],
            "email": user["email"],
        },
    }

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8, max_length=72)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str = Field(min_length=8, max_length=72)

# 1. 更改密碼 (需登入)
@router.post("/change-password")
def change_password(req: ChangePasswordRequest, current_user=Depends(get_current_user)):
    with get_auth_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT password_hash FROM users WHERE id = %s",
                (current_user["id"],)
            )
            user = cursor.fetchone()
            
            if not user or not verify_password(req.old_password, user["password_hash"]):
                raise HTTPException(status_code=400, detail="舊密碼輸入錯誤")
            
            new_hash = hash_password(req.new_password)
            cursor.execute(
                "UPDATE users SET password_hash = %s WHERE id = %s",
                (new_hash, current_user["id"])
            )
    return {"status": "success", "msg": "密碼修改成功"}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    email = req.email.lower().strip()
    with get_auth_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM users WHERE email = %s",
                (email,)
            )
            user = cursor.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="找不到此電子郵件對應的帳號")
            
            new_hash = hash_password(req.new_password)
            cursor.execute(
                "UPDATE users SET password_hash = %s WHERE id = %s",
                (new_hash, user["id"])
            )
    return {"status": "success", "msg": "密碼重設成功，請使用新密碼登入"}

@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return {"user": current_user}
