import os
from typing import Optional

# Temporarily disable email/SMS for testing
EMERGENT_LLM_KEY = "sk-emergent-79fF53aAf25Ec2f901"

class NotificationService:
    
    @staticmethod
    async def send_verification_email(email: str, code: str, full_name: str) -> bool:
        try:
            # For development - just print the code
            print(f"📧 VERIFICATION EMAIL to {email}: Code = {code}")
            print(f"Subject: Arkas Lojistik - Email Doğrulama Kodu")
            print(f"Dear {full_name}, your verification code is: {code}")
            return True
        except Exception as e:
            print(f"Email sending error: {e}")
            return False
    
    @staticmethod
    async def send_verification_sms(phone: str, code: str, full_name: str) -> bool:
        try:
            # For development - just print the code
            print(f"📱 VERIFICATION SMS to {phone}: Code = {code}")
            print(f"Arkas Lojistik doğrulama kodunuz: {code}")
            return True
        except Exception as e:
            print(f"SMS sending error: {e}")
            return False
    
    @staticmethod
    async def send_password_reset_email(email: str, code: str, full_name: str) -> bool:
        try:
            # For development - just print the code
            print(f"📧 PASSWORD RESET EMAIL to {email}: Code = {code}")
            print(f"Subject: Arkas Lojistik - Şifre Sıfırlama Kodu")
            print(f"Dear {full_name}, your password reset code is: {code}")
            return True
        except Exception as e:
            print(f"Password reset email error: {e}")
            return False
    
    @staticmethod
    async def send_password_reset_sms(phone: str, code: str, full_name: str) -> bool:
        try:
            # For development - just print the code
            print(f"📱 PASSWORD RESET SMS to {phone}: Code = {code}")
            print(f"Arkas Lojistik şifre sıfırlama kodunuz: {code}")
            return True
        except Exception as e:
            print(f"Password reset SMS error: {e}")
            return False