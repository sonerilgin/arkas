from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
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

# Authentication imports
from auth_models import *
from auth_utils import *
from notification_service import NotificationService


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Collections
users_collection = db["users"]
verification_codes_collection = db["verification_codes"]
biometric_credentials_collection = db["biometric_credentials"]

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
    yatan_tutar: Optional[float] = 0.0
    yatan_tarih: Optional[str] = ""
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
    yatan_tutar: Optional[float] = 0.0
    yatan_tarih: Optional[str] = ""


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
    yatan_tutar: Optional[float] = None
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