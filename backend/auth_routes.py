from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field

from auth import create_access_token, get_current_user, hash_password, verify_password
from database import get_auth_db

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


@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return {"user": current_user}
