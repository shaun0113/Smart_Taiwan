import os
import json 
#import smtplib
#import random
from fastapi import FastAPI, HTTPException, Depends 
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any 
from dotenv import load_dotenv
from email.mime.text import MIMEText
from datetime import datetime, timedelta

from smart_tour_engine import SmartTourEngine
from auth_routes import router as auth_router
from database import init_database, get_auth_db 
from profile_routes import router as profile_router
from auth import get_current_user 

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
app.include_router(auth_router)
app.include_router(profile_router)

@app.on_event("startup")
def startup_event():
    init_database()

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
    start_location: str = "臺北市" 
    start_time: str = "08:00"     

class ModifyItineraryRequest(BaseModel):
    current_itinerary: str
    modification_demand: str

class ItineraryCreate(BaseModel):
    title: str
    itinerary_data: List[Any]
    form_data: Dict[str, Any]

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

@app.post("/api/v1/itineraries")
def save_itinerary(itinerary: ItineraryCreate, current_user: dict = Depends(get_current_user)):
    with get_auth_db() as db:
        with db.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO itineraries (user_id, title, itinerary_data, form_data) 
                VALUES (%s, %s, %s, %s)
                """,
                (
                    current_user['id'], 
                    itinerary.title, 
                    json.dumps(itinerary.itinerary_data), 
                    json.dumps(itinerary.form_data)
                )
            )
    return {"status": "success", "msg": "行程已儲存至雲端"}

@app.get("/api/v1/itineraries")
def get_user_itineraries(current_user: dict = Depends(get_current_user)):
    with get_auth_db() as db:
        with db.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, title, itinerary_data, form_data, 
                       DATE_FORMAT(DATE_ADD(created_at, INTERVAL 8 HOUR), '%%Y-%%m-%%d %%H:%%i') as created_at 
                FROM itineraries 
                WHERE user_id = %s 
                ORDER BY created_at DESC 
                LIMIT 15
                """,
                (current_user['id'],)
            )
            records = cursor.fetchall()
            
            result = []
            for r in records:
                blocks = json.loads(r['itinerary_data']) if isinstance(r['itinerary_data'], str) else r['itinerary_data']
                form_data = json.loads(r['form_data']) if isinstance(r['form_data'], str) else r['form_data']
                
                result.append({
                    "id": r['id'],
                    "title": r['title'],
                    "blocks": blocks,
                    "formData": form_data,
                    "created_at": r['created_at']
                })
            return result
        
@app.delete("/api/v1/itineraries")
def clear_user_itineraries(current_user: dict = Depends(get_current_user)):
    with get_auth_db() as db:
        with db.cursor() as cursor:
            cursor.execute(
                "DELETE FROM itineraries WHERE user_id = %s",
                (current_user['id'],)
            )
    return {"status": "success", "msg": "歷史紀錄已全數清除"}