import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Phone, Lock, User, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export default function Register({ onBackToLogin, onRegistrationSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationType, setRegistrationType] = useState('email'); // 'email' or 'phone'
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      if (data.password !== data.confirmPassword) {
        toast({
          title: "Hata",
          description: "Şifreler eşleşmiyor",
          variant: "destructive"
        });
        setLoading(false); // Add this line
        return;
      }

      const registerData = {
        full_name: data.full_name,
        password: data.password
      };

      if (registrationType === 'email') {
        registerData.email = data.identifier;
      } else {
        registerData.phone = data.identifier;
      }

      console.log('Sending registration data:', registerData); // Debug log

      const response = await axios.post(`${API}/api/auth/register`, registerData);
      
      console.log('Registration response:', response); // Debug log
      
      toast({
        title: "Kayıt Başarılı!",
        description: "Hesabınız oluşturuldu. Giriş yapabilirsiniz."
      });
      
      // No verification needed - go back to login
      onBackToLogin();
      
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Kayıt Hatası",
        description: error.response?.data?.detail || "Kayıt olurken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
            <img 
              src="/arkas-logo-new.jpg" 
              alt="Arkas Lojistik"
              className="h-16 w-auto mx-auto rounded-lg shadow-sm"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 dark:text-gray-100">
            Hesap Oluştur
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-gray-300">
            Arkas Lojistik sistemine katılın
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
            <button
              type="button"
              onClick={() => setRegistrationType('email')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                registrationType === 'email'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              }`}
            >
              <Mail className="h-4 w-4 inline mr-2" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setRegistrationType('phone')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                registrationType === 'phone'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              }`}
            >
              <Phone className="h-4 w-4 inline mr-2" />
              Telefon
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-gray-200">
                Ad Soyad
              </label>
              <div className="relative">
                <Input
                  {...register("full_name", { 
                    required: "Ad soyad gerekli",
                    minLength: { value: 2, message: "Ad soyad en az 2 karakter olmalı" }
                  })}
                  placeholder="Adınız ve soyadınız"
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              {errors.full_name && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-gray-200">
                {registrationType === 'email' ? 'Email Adresi' : 'Telefon Numarası'}
              </label>
              <div className="relative">
                <Input
                  {...register("identifier", { 
                    required: `${registrationType === 'email' ? 'Email' : 'Telefon'} gerekli`,
                    pattern: registrationType === 'email' 
                      ? {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Geçerli bir email adresi girin"
                        }
                      : {
                          value: /^(\+90|0)?5[0-9]{9}$/,
                          message: "Geçerli bir telefon numarası girin (05xxxxxxxxx)"
                        }
                  })}
                  placeholder={registrationType === 'email' ? 'email@example.com' : '+905xxxxxxxxx'}
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {registrationType === 'email' ? (
                    <Mail className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Phone className="h-4 w-4 text-gray-400" />
                  )}
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-gray-200">
                Şifre Tekrar
              </label>
              <div className="relative">
                <Input
                  {...register("confirmPassword", { 
                    required: "Şifre tekrarı gerekli",
                    validate: value => value === password || "Şifreler eşleşmiyor"
                  })}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Şifrenizi tekrar girin"
                  className="pl-10 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
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
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              disabled={loading}
            >
              {loading ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur'}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Zaten hesabınız var mı?{' '}
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Giriş Yapın
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}