# Ebeveyn Takip Yazılımı (yaz-l-mtak-p)

Manuel APK + Railway bulut paneli ile çalışan ebeveyn takip sistemi.

## Yapı

- `backend/` — Node.js API (Express + Prisma + PostgreSQL)
- `web/` — Next.js panel (ebeveyn + admin)
- `android/` — Kotlin APK

## Railway kurulum

Detaylı adımlar: [docs/RAILWAY.md](docs/RAILWAY.md)

1. Railway'de GitHub reposunu bağla
2. PostgreSQL + backend + web servisleri kur
3. APK'yı telefona kur, panel Railway URL'sini gir

## APK

Android Studio → `android/` → Build APK

Kurulumda **panel adresi** = Railway web URL (örn. `https://web-xxx.up.railway.app`)

Gizli menü: tarayıcıda `takip://settings`
