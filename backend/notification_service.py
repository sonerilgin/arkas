import os
from emergentintegrations import send_email, send_sms
from typing import Optional

EMERGENT_LLM_KEY = "sk-emergent-79fF53aAf25Ec2f901"

class NotificationService:
    
    @staticmethod
    async def send_verification_email(email: str, code: str, full_name: str) -> bool:
        try:
            subject = "Arkas Lojistik - Email Doğrulama Kodu"
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1e2563; font-size: 28px; margin: 0;">ARKAS <span style="color: #3b82f6;">LOJİSTİK</span></h1>
                        <p style="color: #666; margin: 5px 0;">Nakliye Takip ve Yönetim Sistemi</p>
                    </div>
                    
                    <h2 style="color: #333; text-align: center;">Merhaba {full_name}!</h2>
                    
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">
                        Arkas Lojistik hesabınızı doğrulamak için aşağıdaki kodu kullanın:
                    </p>
                    
                    <div style="background-color: #f8f9fa; border: 2px dashed #3b82f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #1e2563; font-size: 36px; margin: 0; letter-spacing: 4px;">{code}</h1>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; line-height: 1.6;">
                        Bu kod 10 dakika süreyle geçerlidir. Güvenliğiniz için kodu kimseyle paylaşmayın.
                    </p>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 12px;">Bu email Arkas Lojistik sistemi tarafından otomatik olarak gönderilmiştir.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            result = send_email(
                api_key=EMERGENT_LLM_KEY,
                to_email=email,
                subject=subject,
                html_content=html_content
            )
            return result.get('success', False)
        except Exception as e:
            print(f"Email sending error: {e}")
            return False
    
    @staticmethod
    async def send_verification_sms(phone: str, code: str, full_name: str) -> bool:
        try:
            message = f"Arkas Lojistik doğrulama kodunuz: {code}\n\nGüvenliğiniz için kimseyle paylaşmayın.\n10 dakika geçerlidir."
            
            result = send_sms(
                api_key=EMERGENT_LLM_KEY,
                to_phone=phone,
                message=message
            )
            return result.get('success', False)
        except Exception as e:
            print(f"SMS sending error: {e}")
            return False
    
    @staticmethod
    async def send_password_reset_email(email: str, code: str, full_name: str) -> bool:
        try:
            subject = "Arkas Lojistik - Şifre Sıfırlama Kodu"
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #1e2563; font-size: 28px; margin: 0;">ARKAS <span style="color: #3b82f6;">LOJİSTİK</span></h1>
                        <p style="color: #666; margin: 5px 0;">Nakliye Takip ve Yönetim Sistemi</p>
                    </div>
                    
                    <h2 style="color: #333; text-align: center;">Merhaba {full_name}!</h2>
                    
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">
                        Şifrenizi sıfırlamak için aşağıdaki kodu kullanın:
                    </p>
                    
                    <div style="background-color: #fef2f2; border: 2px dashed #ef4444; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #dc2626; font-size: 36px; margin: 0; letter-spacing: 4px;">{code}</h1>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; line-height: 1.6;">
                        Bu kod 10 dakika süreyle geçerlidir. Eğer şifre sıfırlama talebinde bulunmadıysanız, bu emaili görmezden gelin.
                    </p>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 12px;">Bu email Arkas Lojistik sistemi tarafından otomatik olarak gönderilmiştir.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            result = send_email(
                api_key=EMERGENT_LLM_KEY,
                to_email=email,
                subject=subject,
                html_content=html_content
            )
            return result.get('success', False)
        except Exception as e:
            print(f"Password reset email error: {e}")
            return False
    
    @staticmethod
    async def send_password_reset_sms(phone: str, code: str, full_name: str) -> bool:
        try:
            message = f"Arkas Lojistik şifre sıfırlama kodunuz: {code}\n\n10 dakika geçerlidir."
            
            result = send_sms(
                api_key=EMERGENT_LLM_KEY,
                to_phone=phone,
                message=message
            )
            return result.get('success', False)
        except Exception as e:
            print(f"Password reset SMS error: {e}")
            return False