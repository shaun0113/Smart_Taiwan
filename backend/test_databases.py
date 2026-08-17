from database import get_auth_db, get_travel_db


def test_auth_database() -> None:
    with get_auth_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT DATABASE() AS database_name")
            result = cursor.fetchone()
            print(f"Railway 帳號資料庫連線成功：{result['database_name']}")


def test_travel_database() -> None:
    with get_travel_db() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT DATABASE() AS database_name")
            result = cursor.fetchone()
            print(f"Aiven 旅遊資料庫連線成功：{result['database_name']}")


if __name__ == "__main__":
    test_auth_database()
    test_travel_database()
