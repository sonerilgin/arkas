from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal

# PDF generation imports
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO

# Authentication imports
from auth_models import *
from auth_utils import *
from notification_service import NotificationService


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Backend URL for QR code downloads
BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:8000')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Collections
users_collection = db["users"]
verification_codes_collection = db["verification_codes"]
biometric_credentials_collection = db["biometric_credentials"]
nakliye_collection = db["nakliye_kayitlari"]
yatan_tutar_collection = db["yatan_tutar"]

# Security
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    token_data = verify_token(token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    identifier = token_data["identifier"]
    if is_valid_email(identifier):
        user = await users_collection.find_one({"email": identifier})
    else:
        user = await users_collection.find_one({"phone": identifier})
    
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class NakliyeKayit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tarih: datetime
    sira_no: str
    kod: Optional[str] = ""
    musteri: str
    irsaliye_no: str
    ithalat: bool = False
    ihracat: bool = False
    bos: bool = False
    bos_tasima: Optional[float] = 0.0
    reefer: Optional[float] = 0.0
    bekleme: Optional[float] = 0.0
    geceleme: Optional[float] = 0.0
    pazar: Optional[float] = 0.0
    harcirah: Optional[float] = 0.0
    toplam: Optional[float] = 0.0
    sistem: Optional[float] = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class YatanTutar(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tutar: float
    yatan_tarih: str  # Paranın yattığı tarih
    baslangic_tarih: str  # Çalışmanın başlangıç tarihi
    bitis_tarih: str  # Çalışmanın bitiş tarihi
    aciklama: Optional[str] = ""  # Ek açıklama
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class NakliyeKayitCreate(BaseModel):
    tarih: datetime
    sira_no: str
    kod: Optional[str] = ""
    musteri: str
    irsaliye_no: str
    ithalat: bool = False
    ihracat: bool = False
    bos: bool = False
    bos_tasima: Optional[float] = 0.0
    reefer: Optional[float] = 0.0
    bekleme: Optional[float] = 0.0
    geceleme: Optional[float] = 0.0
    pazar: Optional[float] = 0.0
    harcirah: Optional[float] = 0.0
    toplam: Optional[float] = 0.0
    sistem: Optional[float] = 0.0

class YatanTutarCreate(BaseModel):
    tutar: float
    yatan_tarih: str
    baslangic_tarih: str
    bitis_tarih: str
    aciklama: Optional[str] = ""


class NakliyeKayitUpdate(BaseModel):
    tarih: Optional[datetime] = None
    sira_no: Optional[str] = None
    kod: Optional[str] = None
    musteri: Optional[str] = None
    irsaliye_no: Optional[str] = None
    ithalat: Optional[bool] = None
    ihracat: Optional[bool] = None
    bos: Optional[bool] = None
    bos_tasima: Optional[float] = None
    reefer: Optional[float] = None
    bekleme: Optional[float] = None
    geceleme: Optional[float] = None
    pazar: Optional[float] = None
    harcirah: Optional[float] = None
    toplam: Optional[float] = None
    sistem: Optional[float] = None

class YatanTutarUpdate(BaseModel):
    tutar: Optional[float] = None
    yatan_tarih: Optional[str] = None
    baslangic_tarih: Optional[str] = None
    bitis_tarih: Optional[str] = None
    aciklama: Optional[str] = None
    yatan_tarih: Optional[str] = None


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
    return {"message": "Arkas Lojistik - Nakliye Takip Sistemi API"}


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
                {"kod": {"$regex": query, "$options": "i"}},
                {"irsaliye_no": {"$regex": query, "$options": "i"}}
            ]
        }
        nakliye_kayitlari = await db.nakliye_kayitlari.find(search_filter).sort("tarih", -1).skip(skip).limit(limit).to_list(limit)
        return [NakliyeKayit(**parse_from_mongo(kayit)) for kayit in nakliye_kayitlari]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ========== YATAN TUTAR ENDPOINTS ==========

@api_router.post("/yatan-tutar", response_model=YatanTutar)
async def create_yatan_tutar(input: YatanTutarCreate):
    try:
        yatan_tutar_dict = input.dict()
        yatan_tutar_obj = YatanTutar(**yatan_tutar_dict)
        prepared_data = prepare_for_mongo(yatan_tutar_obj.dict())
        await db.yatan_tutar.insert_one(prepared_data)
        return yatan_tutar_obj
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/yatan-tutar", response_model=List[YatanTutar])
async def get_yatan_tutar_list(skip: int = 0, limit: int = 100):
    try:
        yatan_tutar_kayitlari = await db.yatan_tutar.find().sort("yatan_tarih", -1).skip(skip).limit(limit).to_list(limit)
        return [YatanTutar(**parse_from_mongo(kayit)) for kayit in yatan_tutar_kayitlari]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/yatan-tutar/{yatan_tutar_id}", response_model=YatanTutar)
async def get_yatan_tutar_by_id(yatan_tutar_id: str):
    try:
        yatan_tutar_kayit = await db.yatan_tutar.find_one({"id": yatan_tutar_id})
        if not yatan_tutar_kayit:
            raise HTTPException(status_code=404, detail="Yatan tutar kaydı bulunamadı")
        return YatanTutar(**parse_from_mongo(yatan_tutar_kayit))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/yatan-tutar/{yatan_tutar_id}", response_model=YatanTutar)
async def update_yatan_tutar(yatan_tutar_id: str, input: YatanTutarUpdate):
    try:
        update_data = {k: v for k, v in input.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="Güncellenecek veri bulunamadı")
        
        prepared_data = prepare_for_mongo(update_data)
        result = await db.yatan_tutar.update_one(
            {"id": yatan_tutar_id},
            {"$set": prepared_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Yatan tutar kaydı bulunamadı")
        
        updated_kayit = await db.yatan_tutar.find_one({"id": yatan_tutar_id})
        return YatanTutar(**parse_from_mongo(updated_kayit))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/yatan-tutar/{yatan_tutar_id}")
async def delete_yatan_tutar(yatan_tutar_id: str):
    try:
        result = await db.yatan_tutar.delete_one({"id": yatan_tutar_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Yatan tutar kaydı bulunamadı")
        return {"message": "Yatan tutar kaydı başarıyla silindi"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ========== AUTHENTICATION ENDPOINTS ==========

@api_router.post("/auth/register", response_model=dict)
async def register_user(user_data: UserCreate):
    try:
        # Validate that either email or phone is provided
        if not user_data.email and not user_data.phone:
            raise HTTPException(status_code=400, detail="Email veya telefon numarası gerekli")
        
        # Validate email format if provided
        if user_data.email and not is_valid_email(user_data.email):
            raise HTTPException(status_code=400, detail="Geçersiz email formatı")
        
        # Validate and format phone if provided
        if user_data.phone:
            if not is_valid_phone(user_data.phone):
                raise HTTPException(status_code=400, detail="Geçersiz telefon numarası formatı")
            user_data.phone = format_phone(user_data.phone)
        
        # Check if user already exists
        existing_user = None
        if user_data.email:
            existing_user = await users_collection.find_one({"email": user_data.email})
        if not existing_user and user_data.phone:
            existing_user = await users_collection.find_one({"phone": user_data.phone})
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Bu email veya telefon numarası zaten kullanılıyor")
        
        # Create user - DIRECTLY VERIFIED
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(user_data.password)
        
        user_doc = {
            "id": user_id,
            "email": user_data.email,
            "phone": user_data.phone,
            "full_name": user_data.full_name,
            "hashed_password": hashed_password,
            "is_verified": True,  # AUTO VERIFIED - NO EMAIL/SMS NEEDED
            "created_at": datetime.now(timezone.utc),
            "verified_at": datetime.now(timezone.utc)
        }
        
        await users_collection.insert_one(user_doc)
        
        return {
            "message": "Hesap başarıyla oluşturuldu. Giriş yapabilirsiniz.",
            "user_id": user_id,
            "auto_verified": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kayıt sırasında hata: {str(e)}")

@api_router.post("/auth/verify", response_model=dict)
async def verify_user(verification_data: VerificationRequest):
    try:
        # Find verification code
        verification = await verification_codes_collection.find_one({
            "identifier": verification_data.identifier,
            "code": verification_data.code,
            "used": False
        })
        
        if not verification:
            raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş doğrulama kodu")
        
        # Check if expired
        expires_at = verification["expires_at"]
        if isinstance(expires_at, str):
            # Parse string datetime
            expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
        elif expires_at.tzinfo is None:
            # Make naive datetime timezone-aware (assume UTC)
            expires_at = expires_at.replace(tzinfo=timezone.utc)
            
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Doğrulama kodunun süresi dolmuş")
        
        # Mark verification as used
        await verification_codes_collection.update_one(
            {"_id": verification["_id"]},
            {"$set": {"used": True, "used_at": datetime.now(timezone.utc)}}
        )
        
        # Update user as verified
        await users_collection.update_one(
            {"id": verification["user_id"]},
            {"$set": {"is_verified": True, "verified_at": datetime.now(timezone.utc)}}
        )
        
        return {"message": "Hesap başarıyla doğrulandı"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Doğrulama sırasında hata: {str(e)}")

@api_router.post("/auth/login", response_model=Token)
async def login_user(login_data: UserLogin):
    try:
        # Find user by email or phone
        user = None
        if is_valid_email(login_data.identifier):
            user = await users_collection.find_one({"email": login_data.identifier})
        else:
            formatted_phone = format_phone(login_data.identifier)
            user = await users_collection.find_one({"phone": formatted_phone})
        
        if not user:
            raise HTTPException(status_code=401, detail="Geçersiz kimlik bilgileri")
        
        # Verify password
        if not verify_password(login_data.password, user["hashed_password"]):
            raise HTTPException(status_code=401, detail="Geçersiz kimlik bilgileri")
        
        # NO VERIFICATION CHECK - DIRECT LOGIN
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user.get("email") or user.get("phone")}
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Giriş sırasında hata: {str(e)}")

@api_router.post("/auth/forgot-password", response_model=dict)
async def forgot_password(forgot_data: ForgotPasswordRequest):
    try:
        # Find user
        user = None
        if is_valid_email(forgot_data.identifier):
            user = await users_collection.find_one({"email": forgot_data.identifier})
        else:
            formatted_phone = format_phone(forgot_data.identifier)
            user = await users_collection.find_one({"phone": formatted_phone})
        
        if not user:
            # Return success even if user not found (security)
            return {"message": "Eğer hesap varsa, şifre sıfırlama kodu gönderildi"}
        
        # Generate reset code
        reset_code = generate_verification_code()
        
        # Store reset code
        await verification_codes_collection.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "code": reset_code,
            "type": "password_reset",
            "identifier": forgot_data.identifier,
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
            "used": False
        })
        
        # Send reset code
        if user.get("email"):
            await NotificationService.send_password_reset_email(
                user["email"], reset_code, user["full_name"]
            )
        else:
            await NotificationService.send_password_reset_sms(
                user["phone"], reset_code, user["full_name"]
            )
        
        return {"message": "Şifre sıfırlama kodu gönderildi"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Şifre sıfırlama sırasında hata: {str(e)}")

@api_router.post("/auth/reset-password", response_model=dict)
async def reset_password(reset_data: ResetPasswordRequest):
    try:
        # Find verification code
        verification = await verification_codes_collection.find_one({
            "identifier": reset_data.identifier,
            "code": reset_data.code,
            "type": "password_reset",
            "used": False
        })
        
        if not verification:
            raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş sıfırlama kodu")
        
        # Check if expired
        expires_at = verification["expires_at"]
        if isinstance(expires_at, str):
            # Parse string datetime
            expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
        elif expires_at.tzinfo is None:
            # Make naive datetime timezone-aware (assume UTC)
            expires_at = expires_at.replace(tzinfo=timezone.utc)
            
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Sıfırlama kodunun süresi dolmuş")
        
        # Mark verification as used
        await verification_codes_collection.update_one(
            {"_id": verification["_id"]},
            {"$set": {"used": True, "used_at": datetime.now(timezone.utc)}}
        )
        
        # Update user password
        new_hashed_password = get_password_hash(reset_data.new_password)
        await users_collection.update_one(
            {"id": verification["user_id"]},
            {"$set": {
                "hashed_password": new_hashed_password,
                "password_reset_at": datetime.now(timezone.utc)
            }}
        )
        
        return {"message": "Şifre başarıyla sıfırlandı"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Şifre sıfırlama sırasında hata: {str(e)}")

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user.get("email"),
        phone=current_user.get("phone"),
        full_name=current_user["full_name"],
        is_verified=current_user.get("is_verified", False),
        created_at=current_user["created_at"]
    )

@api_router.post("/auth/resend-verification", response_model=dict)
async def resend_verification_code(identifier: str):
    try:
        # Find user
        user = None
        if is_valid_email(identifier):
            user = await users_collection.find_one({"email": identifier})
        else:
            formatted_phone = format_phone(identifier)
            user = await users_collection.find_one({"phone": formatted_phone})
        
        if not user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
        if user.get("is_verified", False):
            raise HTTPException(status_code=400, detail="Hesap zaten doğrulanmış")
        
        # Generate new verification code
        verification_code = generate_verification_code()
        
        # Store verification code
        await verification_codes_collection.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "code": verification_code,
            "type": "email_verification" if user.get("email") else "phone_verification",
            "identifier": identifier,
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
            "used": False
        })
        
        # Send verification code
        if user.get("email"):
            success = await NotificationService.send_verification_email(
                user["email"], verification_code, user["full_name"]
            )
        else:
            success = await NotificationService.send_verification_sms(
                user["phone"], verification_code, user["full_name"]
            )
        
        return {"message": "Doğrulama kodu tekrar gönderildi", "sent": success}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Doğrulama kodu gönderme sırasında hata: {str(e)}")


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@api_router.post("/generate-backup-download")
async def generate_backup_download():
    """Android için server-side yedek oluşturma - düzeltilmiş"""
    try:
        from datetime import datetime
        import json
        import tempfile
        import os
        
        # Tüm verileri al
        nakliye_data = await db.nakliye_kayitlari.find().to_list(length=None)
        yatan_tutar_data = await db.yatan_tutar.find().to_list(length=None)
        
        # MongoDB ObjectId'leri string'e çevir
        for item in nakliye_data:
            if '_id' in item:
                del item['_id']
        
        for item in yatan_tutar_data:
            if '_id' in item:
                del item['_id']
        
        backup_data = {
            "timestamp": datetime.now().isoformat(),
            "version": "2.0",
            "nakliyeData": nakliye_data,  
            "yatulanTutarData": yatan_tutar_data
        }
        
        # Geçici JSON dosyası oluştur
        filename = f"Arkas_Yedek_{datetime.now().strftime('%Y-%m-%d')}.json"
        temp_path = f"/tmp/{filename}"
        
        with open(temp_path, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, ensure_ascii=False, indent=2, default=str)
        
        if not os.path.exists(temp_path):
            raise HTTPException(status_code=500, detail="Yedek dosyası oluşturulamadı")
            
        return FileResponse(
            temp_path,
            media_type='application/json',
            filename=filename,
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
        
    except Exception as e:
        logger.error(f"Backup download hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server yedek hatası: {str(e)}")

@api_router.post("/generate-pdf-download") 
async def generate_pdf_download(request: dict):
    """Android için server-side PDF oluşturma - basitleştirilmiş"""
    try:
        from datetime import datetime
        import tempfile
        import os
        
        # PDF verilerini al
        data = request.get('data', [])
        period = request.get('period', 'Unknown')
        
        if not data or len(data) == 0:
            raise HTTPException(status_code=400, detail="PDF için veri bulunamadı")
        
        # Yatan tutar verilerini al
        yatan_data = request.get('yatan_data', [])
        
        # Detaylı HTML tablosu oluştur - Landscape ve tüm bilgiler dahil
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Arkas Lojistik - {period} Raporu</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 15px; font-size: 10px; }}
                .header {{ text-align: center; margin-bottom: 20px; }}
                .header h1 {{ margin: 5px 0; color: #1e2563; }}
                .header h2 {{ margin: 5px 0; color: #3b82f6; }}
                table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
                th, td {{ border: 1px solid #333; padding: 4px; text-align: left; font-size: 9px; }}
                th {{ background-color: #f0f0f0; font-weight: bold; }}
                .right {{ text-align: right; }}
                .center {{ text-align: center; }}
                .nakliye-table th {{ background-color: #dbeafe; }}
                .yatan-table th {{ background-color: #fdf4ff; }}
                .summary {{ background-color: #f9fafb; padding: 10px; margin: 10px 0; border: 1px solid #d1d5db; }}
                .footer {{ font-size: 8px; color: #666; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>ARKAS LOJİSTİK</h1>
                <h2>{period} NAKLİYE VE YATAN TUTAR RAPORU</h2>
                <p>Rapor Tarihi: {datetime.now().strftime('%d.%m.%Y %H:%M')}</p>
            </div>
            
            <h3>📦 NAKLİYE KAYITLARI</h3>
            <table class="nakliye-table">
                <thead>
                    <tr>
                        <th class="center">Sıra No</th>
                        <th class="center">Kod</th>
                        <th>Müşteri</th>
                        <th class="center">İrsaliye No</th>
                        <th class="center">Tarih</th>
                        <th class="center">Tür</th>
                        <th class="right">Boş Taşıma (₺)</th>
                        <th class="right">Reefer (₺)</th>
                        <th class="right">Bekleme (₺)</th>
                        <th class="right">Geceleme (₺)</th>
                        <th class="right">Pazar (₺)</th>
                        <th class="right">Harcirah (₺)</th>
                        <th class="right">Toplam (₺)</th>
                        <th class="right">Sistem (₺)</th>
                    </tr>
                </thead>
                <tbody>
        """
        
        total_amount = 0
        total_sistem = 0
        for item in data:
            toplam = float(item.get('toplam', 0))
            sistem = float(item.get('sistem', 0))
            total_amount += toplam
            total_sistem += sistem
            
            # Tarih formatı
            tarih_str = item.get('tarih', '')
            if tarih_str:
                try:
                    tarih_obj = datetime.fromisoformat(tarih_str.replace('T', ' ').replace('Z', '+00:00'))
                    tarih_formatted = tarih_obj.strftime('%d.%m.%Y')
                except:
                    tarih_formatted = tarih_str[:10] if len(tarih_str) >= 10 else tarih_str
            else:
                tarih_formatted = ''
            
            # Tür bilgileri
            turler = []
            if item.get('ithalat'): turler.append('İthalat')
            if item.get('ihracat'): turler.append('İhracat')
            if item.get('bos'): turler.append('Boş')
            tur_str = ', '.join(turler) if turler else '-'
            
            html_content += f"""
                    <tr>
                        <td class="center">{item.get('sira_no', '')}</td>
                        <td class="center">{item.get('kod', '') or '-'}</td>
                        <td>{item.get('musteri', '')}</td>
                        <td class="center">{item.get('irsaliye_no', '')}</td>
                        <td class="center">{tarih_formatted}</td>
                        <td class="center">{tur_str}</td>
                        <td class="right">{float(item.get('bos_tasima', 0)):,.2f}</td>
                        <td class="right">{float(item.get('reefer', 0)):,.2f}</td>
                        <td class="right">{float(item.get('bekleme', 0)):,.2f}</td>
                        <td class="right">{float(item.get('geceleme', 0)):,.2f}</td>
                        <td class="right">{float(item.get('pazar', 0)):,.2f}</td>
                        <td class="right">{float(item.get('harcirah', 0)):,.2f}</td>
                        <td class="right"><strong>{toplam:,.2f}</strong></td>
                        <td class="right"><strong>{sistem:,.2f}</strong></td>
                    </tr>
            """
        
        html_content += f"""
                </tbody>
                <tfoot>
                    <tr style="font-weight: bold; background-color: #dbeafe;">
                        <td colspan="12" class="right"><strong>NAKLİYE TOPLAMI:</strong></td>
                        <td class="right"><strong>{total_amount:,.2f} ₺</strong></td>
                        <td class="right"><strong>{total_sistem:,.2f} ₺</strong></td>
                    </tr>
                </tfoot>
            </table>
        """
        
        # Yatan Tutar tablosu ekle
        if yatan_data and len(yatan_data) > 0:
            total_yatan = sum(float(item.get('tutar', 0)) for item in yatan_data)
            
            html_content += f"""
            <h3>💰 YATAN TUTAR KAYITLARI</h3>
            <table class="yatan-table">
                <thead>
                    <tr>
                        <th class="center">Yatan Tarih</th>
                        <th class="center">Çalışma Başlangıç</th>
                        <th class="center">Çalışma Bitiş</th>
                        <th class="right">Yatan Tutar (₺)</th>
                        <th>Açıklama</th>
                    </tr>
                </thead>
                <tbody>
            """
            
            for item in yatan_data:
                tutar = float(item.get('tutar', 0))
                
                # Tarih formatları
                yatan_tarih = item.get('yatan_tarih', '')
                if yatan_tarih:
                    try:
                        yatan_tarih = datetime.fromisoformat(yatan_tarih.replace('T', ' ').replace('Z', '+00:00')).strftime('%d.%m.%Y')
                    except:
                        yatan_tarih = yatan_tarih[:10] if len(yatan_tarih) >= 10 else yatan_tarih
                
                baslangic_tarih = item.get('baslangic_tarih', '')
                if baslangic_tarih:
                    try:
                        baslangic_tarih = datetime.fromisoformat(baslangic_tarih.replace('T', ' ').replace('Z', '+00:00')).strftime('%d.%m.%Y')
                    except:
                        baslangic_tarih = baslangic_tarih[:10] if len(baslangic_tarih) >= 10 else baslangic_tarih
                
                bitis_tarih = item.get('bitis_tarih', '')
                if bitis_tarih:
                    try:
                        bitis_tarih = datetime.fromisoformat(bitis_tarih.replace('T', ' ').replace('Z', '+00:00')).strftime('%d.%m.%Y')
                    except:
                        bitis_tarih = bitis_tarih[:10] if len(bitis_tarih) >= 10 else bitis_tarih
                
                aciklama = item.get('aciklama', '') or '-'
                
                html_content += f"""
                        <tr>
                            <td class="center">{yatan_tarih}</td>
                            <td class="center">{baslangic_tarih}</td>
                            <td class="center">{bitis_tarih}</td>
                            <td class="right"><strong>{tutar:,.2f}</strong></td>
                            <td>{aciklama}</td>
                        </tr>
                """
            
            html_content += f"""
                </tbody>
                <tfoot>
                    <tr style="font-weight: bold; background-color: #fdf4ff;">
                        <td colspan="3" class="right"><strong>YATAN TUTAR TOPLAMI:</strong></td>
                        <td class="right"><strong>{total_yatan:,.2f} ₺</strong></td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
            """
        
        # Özet Bölümü
        html_content += f"""
            <div class="summary">
                <h3>📊 DÖNEM ÖZETİ</h3>
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <p><strong>Nakliye Kayıt Sayısı:</strong> {len(data)} adet</p>
                        <p><strong>Nakliye Toplam Tutarı:</strong> {total_amount:,.2f} ₺</p>
                        <p><strong>Sistem Toplam Tutarı:</strong> {total_sistem:,.2f} ₺</p>
                    </div>"""
        
        if yatan_data and len(yatan_data) > 0:
            total_yatan = sum(float(item.get('tutar', 0)) for item in yatan_data)
            html_content += f"""
                    <div>
                        <p><strong>Yatan Tutar Kayıt Sayısı:</strong> {len(yatan_data)} adet</p>
                        <p><strong>Toplam Yatan Tutar:</strong> {total_yatan:,.2f} ₺</p>
                        <p><strong>Fark (Nakliye - Yatan):</strong> {(total_amount - total_yatan):,.2f} ₺</p>
                    </div>"""
        
        html_content += f"""
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Rapor Detayları:</strong></p>
                <p>• Oluşturulma Tarihi: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}</p>
                <p>• Rapor Dönemi: {period}</p>
                <p>• Sistem: Arkas Lojistik Nakliye Takip Sistemi</p>
            </div>
        </body>
        </html>
        """
        
        # ReportLab ile PDF oluştur
        pdf_filename = f"Arkas_Lojistik_{period}_Raporu.pdf"
        pdf_path = f"/tmp/{pdf_filename}"
        
        # PDF oluşturma fonksiyonu
        doc = SimpleDocTemplate(pdf_path, pagesize=landscape(A4))
        elements = []
        
        # Stil tanımlamaları
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=16,
            alignment=1,  # Center
            spaceAfter=20
        )
        
        # Başlık
        title = Paragraph(f"ARKAS LOJİSTİK - {period} RAPORU", title_style)
        elements.append(title)
        elements.append(Spacer(1, 20))
        
        # Nakliye tablosu verilerini hazırla
        nakliye_data = [['Sıra No', 'Kod', 'Müşteri', 'İrsaliye No', 'Tarih', 'Tür', 'Boş Taşıma', 'Reefer', 'Bekleme', 'Geceleme', 'Pazar', 'Harcirah', 'Toplam', 'Sistem']]
        
        total_amount = 0
        total_sistem = 0
        
        for item in data:
            toplam = float(item.get('toplam', 0))
            sistem = float(item.get('sistem', 0))
            total_amount += toplam
            total_sistem += sistem
            
            # Tarih formatı
            tarih_str = item.get('tarih', '')
            if tarih_str:
                try:
                    tarih_obj = datetime.fromisoformat(tarih_str.replace('T', ' ').replace('Z', '+00:00'))
                    tarih_formatted = tarih_obj.strftime('%d.%m.%Y')
                except:
                    tarih_formatted = tarih_str[:10] if len(tarih_str) >= 10 else tarih_str
            else:
                tarih_formatted = ''
            
            # Tür bilgileri
            turler = []
            if item.get('ithalat'): turler.append('İthalat')
            if item.get('ihracat'): turler.append('İhracat')
            if item.get('bos'): turler.append('Boş')
            tur_str = ', '.join(turler) if turler else '-'
            
            nakliye_data.append([
                item.get('sira_no', ''),
                item.get('kod', '') or '-',
                item.get('musteri', ''),
                item.get('irsaliye_no', ''),
                tarih_formatted,
                tur_str,
                f"{float(item.get('bos_tasima', 0)):,.2f}",
                f"{float(item.get('reefer', 0)):,.2f}",
                f"{float(item.get('bekleme', 0)):,.2f}",
                f"{float(item.get('geceleme', 0)):,.2f}",
                f"{float(item.get('pazar', 0)):,.2f}",
                f"{float(item.get('harcirah', 0)):,.2f}",
                f"{toplam:,.2f}",
                f"{sistem:,.2f}"
            ])
        
        # Toplam satırı ekle
        nakliye_data.append(['', '', '', '', '', '', '', '', '', '', '', 'TOPLAM:', f"{total_amount:,.2f}", f"{total_sistem:,.2f}"])
        
        # Nakliye tablosu oluştur
        nakliye_table = Table(nakliye_data)
        nakliye_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('FONTSIZE', (0, 1), (-1, -1), 7),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(nakliye_table)
        
        # Yatan tutar bölümü (eğer varsa)
        if yatan_data and len(yatan_data) > 0:
            elements.append(Spacer(1, 20))
            yatan_title = Paragraph("YATAN TUTAR KAYITLARI", styles['Heading2'])
            elements.append(yatan_title)
            elements.append(Spacer(1, 10))
            
            yatan_table_data = [['Yatan Tarih', 'Çalışma Başlangıç', 'Çalışma Bitiş', 'Yatan Tutar', 'Açıklama']]
            total_yatan = 0
            
            for item in yatan_data:
                tutar = float(item.get('tutar', 0))
                total_yatan += tutar
                
                # Tarih formatları
                yatan_tarih = item.get('yatan_tarih', '')
                if yatan_tarih:
                    try:
                        yatan_tarih = datetime.fromisoformat(yatan_tarih.replace('T', ' ').replace('Z', '+00:00')).strftime('%d.%m.%Y')
                    except:
                        yatan_tarih = yatan_tarih[:10] if len(yatan_tarih) >= 10 else yatan_tarih
                
                baslangic_tarih = item.get('baslangic_tarih', '')
                if baslangic_tarih:
                    try:
                        baslangic_tarih = datetime.fromisoformat(baslangic_tarih.replace('T', ' ').replace('Z', '+00:00')).strftime('%d.%m.%Y')
                    except:
                        baslangic_tarih = baslangic_tarih[:10] if len(baslangic_tarih) >= 10 else baslangic_tarih
                
                bitis_tarih = item.get('bitis_tarih', '')
                if bitis_tarih:
                    try:
                        bitis_tarih = datetime.fromisoformat(bitis_tarih.replace('T', ' ').replace('Z', '+00:00')).strftime('%d.%m.%Y')
                    except:
                        bitis_tarih = bitis_tarih[:10] if len(bitis_tarih) >= 10 else bitis_tarih
                
                yatan_table_data.append([
                    yatan_tarih,
                    baslangic_tarih,
                    bitis_tarih,
                    f"{tutar:,.2f}",
                    item.get('aciklama', '') or '-'
                ])
            
            yatan_table_data.append(['', '', 'TOPLAM:', f"{total_yatan:,.2f}", ''])
            
            yatan_table = Table(yatan_table_data)
            yatan_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightcoral),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -2), colors.white),
                ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            elements.append(yatan_table)
        
        # PDF'i oluştur
        doc.build(elements)
        
        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename=pdf_filename,
            headers={
                "Content-Disposition": f"attachment; filename={pdf_filename}",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache", 
                "Expires": "0"
            }
        )
            
    except Exception as e:
        logger.error(f"PDF generation hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server PDF hatası: {str(e)}")

@api_router.get("/download-temp/{file_id}")
async def download_temp_file(file_id: str):
    """Geçici dosya indirme endpoint'i - QR kod için"""
    try:
        import os
        
        # Geçici dosya yolunu kontrol et
        temp_path = f"/tmp/{file_id}"
        logger.info(f"Download request for file: {file_id}, path: {temp_path}")
        logger.info(f"File exists: {os.path.exists(temp_path)}")
        
        if not os.path.exists(temp_path):
            logger.error(f"File not found: {temp_path}")
            raise HTTPException(status_code=404, detail="Dosya bulunamadı veya süresi dolmuş")
        
        # Dosya tipini belirle
        if file_id.endswith('.pdf'):
            media_type = 'application/pdf'
        elif file_id.endswith('.json'):
            media_type = 'application/json'
        else:
            media_type = 'application/octet-stream'
        
        return FileResponse(
            temp_path,
            media_type=media_type,
            filename=file_id,
            headers={
                "Content-Disposition": f"attachment; filename={file_id}",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Geçici dosya indirme hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Dosya indirme hatası: {str(e)}")

@api_router.post("/generate-pdf-qr")
async def generate_pdf_qr(request: dict):
    """Android QR kod için PDF oluşturma - geçici URL döndürür"""
    try:
        from datetime import datetime
        import uuid
        import tempfile
        import os
        
        # PDF verilerini al
        data = request.get('data', [])
        period = request.get('period', 'Unknown')
        
        if not data or len(data) == 0:
            raise HTTPException(status_code=400, detail="PDF için veri bulunamadı")
        
        # Benzersiz dosya ID'si oluştur
        file_id = f"Arkas_PDF_{uuid.uuid4().hex[:8]}.pdf"
        
        # ReportLab ile PDF oluştur
        pdf_path = f"/tmp/{file_id}"
        
        # PDF oluşturma fonksiyonu
        doc = SimpleDocTemplate(pdf_path, pagesize=landscape(A4))
        elements = []
        
        # Stil tanımlamaları
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=16,
            alignment=1,  # Center
            spaceAfter=20
        )
        
        # Başlık
        title = Paragraph(f"ARKAS LOJİSTİK - {period} RAPORU", title_style)
        elements.append(title)
        elements.append(Spacer(1, 20))
        
        # Tablo verilerini hazırla
        table_data = [['Sıra No', 'Müşteri', 'İrsaliye No', 'Tarih', 'Toplam (₺)', 'Sistem (₺)']]
        
        total_amount = 0
        total_sistem = 0
        
        for item in data:
            toplam = float(item.get('toplam', 0))
            sistem = float(item.get('sistem', 0))
            total_amount += toplam
            total_sistem += sistem
            
            # Tarih formatı
            tarih_str = item.get('tarih', '')
            if tarih_str:
                try:
                    tarih_obj = datetime.fromisoformat(tarih_str.replace('T', ' ').replace('Z', '+00:00'))
                    tarih_formatted = tarih_obj.strftime('%d.%m.%Y')
                except:
                    tarih_formatted = tarih_str[:10] if len(tarih_str) >= 10 else tarih_str
            else:
                tarih_formatted = ''
            
            table_data.append([
                item.get('sira_no', ''),
                item.get('musteri', ''),
                item.get('irsaliye_no', ''),
                tarih_formatted,
                f"{toplam:,.2f}",
                f"{sistem:,.2f}"
            ])
        
        # Toplam satırı ekle
        table_data.append(['', '', '', 'TOPLAM:', f"{total_amount:,.2f}", f"{total_sistem:,.2f}"])
        
        # Tablo oluştur
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(table)
        
        # PDF'i oluştur
        doc.build(elements)
        
        if os.path.exists(pdf_path):
            # İndirme URL'ini döndür
            download_url = f"{BACKEND_URL}/api/download-temp/{file_id}"
            
            return {
                "success": True,
                "download_url": download_url,
                "file_id": file_id,
                "filename": f"Arkas_Lojistik_{period}_Raporu.pdf"
            }
        else:
            raise HTTPException(status_code=500, detail="PDF dosyası oluşturulamadı")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"QR PDF generation hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server PDF QR hatası: {str(e)}")

@api_router.post("/generate-backup-qr")
async def generate_backup_qr():
    """Android QR kod için yedek oluşturma - geçici URL döndürür"""
    try:
        import uuid
        import json
        from datetime import datetime
        
        # Benzersiz dosya ID'si oluştur
        file_id = f"Arkas_Yedek_{uuid.uuid4().hex[:8]}.json"
        
        # Tüm verileri al
        nakliye_data = await db.nakliye_kayitlari.find().to_list(length=None)
        yatan_tutar_data = await db.yatan_tutar.find().to_list(length=None)
        
        # MongoDB ObjectId'leri string'e çevir
        for item in nakliye_data:
            if '_id' in item:
                del item['_id']
        
        for item in yatan_tutar_data:
            if '_id' in item:
                del item['_id']
        
        backup_data = {
            "timestamp": datetime.now().isoformat(),
            "version": "2.0",
            "nakliyeData": nakliye_data,
            "yatulanTutarData": yatan_tutar_data
        }
        
        # JSON dosyası oluştur
        json_path = f"/tmp/{file_id}"
        
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, ensure_ascii=False, indent=2, default=str)
        
        # İndirme URL'ini döndür
        download_url = f"{BACKEND_URL}/api/download-temp/{file_id}"
        
        return {
            "success": True,
            "download_url": download_url,
            "file_id": file_id,
            "filename": file_id
        }
        
    except Exception as e:
        logger.error(f"QR backup generation hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server yedek QR hatası: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()