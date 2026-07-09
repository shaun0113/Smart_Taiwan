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
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        
        self.db_config = {
            "host": os.getenv("DB_HOST", "127.0.0.1"),
            "port": int(os.getenv("DB_PORT", 3306)),
            "user": os.getenv("DB_USER", "root"),
            "password": os.getenv("DB_PASSWORD", "Yjo494m6.."),          
            "database": os.getenv("DB_NAME", "smart_tour_taiwan"),    
            "charset": "utf8mb4",
            "cursorclass": pymysql.cursors.DictCursor
        }
        
        if self.gemini_key:
            self.client = genai.Client(api_key=self.gemini_key)
            self.model_name = 'gemini-2.5-pro'
        else:
            self.client = None
            logger.warning("未偵測到 GEMINI_API_KEY 環境變數，AI 功能將無法運作。")

    def _query_spots_from_db(self, cities: list) -> list:
        """ 從你的本地 MySQL 中，直接撈取該縣市的所有景點數據 """
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
        """【海選景點】從 MySQL 撈出景點，直接交付 AI 進行篩選並與前端串聯 """
        if not self.client:
            return "Gemini API 尚未正確初始化，請檢查環境變數。"

        try:
            target_cities = [c.strip() for c in city.split(",") if c.strip()]
            logger.info(f"🔍 收到前端請求 -> 縣市: {target_cities}, 標籤: {tags}")
            
            db_spots = self._query_spots_from_db(target_cities)
            
            is_fallback = False
            if not db_spots:
                is_fallback = True
                logger.warning("🚨 MySQL 資料庫內未找到任何匹配景點，啟動 AI 知識庫備用模式。")
                db_spots = [{"name": "系統備用模式", "address": "請 AI 依據知名地標排程", "description": "本地數據庫無符合景點"}]
            else:
                logger.info(f"✅ 成功從你的 MySQL 撈出 {len(db_spots)} 筆景點，直接交付 AI 進行精確海選...")

            fallback_instruction = ""
            if is_fallback:
                fallback_instruction = f"【緊急通告】目前本地資料庫查無景點，請你依據自身知識庫，挑選【{', '.join(target_cities)}】當地真實存在的經典代表性知名景點，絕對不可虛構地名！"

            prompt = f"""
            你現在是台灣頂級智慧旅遊規劃師。
            目前系統已從內部本地 MySQL 數據庫中，為你提取出了目的地縣市的景點名單（總計 {len(db_spots)} 個官方登記景點）。
            
            請展現你極致的語意篩選與邏輯能力，從這批名單中，精確挑選出 8-12 個「最完美符合」旅客需求與偏好標籤的精選景點！

            【重要規範】
            1. 除非啟動緊急備用模式，否則禁止虛構任何列表中不存在的景點！必須 100% 從下方名單中挑選。
            2. 請依縣市或地理分區歸類。針對選出的 8-12 個精選點，寫出 1-2 句直擊痛點的「推薦理由」，告訴旅客為什麼這個點符合他們勾選的標籤：{', '.join(tags)}。
            3. 這次【不需要】排具體時間軸（如 09:00），保留互動空間。

            【旅客偏好與需求】
            目的地縣市：{', '.join(target_cities)}
            {user_need}
            {fallback_instruction}

            【資料庫篩選之真實景點數據庫】
            {json.dumps(db_spots, ensure_ascii=False, indent=2)}

            請輸出結構清晰、排版精美、語氣親切的「精選海選景點候選清單」。
            """

            logger.info("🤖 正在將數據交付至 Gemini 進行海選...")
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            return response.text if response.text else "AI 未能產出內容，請重試。"
        except Exception as e:
            logger.error(f"💥 景點海選引擎發生嚴重異常: {str(e)}", exc_info=True)
            return f"景點海選引擎發生異常: {str(e)}，請稍後再試。"

    def analyze_selection(self, user_choice: str, spots_recommendation: str, accumulated_spots: str, user_need: str):
        """【高精度語意意圖網閘】過濾無關內容並判斷對話是否終止（純淨 JSON 版）"""
        if not self.client:
            return "CONTINUE", accumulated_spots, "Gemini API 未初始化。"

        safe_user_choice = user_choice if user_choice is not None else ""
        safe_accumulated = accumulated_spots if accumulated_spots is not None else ""

        if not safe_user_choice.strip():
            return "CONTINUE", safe_accumulated, "您好像沒有輸入任何內容？請告訴我您的想法。"

        guardrail_prompt = f"""
        你現在是旅遊排程系統的「使用者輸入意圖審查網閘」。
        請分析使用者的最新輸入，並嚴格根據規則判斷其意圖。

        【目前上下文環境】
        1. 使用者基本需求：{user_need}
        2. 系統推薦的海選清單：{spots_recommendation}
        3. 目前暫存想去的景點：{safe_accumulated}

        【當前使用者的輸入】
        『{safe_user_choice}』

        【審查規則】
        1. 判斷狀態 (status)：
           - 如果使用者表達準備結束互動、正式導向最終排程的意圖，status 填 "READY"。
           - 如果使用者是在挑選景點、表達想去或不想去哪裡，status 填 "CONTINUE"。
           - 如果是無關的垃圾話，status 填 "REJECT"。

        2. 更新景點字串 (accumulated_spots)：
           - 根據使用者新要求，智慧地調整並彙整想去的景點清單。

        【輸出規範】
        你必須「完全只輸出」一個標準的 JSON 字串，不得包含任何 Markdown 標籤或額外敘述。
        格式範例 :
        {{"status": "CONTINUE", "accumulated_spots": "景點A + 景點B", "msg": "訊息內容"}}
        """

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=guardrail_prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            result = json.loads(response.text.strip())
            return result["status"], result["accumulated_spots"], result["msg"]
        except Exception as e:
            logger.error(f"⚠️ 意圖網閘異常，啟動防呆保底邏輯。原因: {str(e)}")
            stop_keywords = ["排行程", "夠了", "確定", "可以了", "生成", "這樣就好"]
            if any(kw in safe_user_choice for kw in stop_keywords):
                return "READY", safe_accumulated, "好的，收到！正在為您編排完整的行程表..."
            new_spots = safe_accumulated + " + " + safe_user_choice if safe_accumulated else safe_user_choice
            return "CONTINUE", new_spots, f"已幫您記錄需求：『{safe_user_choice}』"

    def generate_final_itinerary(self, accumulated_spots: str, user_need: str, city: str, transport: str = "自駕", start_location: str = "臺北市", start_time: str = "08:00") -> str:
        """【終極排程步驟】接收指定城市與交通約束，並以高規格寬鬆換行格式輸出最終行程表 """
        if not self.client:
            return "Gemini API 尚未正確初始化。"

        try:
            spots_context = accumulated_spots if accumulated_spots else "請依照前述海選推薦名單中，最符合旅客標籤的景點來排程。"
            
            prompt = f"""
            你現在是台灣智慧旅遊規劃師。請針對旅客最終選定的【指定景點或微調意見】，結合其天數與需求，編排出一份極具可行性的完整旅遊行程表。

            【核心行為約束 - 出發地與首日跨縣市車程時間指標】
            1. 旅客本次旅程是從【{start_location}】出發，預計出發時間為【{start_time}】。
            2. 使用者指定的目的地旅遊城市是：{city}。你規劃的所有景點、餐廳、活動、甚至內文提及的任何地標，必須 100% 屬於該縣市，絕對不准跨縣市、跨區域規劃！
            3. 使用者指定的交通方式是：【{transport}】。
            4. 【重要時間軸限制】：請你（AI）必須依據地理常識，精確估算從出發地「{start_location}」使用「{transport}」移動到目的地城市「{city}」所需的交通時間。
            5. Day 1 的第一個行程，**絕對不能直接跳到目的地的景點**。你必須將這段「跨縣市出發的交通時間與車程」明確作為 Day 1 的第一條時間軸輸出！

            【新增功能：最上方建立「簡約行程總覽」】
            在整份行程表的最開頭（也就是最上方），請幫我建立一個極度精簡的「行程概要總覽」。
            這個總覽只需要列出【天數】、【時間】與【地點名稱】，完全不需要任何特色描述或交通介紹，字數越少越好，格式如下：
            
             【行程概要總覽】
            [Day 1]
            - 08:00 - 10:30 出發前往 {city}
            - 10:30 - 12:00 [景點 A]
            - 12:00 - 13:30 [午餐餐廳]
            - 13:30 - 15:30 [景點 B]
            
            [Day 2]
            - 09:00 - 11:00 [景點 C]
            ...
            
            在「行程概要總覽」結束後，請空兩行，再開始輸出下方的「詳細行程介紹」。

            【核心排程與詳細排版規範】
            1. 詳細介紹部分，必須嚴格遵守【預計行程天數】分天編排（### Day 1：[今日主題]）。
            2. 每個景點必須附帶精準的「建議時間軸」（例如：09:30 - 11:00）。
            3. 嚴禁輸出任何 <br> 標籤、|| 符號、或 Markdown 表格，請全部改用標準「多層次段落空行」換行。
            4. 時間段與景點名字在詳細介紹中必須各自獨立成一行。

            【詳細介紹格式範例樣式】
            ### Day 1：[城市主軸探索]
            **08:00 - 10:30**
            從 {start_location} 出發前往 {city}
            - 交通方式 ({transport})：...
            - 特色描述：啟程出發。

            **10:30 - 12:00**
            [目的地的精選景點名稱一]
            - 特色描述：...

            【旅客基本需求】
            {user_need}

            【旅客最終選定想去的景點與微調意見】
            {spots_context}

            請輸出語氣貼心、格式極度留白、最上方帶有精簡總覽、下方緊跟詳細介紹的最終智慧行程表。
            """
            
            logger.info(f"最終行程表編排中 -> 鎖定城市: {city} | 出發地: {start_location} | 交通方式: {transport}")
            response = self.client.models.generate_content(model=self.model_name, contents=prompt)
            return response.text if response.text else "最終行程表生成失敗，請重試。"
        except Exception as e:
            logger.error(f"最終行程生成引擎發生異常: {str(e)}")
            return f"最終行程生成引擎發生異常: {str(e)}，請重新觸發生成。"

    def modify_itinerary(self, current_itinerary: str, modification_demand: str) -> str:
        """【行程表微調修改功能】接收現有行程表與微調指令，由 AI 重新優化輸出 """
        if not self.client:
            return "Gemini API 尚未正確初始化。"

        try:
            prompt = f"""
            你現在是台灣智慧旅遊規劃師。
            目前旅客已經生成了一份最終行程表，但提出了一些局部的微調或修改意見。
            請你根據旅客的新需求，在維持原本優秀動線的基礎下，對行程進行精確的調整與重排。

            【旅客的修改需求指令】
            『{modification_demand}』

            【目前的完整行程表】
            {current_itinerary}

            【硬性輸出排版規範】
            1. 必須維持原有的分天架構（Day 1, Day 2...）。
            2. 每日的大標題請用：### Day 1：[今日主題]
            3. 每個景點必須附帶精準的「建議時間軸」（例如：09:30 - 11:00）。
            4. 嚴禁輸出任何 <br> 標籤、|| 符號、或 Markdown 表格，請全部改用標準「多層次段落空行」換行。
            5. 時間段與景點名字必須各自獨立成一行。

            請輸出微調修改後、格式完全一致的全新智慧行程表。
            """
            
            logger.info(f" 正在為行程表執行微調需求 -> {modification_demand[:20]}...")
            response = self.client.models.generate_content(model=self.model_name, contents=prompt)
            return response.text if response.text else "微調行程表失敗，請重試。"
        except Exception as e:
            logger.error(f"行程表微調引擎發生異常: {str(e)}")
            raise Exception(f"微調引擎發生異常: {str(e)}")