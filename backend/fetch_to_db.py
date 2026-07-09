import os
import requests
import logging
import pymysql
import time

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TDXToMySQL:
    def __init__(self):
        # 優先讀取雲端環境變數，若讀不到才拿你原本的當備用（防呆安全機制）
        self.tdx_id = os.environ.get('TDX_CLIENT_ID', 'a112222028-fb0180d6-bcf1-4afb')
        self.tdx_secret = os.environ.get('TDX_CLIENT_SECRET', 'f244a993-d7f3-4c08-986d-b60e472362f7')

        # 核心修復：動態讀取雲端/本地環境變數，並強制加上 Aiven 所需的 SSL 連線加密參數
        self.db_config = {
            "host": os.environ.get('DB_HOST', '127.0.0.1'),
            "port": int(os.environ.get('DB_PORT', 3306)),
            "user": os.environ.get('DB_USER', 'root'),
            "password": os.environ.get('DB_PASSWORD', 'Yjo494m6..'),          
            "database": os.environ.get('DB_NAME', 'smart_tour_taiwan'),     
            "charset": "utf8mb4",
            "cursorclass": pymysql.cursors.DictCursor,
            "ssl": {"ssl_mode": "REQUIRED"}  # 👈 核心關鍵：強制要求 SSL 加密，解決 Aiven 連線被踢的問題
        }

    def _get_tdx_token(self):
        """向 TDX 平台換取臨時 Access Token"""
        auth_url = "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token"
        payload = {
            'grant_type': 'client_credentials',
            'client_id': self.tdx_id,
            'client_secret': self.tdx_secret
        }
        headers = {'content-type': 'application/x-www-form-urlencoded'}
        try:
            res = requests.post(auth_url, data=payload, headers=headers, timeout=5)
            if res.status_code == 200:
                return res.json().get("access_token")
            logger.error(f"❌ Token 換取失敗: {res.status_code}")
            return None
        except Exception as e:
            logger.error(f"❌ Token 連線異常: {str(e)}")
            return None

    def sync_all_data_safely(self):
        """
        🚀 核心邏輯：清空舊表，全量慢速分頁下載全台景點倒進 DB，具備 429 退讓冬眠機制
        """
        token = self._get_tdx_token()
        if not token:
            logger.error("❌ 無法取得 Token，中斷資料庫同步。")
            return

        try:
            logger.info(f"📡 正在嘗試連線至 MySQL 主機: {self.db_config['host']} (已啟用 SSL 加密防護)...")
            conn = pymysql.connect(**self.db_config)
            cursor = conn.cursor()
        except Exception as e:
            logger.error(f"❌ 資料庫連線失敗: {str(e)}")
            return

        try:
            logger.warning("🚨 正在執行 TRUNCATE TABLE... 清空 attractions 表內舊資料...")
            cursor.execute("TRUNCATE TABLE attractions")
            conn.commit()
            logger.info("🧹 資料表已成功清空！準備以最安全的慢速爬取全台數據...")
        except Exception as e:
            logger.error(f"❌ 清空資料表失敗: {str(e)}")
            cursor.close()
            conn.close()
            return

        base_url = "https://tdx.transportdata.tw/api/tourism/service/odata/V2/Tourism/Attraction"
        logger.info("📡 啟動極限配速防禦機制，開始分頁下載全台景點...")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }

        page_size = 50  # 縮小分頁每次只拿50筆，進一步降低伺服器負載
        skip_count = 0
        total_inserted = 0
        consecutive_429_count = 0

        sql = """
            INSERT INTO attractions (title, category, city, address, description, tel)
            VALUES (%s, %s, %s, %s, %s, %s)
        """

        while True:
            query_params = {
                "$top": page_size,
                "$skip": skip_count,
                "$format": "JSON"
            }
            
            try:
                res = requests.get(base_url, headers=headers, params=query_params, timeout=10)
                
                # 🚀 核心防禦：如果觸發 429 流量限制
                if res.status_code == 429:
                    consecutive_429_count += 1
                    if consecutive_429_count > 5:
                        logger.error("❌ 伺服器持續鎖定，為保護金鑰，中斷本次同步。")
                        break
                    
                    logger.warning(f"⚠️ 遭到 TDX 限制限制 (429)。啟動緊急退讓機制：就地冬眠 15 秒後重試目前分頁...")
                    time.sleep(15.0)
                    continue
                
                if res.status_code != 200:
                    logger.error(f"❌ TDX 伺服器回傳錯誤 ({res.status_code})，跳出。內容: {res.text}")
                    break

                consecutive_429_count = 0
                response_data = res.json()
                spots_list = response_data.get("value", [])
                
                if not spots_list:
                    break

                # 寫入資料庫
                for spot in spots_list:
                    postal_info = spot.get("PostalAddress") or {}
                    title = spot.get("AttractionName") or spot.get("ScenicSpotName") or "未命名景點"
                    category = spot.get("Class1") or "未分類"
                    city = postal_info.get("City") or spot.get("City") or "未分類縣市"
                    address = postal_info.get("StreetAddress") or spot.get("Address") or "無地址資訊"
                    description = spot.get("DescriptionDetail") or spot.get("Description") or "暫無描述"
                    tel = spot.get("Phone") or "無電話"

                    cursor.execute(sql, (title, category, city, address, description, tel))
                
                conn.commit()
                total_inserted += len(spots_list)
                logger.info(f"✍️ 寫入進度：已成功塞入全台累計共 {total_inserted} 筆景點資料...")

                if len(spots_list) < page_size:
                    break
                    
                skip_count += page_size
                
                logger.info("⏳ 慢速安全間隔：強制休息 3.5 秒...")
                time.sleep(3.5)

            except Exception as e:
                logger.error(f" 全量同步過程中發生異常: {str(e)}")
                conn.rollback()
                break

        cursor.close()
        conn.close()
        logger.info(f"全台灣共計 {total_inserted} 筆官方即時景點數據已全數安全、穩健地寫入 MySQL！")

if __name__ == "__main__":
    sync_engine = TDXToMySQL()
    sync_engine.sync_all_data_safely()