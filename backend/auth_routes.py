import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from auth import create_access_token, get_current_user, hash_password, verify_password
from database import get_auth_db
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)

class RegisterRequest(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)

@router.post("/register", status_code=201)
def register(req: RegisterRequest):
    logger.info("auth operation=register started")
    email = req.email.lower().strip()
    username = req.username.strip()

    with get_auth_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE email = %s OR username = %s", (email, username))
            if cursor.fetchone():
                logger.warning("auth operation=register rejected reason=duplicate_identity")
                raise HTTPException(status_code=409, detail="Email 或使用者名稱已被使用")

            cursor.execute(
                "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
                (username, email, hash_password(req.password)),
            )
            user_id = cursor.lastrowid

    token = create_access_token(user_id, email)
    logger.info("auth operation=register succeeded")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user_id, "username": username, "email": email},
    }

@router.post("/login")
def login(req: LoginRequest):
    logger.info("auth operation=login started")
    email = req.email.lower().strip()
    with get_auth_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id, username, email, password_hash FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()

    if not user or not verify_password(req.password, user["password_hash"]):
        logger.warning("auth operation=login rejected reason=invalid_credentials")
        raise HTTPException(status_code=401, detail="Email 或密碼錯誤")

    token = create_access_token(user["id"], user["email"])
    logger.info("auth operation=login succeeded")
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
    logger.info("auth operation=google_login started")
    try:
        idinfo = id_token.verify_oauth2_token(
            req.credential, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        email = idinfo['email'].lower().strip()
        username = idinfo.get('name', email.split('@')[0]).strip()
    except ValueError as exc:
        logger.warning("auth operation=google_login rejected reason=invalid_identity_token")
        raise HTTPException(status_code=401, detail="無效的 Google 登入憑證") from exc
    except Exception:
        logger.exception("auth operation=google_login identity_verification_failed")
        raise

    with get_auth_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id, username, email FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()

            account_created = user is None
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
    logger.info("auth operation=google_login succeeded account_created=%s", account_created)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user_id, "username": user["username"], "email": user["email"]},
    }

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8, max_length=72)

@router.post("/change-password")
def change_password(req: ChangePasswordRequest, current_user=Depends(get_current_user)):
    logger.info("auth operation=change_password started")
    with get_auth_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT password_hash FROM users WHERE id = %s", (current_user["id"],))
            user = cursor.fetchone()
            
            if not user or not verify_password(req.old_password, user["password_hash"]):
                logger.warning("auth operation=change_password rejected reason=invalid_current_password")
                raise HTTPException(status_code=400, detail="舊密碼輸入錯誤")
            
            new_hash = hash_password(req.new_password)
            cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hash, current_user["id"]))
            logger.info("auth operation=change_password succeeded")
    return {"status": "success", "msg": "密碼修改成功"}

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