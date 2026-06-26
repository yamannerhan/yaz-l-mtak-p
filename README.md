# Ebeveyn Takip Yazılımı

Manuel APK kurulumu ile çalışan ebeveyn takip sistemi.

## Yapı

- `backend/` — Node.js REST API (Express + Prisma + PostgreSQL)
- `web/` — Next.js web paneli (ebeveyn + admin)
- `android/` — Kotlin Android uygulaması

## Hızlı başlangıç

### Backend (yerel)

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

### Web panel

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

### Railway dağıtımı

Detaylı adımlar: [docs/RAILWAY.md](docs/RAILWAY.md)

1. GitHub reposunu Railway'e bağlayın
2. PostgreSQL eklentisi ekleyin
3. `backend` servisi (root: `backend`)
4. `web` servisi (root: `web`)
5. Ortam değişkenlerini ayarlayın
6. Android APK'da `API_BASE_URL`'i Railway backend URL'inize güncelleyin

### Android APK

Android Studio ile `android/` klasörünü açın. Release APK:

```bash
cd android
./gradlew assembleRelease
```

APK: `android/app/build/outputs/apk/release/`

**Gizli menü:** Numara çeviricide `*#*#5555555555#*#*`

## Roller

| Rol | Erişim |
|-----|--------|
| parent | Kendi cihazları |
| admin | Tüm sistem |

Varsayılan admin: `ADMIN_EMAIL` / `ADMIN_PASSWORD` ortam değişkenlerinden oluşturulur.
