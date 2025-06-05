AI Asistan Kurulum ve Kullanım Kılavuzu
=====================================

Bu paket, AI Asistan uygulamasını çalıştırmak için gerekli tüm dosyaları içermektedir.

İçindekiler:
-----------
1. AI_Asistan.exe - Ana uygulama dosyası
2. .env - Yapılandırma dosyası (API anahtarı içerir)
3. data/ - Veri dosyaları klasörü
   - rules.json - AI kuralları
   - products.json - Ürün bilgileri
   - training.json - AI eğitim verileri

Kurulum Adımları:
---------------
1. Tüm dosyaları aynı klasöre çıkartın
2. .env dosyasını bir metin editörü ile açın
3. OPENAI_API_KEY= satırına kendi OpenAI API anahtarınızı yazın
   Örnek: OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
4. Dosyayı kaydedin

Uygulamayı Çalıştırma:
--------------------
1. AI_Asistan.exe dosyasına çift tıklayın
2. Tarayıcınızda http://localhost:5000 adresine gidin
3. Uygulama kullanıma hazır!

Önemli Notlar:
------------
- Uygulama çalışırken bilgisayarınızın 5000 portunu kullanır
- Windows Güvenlik Duvarı bir uyarı gösterirse "Erişime İzin Ver" seçeneğini seçin
- Uygulamayı kapatmak için komut penceresini kapatın
- data/ klasöründeki dosyalar uygulamanın çalışması için gereklidir, silmeyin!
- Admin panelinden yapılan değişiklikler data/ klasöründeki dosyalara kaydedilir

Veri Dosyaları:
-------------
- rules.json: AI'nin davranış kurallarını içerir
- products.json: Ürün bilgilerini içerir
- training.json: AI'nin eğitim verilerini içerir

Bu dosyaları düzenlemek için:
1. Admin paneline giriş yapın
2. İlgili bölümden değişiklikleri yapın
3. Değişiklikler otomatik olarak kaydedilir

Sorun Giderme:
------------
1. "Port 5000 zaten kullanımda" hatası alırsanız:
   - Bilgisayarınızı yeniden başlatın
   - Veya başka bir uygulamanın 5000 portunu kullanmadığından emin olun

2. "API anahtarı bulunamadı" hatası alırsanız:
   - .env dosyasının doğru konumda olduğunu kontrol edin
   - API anahtarının doğru formatta yazıldığından emin olun

3. Uygulama açılmazsa:
   - Antivirüs programınızın uygulamayı engellemediğinden emin olun
   - Windows Defender'ı geçici olarak devre dışı bırakın

4. Veri dosyaları ile ilgili sorun yaşarsanız:
   - data/ klasörünün exe ile aynı dizinde olduğunu kontrol edin
   - Dosyaların okuma/yazma izinlerinin olduğundan emin olun

İletişim:
-------
Herhangi bir sorun yaşarsanız veya yardıma ihtiyacınız olursa lütfen iletişime geçin. 