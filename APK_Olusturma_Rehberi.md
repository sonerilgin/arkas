# 📱 Arkas Lojistik Android APK Oluşturma Rehberi

## 🛠️ Gerekli Yazılımlar (Sırayla Kurun)

### 1. Node.js Kurulumu
- **İndir**: https://nodejs.org/en/download/
- **Versiyon**: Node.js 18+ (LTS önerilir)
- **Kontrol**: Terminal'de `node --version` çalıştırın

### 2. Android Studio Kurulumu
- **İndir**: https://developer.android.com/studio
- **Kurulum**: Tam kurulum yapın (SDK'lar dahil)
- **SDK Manager**: Android SDK Platform 33+ kurduğunuzdan emin olun
- **Build Tools**: 33.0.0+ versiyonu kurun

### 3. Java Development Kit (JDK)
- **Versiyon**: JDK 17 (Android Studio ile birlikte gelir)
- **Kontrol**: Terminal'de `java --version` çalıştırın

## 🔧 Environment Variables (Ortam Değişkenleri)

### Windows için:
```
ANDROID_HOME = C:\Users\[KullanıcıAdınız]\AppData\Local\Android\Sdk
JAVA_HOME = C:\Program Files\Android\Android Studio\jbr
Path'e ekleyin: %ANDROID_HOME%\platform-tools
Path'e ekleyin: %ANDROID_HOME%\tools
Path'e ekleyin: %JAVA_HOME%\bin
```

### Mac için:
```bash
# ~/.zshrc veya ~/.bash_profile dosyasına ekleyin:
export ANDROID_HOME=$HOME/Library/Android/sdk
export JAVA_HOME=/Applications/Android\ Studio.app/Contents/jbr/Contents/Home
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$JAVA_HOME/bin
```

### Linux için:
```bash
# ~/.bashrc dosyasına ekleyin:
export ANDROID_HOME=$HOME/Android/Sdk
export JAVA_HOME=/opt/android-studio/jbr
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$JAVA_HOME/bin
```

## 📁 Proje Dosyalarını İndirin

### Yöntem 1: Dosyaları Manuel İndir
1. Mevcut projeyi zip olarak indirin
2. Bilgisayarınızda açın
3. Terminal/Command Prompt'ta proje klasörüne gidin

### Yöntem 2: Git Clone (Eğer GitHub'da varsa)
```bash
git clone [repository-url]
cd arkas-lojistik
```

## 🚀 APK Oluşturma Adımları

### 1. Bağımlılıkları Kurun
```bash
# Frontend klasöründe
cd frontend
npm install
# veya
yarn install
```

### 2. Production Build Yapın
```bash
npm run build
# veya 
yarn build
```

### 3. Capacitor Kurulumu
```bash
# Eğer kurulu değilse
npm install -g @capacitor/cli

# Capacitor başlat
npx cap init "Arkas Lojistik" "com.arkas.lojistik" --web-dir=build
```

### 4. Android Platform Ekleyin
```bash
npx cap add android
```

### 5. Dosyaları Sync Edin
```bash
npx cap sync android
```

### 6. APK Oluşturun

#### Yöntem A: Android Studio ile (Önerilen)
```bash
npx cap open android
```
- Android Studio açılacak
- Menü: Build → Build Bundle(s) / APK(s) → Build APK(s)
- APK dosyası: `android/app/build/outputs/apk/debug/` klasöründe

#### Yöntem B: Command Line ile
```bash
cd android
./gradlew assembleDebug

# Windows için:
gradlew.bat assembleDebug
```

## 📱 APK Kurulumu

### Android Cihazda:
1. **Ayarlar** → **Güvenlik** → **Bilinmeyen Kaynaklardan Kuruluma İzin Ver**
2. APK dosyasını cihaza kopyalayın
3. Dosya yöneticisinden APK'ya tıklayın
4. **Kur** butonuna basın

## 🔍 Sorun Giderme

### Yaygın Hatalar:

#### "SDK location not found"
```bash
# android/local.properties dosyası oluşturun:
sdk.dir=C:\\Users\\[KullanıcıAdınız]\\AppData\\Local\\Android\\Sdk
# Mac/Linux için:
sdk.dir=/Users/[kullanıcıadı]/Library/Android/sdk
```

#### "JAVA_HOME is not set"
- Environment variables'ı kontrol edin
- Terminal'i yeniden başlatın

#### "Gradle build failed"
```bash
# Android klasöründe:
./gradlew clean
./gradlew assembleDebug
```

#### Capacitor Hataları
```bash
# Tüm dosyaları yeniden sync et:
npx cap sync android --force
```

## 📋 Kontrol Listesi

- [ ] Node.js kurulu (18+)
- [ ] Android Studio kurulu
- [ ] SDK Platform 33+ kurulu  
- [ ] Build Tools 33+ kurulu
- [ ] Environment variables ayarlandı
- [ ] Terminal yeniden başlatıldı
- [ ] Proje dosyaları indirildi
- [ ] `npm install` çalıştırıldı
- [ ] `npm run build` başarılı
- [ ] `npx cap add android` çalıştırıldı
- [ ] `npx cap sync android` çalıştırıldı
- [ ] APK build başarılı

## 🎯 Sonuç

APK dosyası şu konumda olacak:
```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

Bu dosya artık Android cihazınıza kuruluma hazır!

## 📞 Destek

Herhangi bir adımda takılırsanız:
1. Hata mesajını tam olarak kopyalayın
2. Hangi adımda takıldığınızı belirtin
3. İşletim sisteminizi bildirin (Windows/Mac/Linux)

Bu bilgilerle size daha detaylı yardım edebilirim.