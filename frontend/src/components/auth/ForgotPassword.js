import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export default function ForgotPassword({ onBackToLogin }) {
  const [step, setStep] = useState(1); // 1: Enter identifier, 2: Enter code and new password
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm();
  const password = watch('new_password');

  const onSubmitIdentifier = async (data) => {
    try {
      setLoading(true);
      
      await axios.post(`${API}/api/auth/forgot-password`, {
        identifier: data.identifier
      });
      
      setIdentifier(data.identifier);
      setStep(2);
      
      toast({
        title: "Kod Gönderildi",
        description: "Şifre sıfırlama kodu gönderildi"
      });
      
    } catch (error) {
      console.error('Forgot password error:', error);
      toast({
        title: "Hata",
        description: error.response?.data?.detail || "Kod gönderilemedi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitReset = async (data) => {
    try {
      setLoading(true);
      
      if (data.new_password !== data.confirm_password) {
        toast({
          title: "Hata",
          description: "Şifreler eşleşmiyor",
          variant: "destructive"
        });
        return;
      }

      await axios.post(`${API}/api/auth/reset-password`, {
        identifier: identifier,
        code: data.code,
        new_password: data.new_password
      });
      
      toast({
        title: "Şifre Sıfırlandı!",
        description: "Şifreniz başarıyla değiştirildi. Giriş yapabilirsiniz."
      });
      
      onBackToLogin();
      
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: "Sıfırlama Hatası",
        description: error.response?.data?.detail || "Şifre sıfırlanamadı",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      reset();
    } else {
      onBackToLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl border-0 dark:border-gray-700">
        <CardHeader className="text-center pb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="absolute left-4 top-4 p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 dark:text-gray-100">
            {step === 1 ? 'Şifremi Unuttum' : 'Şifre Sıfırla'}
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-gray-300">
            {step === 1 
              ? 'Email veya telefon numaranızı girin'
              : 'Gönderilen kod ile yeni şifrenizi belirleyin'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === 1 ? (
            <form onSubmit={handleSubmit(onSubmitIdentifier)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-gray-200">
                  Email veya Telefon
                </label>
                <div className="relative">
                  <Input
                    {...register("identifier", { 
                      required: "Email veya telefon numarası gerekli" 
                    })}
                    placeholder="email@example.com veya +905xxxxxxxxx"
                    className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                {errors.identifier && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.identifier.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                disabled={loading}
              >
                {loading ? 'Kod gönderiliyor...' : 'Sıfırlama Kodu Gönder'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onSubmitReset)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-gray-200">
                  Sıfırlama Kodu
                </label>
                <Input
                  {...register("code", { 
                    required: "Sıfırlama kodu gerekli",
                    pattern: {
                      value: /^[0-9]{6}$/,
                      message: "6 haneli kod girin"
                    }
                  })}
                  placeholder="123456"
                  className="text-center text-xl tracking-widest font-mono dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                  maxLength={6}
                />
                {errors.code && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-gray-200">
                  Yeni Şifre
                </label>
                <div className="relative">
                  <Input
                    {...register("new_password", { 
                      required: "Yeni şifre gerekli",
                      minLength: { value: 6, message: "Şifre en az 6 karakter olmalı" }
                    })}
                    type={showPassword ? "text" : "password"}
                    placeholder="Yeni şifrenizi girin"
                    className="pl-10 pr-10 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.new_password && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.new_password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-gray-200">
                  Şifre Tekrar
                </label>
                <div className="relative">
                  <Input
                    {...register("confirm_password", { 
                      required: "Şifre tekrarı gerekli",
                      validate: value => value === password || "Şifreler eşleşmiyor"
                    })}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Yeni şifrenizi tekrar girin"
                    className="pl-10 pr-10 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.confirm_password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                disabled={loading}
              >
                {loading ? 'Şifre sıfırlanıyor...' : 'Şifreyi Sıfırla'}
              </Button>
            </form>
          )}

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Giriş sayfasına dönmek ister misiniz?{' '}
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Giriş Yap
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}