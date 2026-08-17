import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from auth import get_current_user
from database import get_auth_db


router = APIRouter(
    prefix="/api/profile",
    tags=["User Profile"],
)


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    city: str | None = Field(default=None, max_length=50)
    birth_year: int | None = Field(default=None, ge=1900, le=2100)
    transportation: str | None = Field(default=None, max_length=50)
    has_driver_license: bool = False
    travel_preferences: list[str] = []
    budget_min: int | None = Field(default=None, ge=0)
    budget_max: int | None = Field(default=None, ge=0)


@router.get("")
def get_profile(current_user=Depends(get_current_user)):
    user_id = current_user["id"]

    with get_auth_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    id,
                    user_id,
                    full_name,
                    phone,
                    city,
                    birth_year,
                    transportation,
                    has_driver_license,
                    travel_preferences,
                    budget_min,
                    budget_max,
                    created_at,
                    updated_at
                FROM user_profiles
                WHERE user_id = %s
                """,
                (user_id,),
            )

            profile = cursor.fetchone()

    if not profile:
        return {
            "user_id": user_id,
            "full_name": "",
            "phone": "",
            "city": "",
            "birth_year": None,
            "transportation": "",
            "has_driver_license": False,
            "travel_preferences": [],
            "budget_min": None,
            "budget_max": None,
        }

    preferences = profile.get("travel_preferences")

    if isinstance(preferences, str):
        try:
            profile["travel_preferences"] = json.loads(preferences)
        except json.JSONDecodeError:
            profile["travel_preferences"] = []

    profile["has_driver_license"] = bool(
        profile["has_driver_license"]
    )

    return profile


@router.put("")
def save_profile(
    payload: ProfileUpdate,
    current_user=Depends(get_current_user),
):
    user_id = current_user["id"]

    if (
        payload.budget_min is not None
        and payload.budget_max is not None
        and payload.budget_min > payload.budget_max
    ):
        raise HTTPException(
            status_code=400,
            detail="最低預算不能高於最高預算",
        )

    preferences_json = json.dumps(
        payload.travel_preferences,
        ensure_ascii=False,
    )

    with get_auth_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO user_profiles (
                    user_id,
                    full_name,
                    phone,
                    city,
                    birth_year,
                    transportation,
                    has_driver_license,
                    travel_preferences,
                    budget_min,
                    budget_max
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    full_name = VALUES(full_name),
                    phone = VALUES(phone),
                    city = VALUES(city),
                    birth_year = VALUES(birth_year),
                    transportation = VALUES(transportation),
                    has_driver_license =
                        VALUES(has_driver_license),
                    travel_preferences =
                        VALUES(travel_preferences),
                    budget_min = VALUES(budget_min),
                    budget_max = VALUES(budget_max)
                """,
                (
                    user_id,
                    payload.full_name,
                    payload.phone,
                    payload.city,
                    payload.birth_year,
                    payload.transportation,
                    payload.has_driver_license,
                    preferences_json,
                    payload.budget_min,
                    payload.budget_max,
                ),
            )

        connection.commit()

    return {
        "message": "個人資料儲存成功",
    }