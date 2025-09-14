# 📁 Proje Dosyalarını Bilgisayarınıza Aktarma

## Yöntem 1: Dosyaları Manuel İndirme

### Tüm proje dosyalarını zip olarak indirmek için:

1. **Frontend dosyalarını paketleyin:**
```bash
cd /app
tar -czf arkas-lojistik-proje.tar.gz frontend/
```

2. **İndirme linki oluşturun** (platform özelliği kullanarak)

## Yöntem 2: Dosyaları GitHub'a Yükleme

### Proje dosyalarınızı GitHub'a yüklemek için:

1. GitHub'da yeni repository oluşturun
2. Proje dosyalarını repository'ye yükleyin
3. Kendi bilgisayarınızda `git clone` yapın

## Yöntem 3: Key Dosyaların Manuel Kopyalanması

### En önemli dosyalar:

#### package.json
```json
{
  "name": "arkas-lojistik",
  "version": "1.0.0",
  "description": "Arkas Lojistik - Nakliye Takip ve Yönetim Sistemi",
  "private": true,
  "dependencies": {
    "@capacitor/android": "^7.4.3",
    "@capacitor/cli": "^7.4.3",
    "@capacitor/core": "^7.4.3",
    "@capacitor/filesystem": "^7.1.4",
    "@capacitor/share": "^7.0.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.2",
    "html2pdf.js": "^0.10.1"
  },
  "scripts": {
    "start": "craco start",
    "build": "craco build",
    "test": "craco test",
    "eject": "react-scripts eject"
  }
}
```

#### capacitor.config.ts
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arkas.lojistik',
  appName: 'Arkas Lojistik',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1e3a8a",
      showSpinner: true,
      spinnerColor: "#ffffff"
    }
  }
};

export default config;
```

### Bu dosyaları kendi bilgisayarınızda oluşturduktan sonra:
1. `npm install` çalıştırın
2. APK oluşturma rehberini takip edin