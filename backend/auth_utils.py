from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import secrets
import re
from typing import Optional
import random

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = "arkas_lojistik_secret_key_2025"  # Change this in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        identifier: str = payload.get("sub")
        if identifier is None:
            return None
        return {"identifier": identifier}
    except JWTError:
        return None

def generate_verification_code():
    """Generate 6-digit verification code"""
    return f"{random.randint(100000, 999999)}"

def is_valid_email(email: str) -> bool:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def is_valid_phone(phone: str) -> bool:
    # Turkish phone format: +90XXXXXXXXXX or 05XXXXXXXXX
    pattern = r'^(\+90|0)?5[0-9]{9}$'
    return re.match(pattern, phone) is not None

def format_phone(phone: str) -> str:
    """Format phone to +90XXXXXXXXXX"""
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone)
    
    if digits.startswith('90') and len(digits) == 12:
        return f"+{digits}"
    elif digits.startswith('5') and len(digits) == 10:
        return f"+90{digits}"
    elif digits.startswith('05') and len(digits) == 11:
        return f"+90{digits[1:]}"
    else:
        return phone  # Return as is if format is unclear