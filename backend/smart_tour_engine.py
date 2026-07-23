import os
import pymysql  
import json
import logging
import time
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
            "password": os.getenv("DB_PASSWORD", ""),          
            "database": os.getenv("DB_NAME", "smart_tour_taiwan"),    
            "charset": "utf8mb4",
            "cursorclass": pymysql.cursors.DictCursor
        }
        
        # 使用官方最新穩定版模型名稱
        self.model_name = 'gemini-2.5-flash'
        
        # 支援 GEMINI_API_KEYS (逗號分隔多組 Key)，並向下相容 GEMINI_API_KEY / GEMINI_API_KEY_X
        self.api_keys = []
        raw_keys = os.getenv("GEMINI_API_KEYS", os.getenv("GEMINI_API_KEY", ""))
        
        if raw_keys:
            self.api_keys = [k.strip() for k in raw_keys.split(",") if k.strip()]
        
        if not self.api_keys:
            for i in range(1, 5):
                val = os.getenv(f"GEMINI_API_KEY_{i}")
                if val:
                    self.api_keys.append(val.strip())
                
        if not self.api_keys:
            logger.warning("🚨 未偵測到任何 GEMINI_API_KEYS 環境變數。")
        else:
            logger.info(f"🔑 成功加載 {len(self.api_keys)} 組 Gemini API 金鑰！")

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

        last_error = None
        for index, key in enumerate(self.api_keys):
            try:
                logger.info(f"🔄 景點推薦中，嘗試第 {index + 1} 把 Key...")
                client = genai.Client(api_key=key)
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
                logger.warning(f"⚠️ 第 {index + 1} 把 Key 請求受挫 ({e})，準備切換下一把...")
                last_error = e
                time.sleep(1)
        
        return f"景點海選引擎發生異常：{last_error}"

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

        for index, key in enumerate(self.api_keys):
            try:
                client = genai.Client(api_key=key)
                response = client.models.generate_content(
                    model=self.model_name,
                    contents=guardrail_prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json")
                )
                result = json.loads(response.text.strip())
                return result["status"], result["accumulated_spots"], result["msg"]
            except Exception as e:
                logger.warning(f"⚠️ 意圖分析 Key #{index + 1} 重試中... ({e})")
                time.sleep(1)
                
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
        
        last_error = None
        for index, key in enumerate(self.api_keys):
            try:
                logger.info(f"🔄 最終行程生成中，使用第 {index + 1} 把 Key...")
                client = genai.Client(api_key=key)
                response = client.models.generate_content(model=self.model_name, contents=prompt)
                if response.text:
                    return response.text
            except Exception as e:
                logger.warning(f"⚠️ 最終行程生成 Key #{index + 1} 重試中... ({e})")
                last_error = e
                time.sleep(1)
                
        return f"最終行程生成引擎發生異常：{last_error}"

    def modify_itinerary(self, current_itinerary: str, modification_demand: str) -> str:
        if not self.api_keys:
            return "Gemini API 尚未正確初始化。"

        prompt = f"微調指令：『{modification_demand}』\n現有行程：\n{current_itinerary}"
        
        for index, key in enumerate(self.api_keys):
            try:
                client = genai.Client(api_key=key)
                response = client.models.generate_content(model=self.model_name, contents=prompt)
                if response.text:
                    return response.text
            except Exception as e:
                logger.warning(f"行程微調 Key #{index + 1} 重試中... ({e})")
                time.sleep(1)
                
        raise Exception("微調引擎發生異常。")