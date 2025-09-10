import React, { useState, useEffect } from 'react';
import { Fingerprint, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useToast } from '../../hooks/use-toast';

// Base64 URL encode/decode utilities
const base64URLEncode = (buffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const base64URLDecode = (str) => {
  str = (str + '===').slice(0, str.length + (str.length % 4));
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
};

export default function BiometricAuth({ onRegister, onLogin, currentUser }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check WebAuthn support
    if (window.PublicKeyCredential) {
      setIsSupported(true);
      
      // Check if user has biometric credentials
      checkBiometricRegistration();
    }
  }, [currentUser]);

  const checkBiometricRegistration = () => {
    if (currentUser) {
      // Check localStorage for stored credential
      const credentialId = localStorage.getItem(`biometric_${currentUser.id}`);
      setIsRegistered(!!credentialId);
    }
  };

  const registerBiometric = async () => {
    if (!isSupported) {
      toast({
        title: "Desteklenmiyor",
        description: "Bu cihazda biyometrik doğrulama desteklenmiyor",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Generate challenge
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions = {
        challenge: challenge,
        rp: {
          name: "Arkas Lojistik",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(currentUser.id),
          name: currentUser.email || currentUser.phone,
          displayName: currentUser.full_name,
        },
        pubKeyCredParams: [
          {
            alg: -7, // ES256
            type: "public-key"
          },
          {
            alg: -257, // RS256
            type: "public-key"
          }
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Use built-in authenticators
          userVerification: "required"
        },
        timeout: 60000,
        attestation: "none"
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      if (credential) {
        // Store credential info
        const credentialId = base64URLEncode(credential.rawId);
        const publicKey = base64URLEncode(credential.response.getPublicKey());
        
        localStorage.setItem(`biometric_${currentUser.id}`, credentialId);
        localStorage.setItem(`biometric_key_${currentUser.id}`, publicKey);
        
        setIsRegistered(true);
        
        toast({
          title: "Parmak İzi Kaydedildi!",
          description: "Artık parmak izinizle giriş yapabilirsiniz"
        });

        if (onRegister) {
          onRegister({
            credentialId,
            publicKey,
            userId: currentUser.id
          });
        }
      }

    } catch (error) {
      console.error('Biometric registration error:', error);
      let errorMessage = "Parmak izi kaydı başarısız";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Parmak izi erişimi reddedildi";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Bu cihaz parmak izi desteklemiyor";
      } else if (error.name === 'SecurityError') {
        errorMessage = "Güvenlik hatası - HTTPS gerekli";
      }
      
      toast({
        title: "Kayıt Hatası",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loginWithBiometric = async () => {
    if (!isSupported || !isRegistered) {
      toast({
        title: "Kullanılamıyor",
        description: "Parmak izi henüz kaydedilmemiş",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Generate challenge
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Get stored credential ID
      const credentialId = localStorage.getItem(`biometric_${currentUser?.id || 'unknown'}`);
      if (!credentialId) {
        throw new Error('Credential ID not found');
      }

      const publicKeyCredentialRequestOptions = {
        challenge: challenge,
        allowCredentials: [{
          id: base64URLDecode(credentialId),
          type: 'public-key'
        }],
        userVerification: 'required',
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      if (assertion) {
        toast({
          title: "Giriş Başarılı!",
          description: "Parmak izi ile kimlik doğrulandı"
        });

        if (onLogin) {
          onLogin({
            credentialId: base64URLEncode(assertion.rawId),
            signature: base64URLEncode(assertion.response.signature),
            challenge: base64URLEncode(challenge)
          });
        }
      }

    } catch (error) {
      console.error('Biometric login error:', error);
      let errorMessage = "Parmak izi girişi başarısız";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Parmak izi erişimi reddedildi";
      } else if (error.name === 'InvalidStateError') {
        errorMessage = "Parmak izi bulunamadı";
      }
      
      toast({
        title: "Giriş Hatası",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeBiometric = () => {
    if (currentUser) {
      localStorage.removeItem(`biometric_${currentUser.id}`);
      localStorage.removeItem(`biometric_key_${currentUser.id}`);
      setIsRegistered(false);
      
      toast({
        title: "Parmak İzi Kaldırıldı",
        description: "Biyometrik doğrulama devre dışı bırakıldı"
      });
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
        <CardContent className="flex items-center gap-3 p-4">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Biyometrik Doğrulama Desteklenmiyor
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              Bu cihaz WebAuthn desteklemiyor
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
          <Fingerprint className="h-5 w-5" />
          Parmak İzi Doğrulama
        </CardTitle>
        <CardDescription className="text-purple-600 dark:text-purple-400">
          {isRegistered 
            ? "Parmak izinizle hızlı giriş yapabilirsiniz"
            : "Güvenli ve hızlı giriş için parmak izinizi kaydedin"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {isRegistered ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Parmak izi kayıtlı</span>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={loginWithBiometric}
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Fingerprint className="mr-2 h-4 w-4" />
                {loading ? 'Doğrulanıyor...' : 'Parmak İzi ile Giriş'}
              </Button>
              
              <Button
                onClick={removeBiometric}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400"
              >
                Kaldır
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={registerBiometric}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Shield className="mr-2 h-4 w-4" />
            {loading ? 'Kaydediliyor...' : 'Parmak İzi Kaydet'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}