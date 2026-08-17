import os
from contextlib import contextmanager
from pathlib import Path
from typing import Dict, Any

import pymysql
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)


def _required_env(name: str, fallback_name: str | None = None) -> str:
    value = os.getenv(name)
    if (value is None or not value.strip()) and fallback_name:
        value = os.getenv(fallback_name)
    if value is None or not value.strip():
        suffix = f"（或相容欄位 {fallback_name}）" if fallback_name else ""
        raise RuntimeError(f"缺少必要環境變數：{name}{suffix}")
    return value.strip()


def _bool_env(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def _base_mysql_config(prefix: str, fallback_to_db: bool = False) -> Dict[str, Any]:
    fallback = (lambda key: f"DB_{key}") if fallback_to_db else (lambda key: None)
    return {
        "host": _required_env(f"{prefix}_DB_HOST", fallback("HOST")),
        "port": int(os.getenv(f"{prefix}_DB_PORT") or os.getenv(fallback("PORT") or "") or "3306"),
        "user": _required_env(f"{prefix}_DB_USER", fallback("USER")),
        "password": _required_env(f"{prefix}_DB_PASSWORD", fallback("PASSWORD")),
        "database": _required_env(f"{prefix}_DB_NAME", fallback("NAME")),
        "charset": "utf8mb4",
        "cursorclass": pymysql.cursors.DictCursor,
        "autocommit": False,
        "connect_timeout": 10,
        "read_timeout": 20,
        "write_timeout": 20,
    }


def _auth_connection_config() -> Dict[str, Any]:
    """Railway：會員、登入與帳號資料庫。"""
    config = _base_mysql_config("AUTH")
    if _bool_env("AUTH_DB_SSL", False):
        config["ssl"] = {}
    return config


def _travel_connection_config() -> Dict[str, Any]:
    """Aiven：旅遊、景點與交通資料庫。

    為了相容原專案，若沒有 TRAVEL_DB_*，會自動讀取舊的 DB_*。
    """
    config = _base_mysql_config("TRAVEL", fallback_to_db=True)

    if _bool_env("TRAVEL_DB_SSL", True):
        ca_value = os.getenv("TRAVEL_DB_SSL_CA", "").strip()
        if ca_value:
            ca_path = Path(ca_value)
            if not ca_path.is_absolute():
                ca_path = BASE_DIR / ca_path
            if not ca_path.exists():
                raise RuntimeError(f"找不到 Aiven CA 憑證：{ca_path}")
            config["ssl"] = {"ca": str(ca_path), "check_hostname": True}
        else:
            config["ssl"] = {}

    return config


@contextmanager
def _managed_connection(config: Dict[str, Any]):
    connection = pymysql.connect(**config)
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


@contextmanager
def get_auth_db():
    """取得 Railway 帳號資料庫連線。"""
    with _managed_connection(_auth_connection_config()) as connection:
        yield connection


@contextmanager
def get_travel_db():
    """取得 Aiven 旅遊資料庫連線。"""
    with _managed_connection(_travel_connection_config()) as connection:
        yield connection


@contextmanager
def get_db():
    """相容舊登入程式；預設指向 Railway 帳號資料庫。"""
    with get_auth_db() as connection:
        yield connection


def init_database() -> None:
    """只在 Railway 建立登入系統所需的 users 資料表。"""
    with get_auth_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                    username VARCHAR(50) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY uq_users_username (username),
                    UNIQUE KEY uq_users_email (email)
                ) ENGINE=InnoDB
                  DEFAULT CHARSET=utf8mb4
                  COLLATE=utf8mb4_unicode_ci
                """
            )
