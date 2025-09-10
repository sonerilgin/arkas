import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Mail, Phone, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export default function Verification({ identifier, type, onBackToLogin, onVerificationSuccess }) {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      await axios.post(`${API}/api/auth/verify`, {
        identifier: identifier,
        code: data.code
      });
      
      toast({
        title: "Doğrulama Başarılı!",
        description: "Hesabınız aktif edildi. Giriş yapabilirsiniz."
      });
      
      onVerificationSuccess();
      
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "Doğrulama Hatası",
        description: error.response?.data?.detail || "Doğrulama kodu geçersiz",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setResendLoading(true);
      
      await axios.post(`${API}/api/auth/resend-verification?identifier=${encodeURIComponent(identifier)}`);
      
      toast({
        title: "Kod Gönderildi",
        description: "Yeni doğrulama kodu gönderildi"
      });
      
      setCountdown(60); // 60 second countdown
      
    } catch (error) {
      console.error('Resend error:', error);
      toast({
        title: "Gönderme Hatası",
        description: error.response?.data?.detail || "Kod gönderilemedi",
        variant: "destructive"
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl border-0 dark:border-gray-700">
        <CardHeader className="text-center pb-6">
          <Button
            variant="ghost"
            onClick={onBackToLogin}
            className="absolute left-4 top-4 p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              {type === 'email' ? (
                <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              ) : (
                <Phone className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 dark:text-gray-100">
            Doğrulama Kodu
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-gray-300">
            {type === 'email' 
              ? `${identifier} adresine gönderilen kodu girin`
              : `${identifier} numarasına gönderilen kodu girin`
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-gray-200">
                Doğrulama Kodu
              </label>
              <Input
                {...register("code", { 
                  required: "Doğrulama kodu gerekli",
                  pattern: {
                    value: /^[0-9]{6}$/,
                    message: "6 haneli kod girin"
                  }
                })}
                placeholder="123456"
                className="text-center text-2xl tracking-widest font-mono dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                maxLength={6}
              />
              {errors.code && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.code.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              disabled={loading}
            >
              {loading ? 'Doğrulanıyor...' : 'Doğrula'}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Kod gelmedi mi?
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleResendCode}
              disabled={resendLoading || countdown > 0}
              className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${resendLoading ? 'animate-spin' : ''}`} />
              {countdown > 0 
                ? `Tekrar gönder (${countdown}s)` 
                : resendLoading 
                  ? 'Gönderiliyor...' 
                  : 'Tekrar Gönder'
              }
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Farklı {type === 'email' ? 'email' : 'telefon'} kullanmak ister misiniz?{' '}
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Geri Dön
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}