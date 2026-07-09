import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

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

engine = SmartTourEngine()

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

class FinalItineraryRequest(BaseModel):
    accumulated_spots: str
    user_need: str
    city: str               
    transport: str = "自駕" 

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
    result = engine.generate_final_itinerary(
        accumulated_spots=req.accumulated_spots,
        user_need=req.user_need,
        city=req.city,         
        transport=req.transport  
    )
    return {"result": result}
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
    #----------------------