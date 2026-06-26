# Railway Kurulum Rehberi

Repo: https://github.com/yamannerhan/yaz-l-mtak-p

## Genel yapı (3 servis)

```
GitHub Repo
    ├── PostgreSQL  (Railway Database)
    ├── backend/    (API sunucusu)
    └── web/        (Panel)
```

APK telefonda → panel adresini okur → API'ye bağlanır. **Localhost yok.**

---

## ADIM 1 — GitHub'a push (PC'de bir kez)

```cmd
cd C:\Users\ALPARSLAN\Desktop\TAKIP YAZILIMI
git init
git add .
git commit -m "Ebeveyn takip sistemi"
git branch -M main
git remote add origin https://github.com/yamannerhan/yaz-l-mtak-p.git
git push -u origin main
```

Token istenirse GitHub Personal Access Token kullan (repo yetkisi).

---

## ADIM 2 — Railway hesabı

1. https://railway.app → GitHub ile giriş
2. **New Project** → **Deploy from GitHub repo**
3. `yamannerhan/yaz-l-mtak-p` reposunu seç

---

## ADIM 3 — PostgreSQL ekle

1. Proje içinde **+ New** → **Database** → **PostgreSQL**
2. PostgreSQL servisine tıkla → **Variables** → `DATABASE_URL` değerini kopyala

---

## ADIM 4 — Backend servisi

1. **+ New** → **GitHub Repo** → aynı repo
2. Servis ayarları → **Settings**:
   - **Root Directory:** `backend`
   - **Watch Paths:** `backend/**`

3. **Variables** (ortam değişkenleri):

| Değişken | Değer |
|----------|-------|
| `DATABASE_URL` | PostgreSQL'den **Reference** ile bağla (${{Postgres.DATABASE_URL}}) |
| `JWT_SECRET` | Uzun rastgele şifre (örn. `TakipJwt2024SecretKey!`) |
| `ADMIN_EMAIL` | Senin admin e-postan |
| `ADMIN_PASSWORD` | Güçlü admin şifresi |
| `CORS_ORIGIN` | Web panel URL (adım 5'ten sonra doldur) |
| `PUBLIC_API_URL` | Backend public URL (adım 4b'den) |
| `PORT` | `3001` |
| `NODE_ENV` | `production` |

4. **Settings** → **Networking** → **Generate Domain**
   - Örnek: `https://backend-production-xxxx.up.railway.app`
   - Bunu `PUBLIC_API_URL` olarak Variables'a yaz

5. Deploy bitince: `https://BACKEND-URL/health` → `{"status":"ok"}`

---

## ADIM 5 — Web panel servisi

1. **+ New** → **GitHub Repo** → aynı repo
2. **Settings**:
   - **Root Directory:** `web`
   - **Watch Paths:** `web/**`

3. **Variables**:

| Değişken | Değer |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Backend URL (adım 4'teki) |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |

4. **Networking** → **Generate Domain**
   - Örnek: `https://web-production-xxxx.up.railway.app`

5. Backend'e dön → `CORS_ORIGIN` = web panel URL'sini yaz → **Redeploy**

---

## ADIM 6 — Test

1. Tarayıcıda web panel URL aç
2. Giriş: `ADMIN_EMAIL` / `ADMIN_PASSWORD`
3. `https://WEB-URL/config.json` aç → şunu görmeli:
   ```json
   {"apiBaseUrl":"https://backend-xxxx.up.railway.app","version":1}
   ```

---

## ADIM 7 — APK kurulumu (telefonda)

1. Android Studio → Build APK
2. Telefona kur
3. Kurulumda:
   - **Panel adresi:** `https://web-production-xxxx.up.railway.app`
   - **E-posta / şifre:** paneldeki hesap

---

## Özet tablo

| Ne | Nerede |
|----|--------|
| Kod | GitHub: yamannerhan/yaz-l-mtak-p |
| Veritabanı | Railway PostgreSQL |
| API | Railway backend servisi |
| Panel | Railway web servisi |
| APK | Telefona elle kurulur |

---

## Sorun giderme

| Sorun | Çözüm |
|-------|-------|
| Backend deploy hatası | Logs → `prisma migrate` hatası → DATABASE_URL kontrol |
| Panel açılmıyor | NEXT_PUBLIC_API_URL doğru mu |
| APK bağlanmıyor | Panel URL https ile, sonunda / yok |
| CORS hatası | CORS_ORIGIN = web panel URL |
