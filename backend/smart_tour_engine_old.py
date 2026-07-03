import os
import requests
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
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        
        self.tdx_id = os.getenv("TDX_CLIENT_ID") or 'a112222028-fb0180d6-bcf1-4afb'
        self.tdx_secret = os.getenv("TDX_CLIENT_SECRET") or 'f244a993-d7f3-4c08-986d-b60e472362f7'
        
        if self.gemini_key:
            self.client = genai.Client(api_key=self.gemini_key)
            self.model_name = 'gemini-2.5-pro'
        else:
            self.client = None
            logger.warning("未偵測到 GEMINI_API_KEY 環境變數，AI 功能將無法運作。")

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
            logger.error(f" TDX Token 換取失敗，HTTP 狀態碼: {res.status_code}，內容: {res.text}")
            return None
        except Exception as e:
            logger.error(f"TDX Token 連線異常: {str(e)}")
            return None

    def _fetch_tdx_spots(self, city: str, token: str):
        """
        【分頁全量撈取安全修復版】
        精確對齊 Basic V2 回傳的 List 結構，並保留 429 退讓冬眠與 3.5 秒配速機制。
        """
        base_url = "https://tdx.transportdata.tw/api/basic/v2/Tourism/ScenicSpot"
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }
        
        all_spots = []
        page_size = 100  
        skip_count = 0   
        consecutive_429_count = 0  
        max_429_retries = 5        
        
        clean_city = city.strip()
        if clean_city in ["台北市", "台北"]: clean_city = "臺北市"
        if clean_city in ["台中市", "台中"]: clean_city = "臺中市"
        if clean_city in ["台南市", "台南"]: clean_city = "臺南市"
        if clean_city in ["台東縣", "台東"]: clean_city = "臺東縣"
        if clean_city in ["台東市"]: clean_city = "臺東市"
        
        while True:
            params = {
                "$filter": f"City eq '{clean_city}'",
                "$top": page_size,
                "$skip": skip_count,
                "$format": "JSON"
            }
            try:
                res = requests.get(base_url, headers=headers, params=params, timeout=10)
                
                if res.status_code == 429:
                    consecutive_429_count += 1
                    if consecutive_429_count > max_429_retries:
                        logger.error(f" 【{clean_city}】連續觸發 429 流量超限已達最大重試上限，中斷抓取。")
                        break
                    
                    logger.warning(f" 觸發 TDX 流量超限 (429)。就地冬眠 15 秒後重試目前頁數...")
                    time.sleep(15.0)
                    continue  
                
                if res.status_code == 200:
                    consecutive_429_count = 0  
                    spots_list = res.json()  
                    
                    if not isinstance(spots_list, list) or not spots_list:
                        break
                        
                    all_spots.extend(spots_list)
                    logger.info(f"📡 已下載並暫存【{clean_city}】景點進度：{len(all_spots)} 筆...")
                    
                    if len(spots_list) < page_size:
                        break
                        
                    skip_count += page_size
                    
                    logger.info(" 慢速安全間隔：強制休息 3.5 秒...")
                    time.sleep(3.5)
                    
                else:
                    logger.error(f" TDX 伺服器回傳錯誤 ({res.status_code})，請求網址: {res.url}")
                    break
            except Exception as e:
                logger.error(f" TDX 景點分頁刮取異常 ({clean_city}): {str(e)}")
                break
        
        logger.info(f" 安全抓取完畢！【{clean_city}】總計成功獲取 {len(all_spots)} 個真實官方景點。")
        return all_spots

    def recommend_spots(self, user_need: str, city: str, tags: list, accumulated_spots: str) -> str:
        """
        【步驟 2~4：海選景點】將大數據庫分頁全量交付 AI 進行精確篩選
        """
        if not self.client:
            logger.error(" Gemini API 尚未正確初始化，請檢查環境變數。")
            return "Gemini API 尚未正確初始化，請檢查環境變數。"

        try:
            logger.info(f" [recommend_spots] 收到前端請求 -> 縣市: {city}, 標籤: {tags}")
            
            token = self._get_tdx_token()
            if not token:
                logger.error(" 無法取得 TDX Access Token，請檢查金鑰設定。")
            else:
                logger.info(" 成功換取 TDX Token。")

            target_cities = [c.strip() for c in city.split(",") if c.strip()]
            logger.info(f" 解析後的目的地縣市列表: {target_cities}")
            
            raw_spots = []
            if token:
                for c in target_cities:
                    logger.info(f"📡 準備向 TDX 請求【{c}】的全量景點資料...")
                    city_spots = self._fetch_tdx_spots(c, token)
                    if city_spots:
                        logger.info(f" 【{c}】成功獲取到 {len(city_spots)} 筆原始資料。")
                        raw_spots.extend(city_spots)
                    else:
                        logger.warning(f" 【{c}】回傳的景點資料庫為空（0 筆）。")

            is_fallback = False
            if not raw_spots:
                is_fallback = True
                logger.warning(" [警告] TDX 未撈到任何景點，強制啟動 AI 知識庫備用模式 (Fallback)！")
                cleaned_spots = [{"name": "系統備用模式", "address": "請 AI 依據知名地標排程", "description": "TDX 數據暫時離線"}]
            else:
                logger.info(f" 總計成功彙整 {len(raw_spots)} 筆真實官方景點，準備進行資料清洗。")
                cleaned_spots = []
                for spot in raw_spots: 
                    cleaned_spots.append({
                        "name": spot.get("ScenicSpotName", "未知景點"),
                        "address": spot.get("Address", "未提供詳細地址"),
                        "description": spot.get("DescriptionDetail", spot.get("Description", "暫無詳細說明"))[:120] + "..."
                    })

            fallback_instruction = ""
            if is_fallback:
                fallback_instruction = f"【緊急通告】目前官方 TDX API 離線，請你依據自身知識庫，挑選【{', '.join(target_cities)}】當地真實存在、極具代表性的知名景點，絕對不可虛構不存在的地名！"

            prompt = f"""
            你現在是台灣頂級智慧旅遊規劃師。
            目前系統已透過分頁技術，從台灣官方 TDX API 中刮取出了目的地縣市的【全量真實景點大數據庫】（總計 {len(cleaned_spots)} 個官方登記景點）。
            
            請展現你極致的語意篩選與邏輯能力，從這大批名單中，精確挑選出 8-12 個「最完美符合」旅客需求與偏好標籤的精選景點！

            【重要規範】
            1. 除非啟動緊急備用模式，否則禁止虛構任何列表中不存在的景點！必須 100% 從下方名單中挑選。
            2. 篩選指標：請細讀每個景點的描述，嚴格篩選出符合偏好的點。
            3. 請依縣市或地理分區歸類。針對選出的 8-12 個精選點，寫出 1-2 句直擊痛點的「推薦理由」，告訴旅客為什麼這個點符合他們勾選的標籤：{', '.join(tags)}。
            4. 這次【不需要】排具體時間軸（如 09:00），保留互動空間。

            【旅客偏好與需求】
            目的地縣市：{', '.join(target_cities)}
            {user_need}
            {fallback_instruction}

            【TDX 驗證之全量真實景點數據庫】
            {json.dumps(cleaned_spots, ensure_ascii=False, indent=2)}

            請輸出結構清晰、排版精美、語氣親切的「精選海選景點候選清單」。
            """

            logger.info(" 正在將全量數據與 Prompt 交付至 Gemini-2.5-Pro 模型進行海選...")
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            logger.info(" Gemini 成功產出推薦內容。")
            return response.text if response.text else "AI 未能產出內容，請重試。"
        except Exception as e:
            logger.error(f" 景點海選引擎發生嚴重異常: {str(e)}", exc_info=True)
            return f"景點海選引擎發生異常: {str(e)}，請稍後再試。"

    def analyze_selection(self, user_choice: str, spots_recommendation: str, accumulated_spots: str, user_need: str):
        """
        【高精度語意意圖網閘】過濾無關內容並判斷對話是否終止
        """
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
           - 如果使用者表達「確定了」、「可以排行程了」、「夠了」、「這樣就好」、「開始生成」等準備結束互動、正式導向最終排程的意圖，status 填 "READY"。
           - 如果使用者是在挑選景點、表達想去哪裡、不想去哪裡、或提出修改意見，status 填 "CONTINUE"。
           - 如果使用者輸入的內容是純粹的垃圾話、髒話、無關的閒聊，status 填 "REJECT"。

        2. 更新景點字串 (accumulated_spots)：
           - 如果 status 為 "REJECT"，請直接複製原本的暫存景點『{safe_accumulated}』。
           - 如果 status 為 "CONTINUE"，請根據使用者的新要求，智慧地調整並彙整想去的景點清單。

        3. 給使用者的提示訊息 (msg)：
           - READY: 填寫引導進入排程的親切回覆。
           - CONTINUE: 確認已記錄使用者的偏好，並提示可以繼續補充或輸入『確定排行程』。
           - REJECT: 溫柔且堅定地把話題拉回旅遊規劃，提醒使用者從海選清單中挑選。

        【輸出規範】
        你必須「完全只輸出」一個標準的 JSON 字串，不得包含 any Markdown 標籤。
        格式範例：
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
            clean_json = response.text.strip()
            result = json.loads(clean_json)
            return result["status"], result["accumulated_spots"], result["msg"]
        except Exception as e:
            logger.error(f" 意圖網閘異常，啟動防呆保底邏輯。錯誤原因: {str(e)}")
            stop_keywords = ["排行程", "夠了", "確定", "可以了", "生行程", "生成", "這樣就好"]
            
            if any(kw in safe_user_choice for kw in stop_keywords):
                return "READY", safe_accumulated, "好的，收到！正在為您編排完整的行程表..."
            
            new_spots = safe_accumulated + " + " + safe_user_choice if safe_accumulated else safe_user_choice
            return "CONTINUE", new_spots, f"已幫您記錄需求：『{safe_user_choice}』"

    def generate_final_itinerary(self, accumulated_spots: str, user_need: str, city: str, transport: str = "自駕") -> str:
        """【終極排程步驟】接收指定城市與交通約束，並以高規格寬鬆換行格式輸出最終行程表 """
        if not self.client:
            return "Gemini API 尚未正確初始化。"

        try:
            spots_context = accumulated_spots if accumulated_spots else "請依照前述海選推薦名單中，最符合旅客標籤的景點來排程。"
            
            prompt = f"""
            你現在是台灣頂級智慧旅遊規劃師。請針對旅客最終選定的【指定景點或微調意見】，結合其天數與需求，編排出一份極具可行性的完整旅遊行程表。

            【核心行為約束 - 城市與交通硬性指標】
            1. 使用者指定的旅遊城市是：{city}。你規劃的所有景點、餐廳、活動、甚至內文提及的任何地標，必須 100% 屬於該縣市，絕對不准跨縣市、跨區域規劃！（例如：使用者選桃園市，就絕對不准出現任何台北市信義區的景點，請精確推薦桃園當地的景點與商場）。
            2. 使用者指定的交通方式是：【{transport}】。請根據此交通工具的特性（例如大眾運輸要考慮班次與步行距離、自駕要考慮停車與路況），在交通描述中合理安排。

            【核心排程與排版規範】
            1. 必須嚴格遵守【預計行程天數】分天編排（Day 1, Day 2...）。
            2. 每日的大標題請用：### Day 1：[今日主題]
            3. 每個景點必須附帶精準的「建議時間軸」（例如：09:30 - 11:00）。
            4. 嚴禁輸出任何 <br> 標籤、|| 符號、或 Markdown 表格（如 |---| 這種欄位格式），請全部改用標準「多層次段落空行」換行。
            5. 每個景點、活動與建議時間軸，必須嚴格按照以下「分行格式」輸出，時間段與景點名字必須各自獨立成一行：

            【格式範例樣式】
            ### Day 1：[城市主軸探索]
            **10:00 - 12:00**
            [精選景點名稱一]
            - 交通方式 ({transport})：...
            - 特色描述：...

            **12:00 - 13:00**
            [午餐餐廳名稱]
            - 特色描述：享用當地特色美食。

            6. 每晚結束時，請給予一個明確且符合該縣市交通邏輯的「建議住宿區域」。

            【旅客基本需求】
            {user_need}

            【旅客最終選定想去的景點與微調意見】
            {spots_context}

            請輸出語氣貼心、格式極度留白、完全符合上方格式範例的最終智慧行程表。
            """
            
            logger.info(f"最終行程表編排中 -> 鎖定城市: {city} | 交通方式: {transport}")
            response = self.client.models.generate_content(model=self.model_name, contents=prompt)
            return response.text if response.text else "最終行程表生成失敗，請重試。"
        except Exception as e:
            logger.error(f"最終行程生成引擎發生異常: {str(e)}")
            return f"最終行程生成引擎發生異常: {str(e)}，請重新觸發生成。"