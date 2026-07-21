import os
import pymysql  
import json
import logging
from google import genai
from google.genai import types

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SmartTourEngine:
    def __init__(self):
        self.db_config = {
            "host": os.getenv("DB_HOST", "127.0.0.1"),
            "port": int(os.getenv("DB_PORT", 3306)),
            "user": os.getenv("DB_USER", "root"),
            "password": os.getenv("DB_PASSWORD", "Yjo494m6.."),          
            "database": os.getenv("DB_NAME", "smart_tour_taiwan"),    
            "charset": "utf8mb4",
            "cursorclass": pymysql.cursors.DictCursor
        }
        
        self.model_name = 'gemini-3.5-flash'
        
        self.api_keys = []
        for i in range(1, 5):
            key_name = f"GEMINI_API_KEY_{i}" if i > 1 else "GEMINI_API_KEY"
            val = os.getenv(key_name)
            if val:
                self.api_keys.append(val)
                
        if not self.api_keys:
            logger.warning("🚨 未偵測到 GEMINI_API_KEY 環境變數。")

    def _get_genai_client(self, attempt: int):
        if not self.api_keys:
            return None
        target_index = attempt % len(self.api_keys)
        logger.info(f"🔄 調度第 {target_index + 1} 把 Gemini 金鑰...")
        return genai.Client(api_key=self.api_keys[target_index])

    def _query_spots_from_db(self, cities: list) -> list:
        try:
            conn = pymysql.connect(**self.db_config)
            cursor = conn.cursor()
        except Exception as e:
            logger.error(f"❌ 後端連線 MySQL 失敗: {str(e)}")
            return []
        
        cleaned_spots = []
        for city in cities:
            clean_city = city.strip()
            if clean_city in ["台北市", "台北"]: clean_city = "臺北市"
            if clean_city in ["台中市", "台中"]: clean_city = "臺中市"
            if clean_city in ["台南市", "台南"]: clean_city = "臺南市"
            
            query = "SELECT title, address, description FROM attractions WHERE city = %s"
            try:
                cursor.execute(query, (clean_city,))
                rows = cursor.fetchall()
                for row in rows:
                    cleaned_spots.append({
                        "name": row["title"],
                        "address": row["address"],
                        "description": row["description"][:120] + "..." if row["description"] else "暫無詳細說明"
                    })
            except Exception as e:
                logger.error(f"❌ 讀取 MySQL 異常 ({clean_city}): {str(e)}")
                
        cursor.close()
        conn.close()
        return cleaned_spots

    def recommend_spots(self, user_need: str, city: str, tags: list, accumulated_spots: str) -> str:
        if not self.api_keys:
            return "Gemini API 尚未正確初始化。"

        target_cities = [c.strip() for c in city.split(",") if c.strip()]
        db_spots = self._query_spots_from_db(target_cities)
        
        if not db_spots:
            db_spots = [{"name": "系統備用模式", "address": "請 AI 依據知名地標排程", "description": "本地數據庫無符合景點"}]

        sys_instruction = """
        你是一個台灣旅遊景點推薦機器人。請從資料庫清單中挑選 10 到 15 個景點。
        每一行景點請務必嚴格使用以下格式輸出：
        1|景點名稱|地圖定位地址|一句話特色與推薦理由

        非景點的文字（如前言、標題）請用 2| 開頭。
        範例：
        1|奇美博物館|臺南市仁德區文華路二段66號|純白歐式宮殿建築，浪漫氛圍滿分。
        1|神農街|臺南市中西區神農街|百年老街，夜間燈火極具古風浪漫。
        """

        user_prompt = f"""
        請從下方真實景點數據庫中，精選出 10-15 個適合【{', '.join(tags)}】的景點。

        目的地：{', '.join(target_cities)}
        需求：{user_need}

        數據庫名單：
        {json.dumps(db_spots, ensure_ascii=False)}
        """

        for attempt in range(3):
            client = self._get_genai_client(attempt)
            if not client:
                continue
            try:
                response = client.models.generate_content(
                    model=self.model_name,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=sys_instruction,
                        temperature=0.3
                    )
                )
                if response.text:
                    return response.text
            except Exception as e:
                logger.warning(f"⚠️ 第 {attempt + 1} 次請求受挫: {e}")
        
        return "景點海選引擎發生異常，請稍後再試。"

    def analyze_selection(self, user_choice: str, spots_recommendation: str, accumulated_spots: str, user_need: str):
        safe_user_choice = user_choice if user_choice is not None else ""
        safe_accumulated = accumulated_spots if accumulated_spots is not None else ""

        if not safe_user_choice.strip():
            return "CONTINUE", safe_accumulated, "您好像沒有輸入任何內容？"

        guardrail_prompt = f"""
        分析使用者輸入：『{safe_user_choice}』
        上下文：{user_need} | 暫存景點：{safe_accumulated}
        判斷 status: "READY" (結束/排行程), "CONTINUE" (繼續挑選/調整), "REJECT" (廢話)
        只輸出 JSON: {{"status": "CONTINUE", "accumulated_spots": "景點A + 景點B", "msg": "回應"}}
        """

        for attempt in range(3):
            client = self._get_genai_client(attempt)
            if not client:
                continue
            try:
                response = client.models.generate_content(
                    model=self.model_name,
                    contents=guardrail_prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json")
                )
                result = json.loads(response.text.strip())
                return result["status"], result["accumulated_spots"], result["msg"]
            except Exception as e:
                logger.warning(f"⚠️ 意圖網閘連線重試中... ({e})")
                
        return "CONTINUE", safe_accumulated, f"已記錄需求：『{safe_user_choice}』"

    def generate_final_itinerary(self, accumulated_spots: str, user_need: str, city: str, transport: str = "自駕", start_location: str = "臺北市", start_time: str = "08:00") -> str:
        if not self.api_keys:
            return "Gemini API 尚未正確初始化。"

        spots_context = accumulated_spots if accumulated_spots else "請依照前述海選推薦名單排程。"
        prompt = f"""
        你現在是台灣智慧旅遊規劃師。請針對旅客最終選定的景點動態生成行程表。
        出發地：{start_location}，時間：{start_time}，目的地：{city}，交通：{transport}。

        最上方建立【行程概要總覽】，接著空兩行，再輸出下方的詳細行程介紹。
        行程必須包含跨縣市交通車程。

        選定景點：{spots_context}
        需求：{user_need}
        """
        
        for attempt in range(3):
            client = self._get_genai_client(attempt)
            if not client:
                continue
            try:
                response = client.models.generate_content(model=self.model_name, contents=prompt)
                if response.text:
                    return response.text
            except Exception as e:
                logger.warning(f"⚠️最終行程生成重試中... ({e})")
                
        return "最終行程生成引擎發生異常，請稍後重試。"

    def modify_itinerary(self, current_itinerary: str, modification_demand: str) -> str:
        if not self.api_keys:
            return "Gemini API 尚未正確初始化。"

        prompt = f"微調指令：『{modification_demand}』\n現有行程：\n{current_itinerary}"
        
        for attempt in range(3):
            client = self._get_genai_client(attempt)
            if not client:
                continue
            try:
                response = client.models.generate_content(model=self.model_name, contents=prompt)
                if response.text:
                    return response.text
            except Exception as e:
                logger.warning(f"行程微調重試中... ({e})")
                
        raise Exception("微調引擎發生異常。")