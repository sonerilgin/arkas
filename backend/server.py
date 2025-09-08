from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from decimal import Decimal


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class NakliyeKayit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tarih: datetime
    sira_no: str
    musteri: str
    irsaliye_no: str
    ithalat: bool = False
    ihracat: bool = False
    bos_tasima: Optional[float] = 0.0
    reefer: Optional[float] = 0.0
    bekleme: Optional[float] = 0.0
    geceleme: Optional[float] = 0.0
    pazar: Optional[float] = 0.0
    harcirah: Optional[float] = 0.0
    toplam: Optional[float] = 0.0
    sistem: Optional[float] = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class NakliyeKayitCreate(BaseModel):
    tarih: datetime
    sira_no: str
    musteri: str
    irsaliye_no: str
    ithalat: bool = False
    ihracat: bool = False
    bos_tasima: Optional[float] = 0.0
    reefer: Optional[float] = 0.0
    bekleme: Optional[float] = 0.0
    geceleme: Optional[float] = 0.0
    pazar: Optional[float] = 0.0
    harcirah: Optional[float] = 0.0
    toplam: Optional[float] = 0.0
    sistem: Optional[float] = 0.0


class NakliyeKayitUpdate(BaseModel):
    tarih: Optional[datetime] = None
    sira_no: Optional[str] = None
    musteri: Optional[str] = None
    irsaliye_no: Optional[str] = None
    ithalat: Optional[bool] = None
    ihracat: Optional[bool] = None
    bos_tasima: Optional[float] = None
    reefer: Optional[float] = None
    bekleme: Optional[float] = None
    geceleme: Optional[float] = None
    pazar: Optional[float] = None
    harcirah: Optional[float] = None
    toplam: Optional[float] = None
    sistem: Optional[float] = None


def prepare_for_mongo(data):
    """MongoDB serialization helper"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data


def parse_from_mongo(item):
    """MongoDB deserialization helper"""
    if isinstance(item, dict):
        for key, value in item.items():
            if key in ['tarih', 'created_at'] and isinstance(value, str):
                try:
                    item[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except:
                    pass
    return item


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Nakliye Kontrol Sistemi API"}


# Nakliye CRUD endpoints
@api_router.post("/nakliye", response_model=NakliyeKayit)
async def create_nakliye(input: NakliyeKayitCreate):
    try:
        nakliye_dict = input.dict()
        nakliye_obj = NakliyeKayit(**nakliye_dict)
        prepared_data = prepare_for_mongo(nakliye_obj.dict())
        await db.nakliye_kayitlari.insert_one(prepared_data)
        return nakliye_obj
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@api_router.get("/nakliye", response_model=List[NakliyeKayit])
async def get_nakliye_list(skip: int = 0, limit: int = 100):
    try:
        nakliye_kayitlari = await db.nakliye_kayitlari.find().sort("tarih", -1).skip(skip).limit(limit).to_list(limit)
        return [NakliyeKayit(**parse_from_mongo(kayit)) for kayit in nakliye_kayitlari]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@api_router.get("/nakliye/{nakliye_id}", response_model=NakliyeKayit)
async def get_nakliye_by_id(nakliye_id: str):
    try:
        nakliye_kayit = await db.nakliye_kayitlari.find_one({"id": nakliye_id})
        if not nakliye_kayit:
            raise HTTPException(status_code=404, detail="Nakliye kaydı bulunamadı")
        return NakliyeKayit(**parse_from_mongo(nakliye_kayit))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@api_router.put("/nakliye/{nakliye_id}", response_model=NakliyeKayit)
async def update_nakliye(nakliye_id: str, input: NakliyeKayitUpdate):
    try:
        update_data = {k: v for k, v in input.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="Güncellenecek veri bulunamadı")
        
        prepared_data = prepare_for_mongo(update_data)
        result = await db.nakliye_kayitlari.update_one(
            {"id": nakliye_id},
            {"$set": prepared_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Nakliye kaydı bulunamadı")
        
        updated_kayit = await db.nakliye_kayitlari.find_one({"id": nakliye_id})
        return NakliyeKayit(**parse_from_mongo(updated_kayit))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@api_router.delete("/nakliye/{nakliye_id}")
async def delete_nakliye(nakliye_id: str):
    try:
        result = await db.nakliye_kayitlari.delete_one({"id": nakliye_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Nakliye kaydı bulunamadı")
        return {"message": "Nakliye kaydı başarıyla silindi"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@api_router.get("/nakliye/search/{query}")
async def search_nakliye(query: str, skip: int = 0, limit: int = 100):
    try:
        search_filter = {
            "$or": [
                {"musteri": {"$regex": query, "$options": "i"}},
                {"sira_no": {"$regex": query, "$options": "i"}},
                {"irsaliye_no": {"$regex": query, "$options": "i"}}
            ]
        }
        nakliye_kayitlari = await db.nakliye_kayitlari.find(search_filter).sort("tarih", -1).skip(skip).limit(limit).to_list(limit)
        return [NakliyeKayit(**parse_from_mongo(kayit)) for kayit in nakliye_kayitlari]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()