import os
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

import google.generativeai as genai

from smart_tour_engine import SmartTourEngine

load_dotenv()

app = FastAPI(title="智遊台灣 AI 行程排程引擎 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RAW_KEYS = os.getenv("GEMINI_API_KEYS", os.getenv("GEMINI_API_KEY", ""))
API_KEYS = [k.strip() for k in RAW_KEYS.split(",") if k.strip()]

def call_gemini_with_fallback(prompt: str, model_name: str = "gemini-1.5-flash") -> str:
    """
    帶有自動轉移與輪詢機制的 Gemini 呼叫函式。
    當某一組 Key 遇到 429 額度超限或 503 服務忙碌時，自動切換至下一組 Key。
    """
    if not API_KEYS:
        raise ValueError("環境變數中未偵測到任何 GEMINI_API_KEY 或 GEMINI_API_KEYS！")

    last_exception = None

    for index, key in enumerate(API_KEYS):
        try:
            genai.configure(api_key=key)
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            return response.text

        except Exception as e:
            err_msg = str(e)
            # 偵測是否為 429 額度用盡或 503 伺服器超載/忙碌
            if any(code in err_msg for code in ["429", "RESOURCE_EXHAUSTED", "503", "UNAVAILABLE"]):
                print(f"⚠️ API Key #{index + 1} 觸發流量限制/服務忙碌 ({err_msg[:60]}...)，自動切換至下一組 Key...")
                last_exception = e
                time.sleep(1)
                continue
            else:
                # 其他非限流類的異常，紀錄後嘗試下一個 Key
                print(f"❌ API Key #{index + 1} 發生錯誤: {err_msg}")
                last_exception = e
                continue

    raise RuntimeError(f"所有 Gemini API Keys 皆已耗盡或連線失敗。最後錯誤：{last_exception}")

# 初始化行程引擎
engine = SmartTourEngine()

if hasattr(engine, 'call_llm'):
    engine.call_llm = call_gemini_with_fallback
# ---------------------------------------------------------

class RecommendRequest(BaseModel):
    city: str  
    days: int
    group_size: str  
    tags: List[str]
    accumulated_spots: Optional[str] = ""

class AnalyzeRequest(BaseModel):
    user_choice: str
    spots_recommendation: str
    accumulated_spots: str
    user_need: str

# --- 7/9 新增可以設定出發地 ---
class FinalItineraryRequest(BaseModel):
    accumulated_spots: str
    user_need: str
    city: str              
    transport: str = "自駕" 
    start_location: str = "臺北市" 
    start_time: str = "08:00"     

# --- 7/3 新增的微調修改 ---
class ModifyItineraryRequest(BaseModel):
    current_itinerary: str
    modification_demand: str
# -------------------------

@app.post("/api/v1/recommend-spots")
def api_recommend_spots(req: RecommendRequest):
    user_need = (
        f"旅遊人數規模：{req.group_size}\n"
        f"旅客特殊偏好標籤：{', '.join(req.tags) if req.tags else '無特殊偏好'}\n"
        f"預計行程天數：{req.days}天"
    )
    try:
        spots_recommendation = engine.recommend_spots(user_need, req.city, req.tags, req.accumulated_spots)
        return {
            "status": "CONTINUE",
            "user_need": user_need,
            "spots_recommendation": spots_recommendation,
            "accumulated_spots": req.accumulated_spots
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"推薦景點異常: {str(e)}")

@app.post("/api/v1/analyze-selection")
def api_analyze_selection(req: AnalyzeRequest):
    try:
        status, accumulated_spots, msg = engine.analyze_selection(
            req.user_choice, 
            req.spots_recommendation, 
            req.accumulated_spots, 
            req.user_need
        )
        return {
            "status": status,
            "accumulated_spots": accumulated_spots,
            "msg": msg
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分析景點異常: {str(e)}")

@app.post("/api/v1/generate-final")
async def generate_final(req: FinalItineraryRequest):
    try:
        result = engine.generate_final_itinerary(
            accumulated_spots=req.accumulated_spots,
            user_need=req.user_need,
            city=req.city,          
            transport=req.transport,
            start_location=req.start_location, 
            start_time=req.start_time        
        )
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成最終行程表異常: {str(e)}")

# --- 7/3 新增的微調修改 ---
@app.post("/api/v1/modify-itinerary")
def api_modify_itinerary(req: ModifyItineraryRequest):
    try:
        updated_itinerary = engine.modify_itinerary(
            current_itinerary=req.current_itinerary,
            modification_demand=req.modification_demand
        )
        return {
            "status": "success",
            "result": updated_itinerary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"修改行程異常: {str(e)}")
# -------------------------