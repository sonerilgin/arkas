import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { useToast } from '../hooks/use-toast';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Sayfa yüklendiğinde hatırlanan parolayı kontrol et
  useEffect(() => {
    const savedCredentials = localStorage.getItem('arkas_login_credentials');
    if (savedCredentials) {
      const { username: savedUsername, password: savedPassword } = JSON.parse(savedCredentials);
      setUsername(savedUsername || '');
      setPassword(savedPassword || '');
      setRememberPassword(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Basit doğrulama - sabit değerler
    if (username === 'Arkas' && password === '1234') {
      // Parolayı hatırla seçiliyse kaydet
      if (rememberPassword) {
        localStorage.setItem('arkas_login_credentials', JSON.stringify({
          username,
          password
        }));
      } else {
        localStorage.removeItem('arkas_login_credentials');
      }

      toast({
        title: "Giriş Başarılı",
        description: "Arkas Lojistik sistemine hoş geldiniz"
      });

      setTimeout(() => {
        onLogin();
      }, 1000);
    } else {
      toast({
        title: "Giriş Hatası",
        description: "Kullanıcı adı veya parola hatalı",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <img 
              src="/arkas-logo-new.jpg" 
              alt="Arkas Lojistik Logo" 
              className="h-20 w-20 object-contain rounded-xl shadow-lg"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 dark:text-gray-100">
            <span className="text-slate-800 dark:text-gray-100">ARKAS</span>{' '}
            <span className="text-blue-500 dark:text-blue-400">LOJİSTİK</span>
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-gray-300">
            Nakliye Takip ve Yönetim Sistemi
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Kullanıcı Adı
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Kullanıcı adınızı girin"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Parola
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Parolanızı girin"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberPassword}
                onCheckedChange={setRememberPassword}
              />
              <Label htmlFor="remember" className="text-sm text-slate-600 dark:text-gray-300">
                Parolayı hatırla
              </Label>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
              disabled={loading}
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-slate-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-slate-600 dark:text-gray-300 text-center">
              <strong>Test Bilgileri:</strong><br />
              Kullanıcı Adı: Arkas<br />
              Parola: 1234
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginScreen;