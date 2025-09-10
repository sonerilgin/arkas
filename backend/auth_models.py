from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str
    full_name: str
    
class UserLogin(BaseModel):
    identifier: str  # email or phone
    password: str

class UserResponse(BaseModel):
    id: str
    email: Optional[str]
    phone: Optional[str]
    full_name: str
    is_verified: bool
    created_at: datetime
    
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None

class VerificationRequest(BaseModel):
    identifier: str  # email or phone
    code: str

class ForgotPasswordRequest(BaseModel):
    identifier: str  # email or phone

class ResetPasswordRequest(BaseModel):
    identifier: str
    code: str
    new_password: str

class BiometricRegisterRequest(BaseModel):
    user_id: str
    credential_id: str
    public_key: str
    
class BiometricLoginRequest(BaseModel):
    credential_id: str
    signature: str
    challenge: str