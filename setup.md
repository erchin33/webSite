# Proje Kurulum Rehberi

## Gereksinimler
- Python 3.8 veya üzeri
- Node.js 14 veya üzeri
- OpenAI API anahtarı

## Kurulum Adımları

1. **Python Sanal Ortamı Oluşturma ve Aktifleştirme**
   ```bash
   # Sanal ortam oluştur
   python -m venv venv
   
   # Windows'ta aktifleştir
   venv\Scripts\activate
   
   # Linux/Mac'te aktifleştir
   source venv/bin/activate
   ```

2. **Python Bağımlılıklarını Yükleme**
   ```bash
   pip install -r requirements.txt
   ```

3. **Frontend Kurulumu**
   ```bash
   # Client klasörüne git
   cd client
   
   # Node.js bağımlılıklarını yükle
   npm install
   
   # React uygulamasını build et
   npm run build
   
   # Ana dizine geri dön
   cd ..
   ```

4. **Çevre Değişkenlerini Ayarlama**
   - Proje ana dizininde `.env` dosyası oluşturun
   - İçine şu satırı ekleyin:
     ```
     OPENAI_API_KEY=your_api_key_here
     ```

5. **Veri Dosyalarını Kontrol Etme**
   - `data/` klasörünün içeriğini kontrol edin
   - Gerekli veri dosyalarının mevcut olduğundan emin olun

## Uygulamayı Çalıştırma
```bash
python app.py
```

## Sorun Giderme

1. **ModuleNotFoundError hatası alırsanız:**
   - Sanal ortamın aktif olduğundan emin olun
   - `pip install -r requirements.txt` komutunu tekrar çalıştırın

2. **Frontend build hatası alırsanız:**
   - Node.js sürümünüzün güncel olduğundan emin olun
   - `client` klasöründe `npm install` komutunu tekrar çalıştırın

3. **API hatası alırsanız:**
   - `.env` dosyasının doğru konumda olduğunu kontrol edin
   - OpenAI API anahtarınızın doğru olduğundan emin olun 