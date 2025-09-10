import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Phone, Lock, Fingerprint } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export default function Login({ onLoginSuccess, onSwitchToRegister, onSwitchToForgotPassword }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  React.useEffect(() => {
    // Check if WebAuthn is supported
    if (window.PublicKeyCredential) {
      setBiometricSupported(true);
    }
  }, []);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/api/auth/login`, {
        identifier: data.identifier,
        password: data.password
      });

      const { access_token } = response.data;
      
      // Store token
      localStorage.setItem('arkas_token', access_token);
      
      // Get user info
      const userResponse = await axios.get(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      localStorage.setItem('arkas_user', JSON.stringify(userResponse.data));
      
      toast({
        title: "Giriş Başarılı!",
        description: "Arkas Lojistik sistemine hoş geldiniz"
      });
      
      onLoginSuccess(userResponse.data);
      
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Giriş Hatası",
        description: error.response?.data?.detail || "Giriş yapılırken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      if (!biometricSupported) {
        toast({
          title: "Desteklenmiyor",
          description: "Bu cihazda biyometrik doğrulama desteklenmiyor",
          variant: "destructive"
        });
        return;
      }

      // This would implement WebAuthn
      toast({
        title: "Geliştiriliyor",
        description: "Biyometrik giriş özelliği yakında aktif olacak",
      });
      
    } catch (error) {
      toast({
        title: "Biyometrik Hata",
        description: "Biyometrik doğrulama başarısız",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl border-0 dark:border-gray-700">
        <CardHeader className="text-center pb-6">
          <div className="mb-4">
            <img 
              src="/arkas-logo-new.jpg" 
              alt="Arkas Lojistik"
              className="h-16 w-auto mx-auto rounded-lg shadow-sm"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 dark:text-gray-100">
            <span className="text-slate-800 dark:text-gray-100">ARKAS</span>{' '}
            <span className="text-blue-600 dark:text-blue-400">LOJİSTİK</span>
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-gray-300">
            Nakliye Takip ve Yönetim Sistemi
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-gray-200">
                Şifre
              </label>
              <div className="relative">
                <Input
                  {...register("password", { 
                    required: "Şifre gerekli",
                    minLength: { value: 6, message: "Şifre en az 6 karakter olmalı" }
                  })}
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifrenizi girin"
                  className="pl-10 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
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
              {errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              disabled={loading}
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>

          {biometricSupported && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">veya</span>
              </div>
            </div>
          )}

          {biometricSupported && (
            <Button 
              type="button"
              variant="outline"
              onClick={handleBiometricLogin}
              className="w-full border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-950"
            >
              <Fingerprint className="mr-2 h-4 w-4" />
              Parmak İzi ile Giriş
            </Button>
          )}

          <div className="flex flex-col space-y-2 text-center text-sm">
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Şifremi Unuttum
            </button>
            
            <div className="text-gray-500 dark:text-gray-400">
              Hesabınız yok mu?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Kayıt Olun
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}