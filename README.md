# WA Bot Istimewa (whatsapp-web.js)

Bot WhatsApp **ringan & anti rewel** dengan:
- ✅ Pairing Code (login via nomor telepon) + fallback QR
- ✅ Menu **Buttons** *(fallback ke teks jika dibatasi WhatsApp)*
- ✅ Auto-Sticker (gambar ➜ sticker)
- ✅ Aman untuk panel (Pterodactyl), VPS, atau lokal

> ⚠️ **Peringatan**: Ini _bukan_ akses ilegal. Bot berjalan di perangkat Anda sendiri melalui WhatsApp Web (Puppeteer). Patuhi Ketentuan Layanan WhatsApp dan hindari spam.

---

## Persiapan (Bahan yang diperlukan)

- **Node.js 18+** (disarankan 18.17 atau lebih baru)
- **Akun WhatsApp** yang akan ditautkan
- **RAM** minimal 512MB (Puppeteer/Chromium butuh memori)
- (Opsional) **Pterodactyl Panel** NodeJS Egg
- (Opsional) **GitHub** untuk menyimpan source code

---

## Instalasi

```bash
# 1) Clone / upload folder ini
# 2) Install dependencies
npm ci

# (atau) jika "ci" tidak tersedia
npm install
```

Jika deploy di server headless/panel, pastikan Chromium dapat jalan. Script sudah memakai flag `--no-sandbox` dan `--disable-setuid-sandbox`.

---

## Konfigurasi

Salin `.env.example` ➜ `.env` lalu isi sesuai kebutuhan.

```ini
# .env
PAIR_MODE=false
PAIR_PHONE=6281234567890
SESSION_PATH=.wwebjs_auth
# CHROME_PATH=/usr/bin/chromium-browser    # isi jika butuh paksa path chrome
```

- **PAIR_MODE**: `true` untuk login via **pairing code** (masukkan nomor telepon internasional di `PAIR_PHONE`). Jika `false`, login via **QR**.
- **PAIR_PHONE**: Nomor telepon internasional tanpa simbol (contoh `62812xxxx`).
- **SESSION_PATH**: Folder penyimpanan sesi agar tetap login saat restart.
- **CHROME_PATH**: Opsional, paksa path chromium jika perlu.

> Tips: Anda juga bisa memaksa pairing saat start dengan `npm run pair`.

---

## Menjalankan (Lokal / VPS)

```bash
# Mode QR (default)
npm start

# Mode Pairing Code (kode akan tampil di console)
npm run pair
# atau
PAIR_MODE=true PAIR_PHONE=6281234567890 npm start
```

Di HP: **WhatsApp > Perangkat tertaut > Tautkan dengan nomor telepon** ➜ masukkan **Pairing Code** yang muncul di console.

---

## Pterodactyl Panel (auto install & auto start)

- **Egg**: Node.js 18+
- **Install script**:
  ```bash
  npm ci --omit=dev || npm install --omit=dev
  ```
- **Startup Command** (pilih salah satu):
  - QR default:
    ```bash
    npm start
    ```
  - Pairing code (otomatis minta kode):
    ```bash
    export PAIR_MODE=true && export PAIR_PHONE=6281234567890 && npm start
    ```
- **Auto Start**: aktifkan _Auto Restart on Crash_ di panel.
- **Persistent Data**: pastikan direktori bekerja **menyimpan** folder `.wwebjs_auth` agar tidak logout saat restart.

> Chromium kadang gagal launch di container tanpa sandbox. Script ini sudah menambah flags `--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage`.

---

## Fitur & Perintah

### Menu Buttons
- Kirim `menu` untuk memunculkan tombol.
- Jika tombol tidak muncul (dibatasi WhatsApp), bot akan mengirim **fallback teks** dengan daftar perintah.

### Auto Sticker
- Kirim **gambar** dengan caption `sticker` ➜ bot akan membalas dengan **stiker**.
- Saat ini hanya gambar (bukan video) untuk meminimalkan dependensi & error.

### Lainnya
- `ping` ➜ cek status bot
- `tentang` ➜ info singkat bot

---

## Struktur Proyek

```
.
├── index.js
├── package.json
├── .env.example
├── .gitignore
└── scripts/
    └── healthcheck.js
```

---

## FAQ

**Q: Tombol tidak muncul atau tidak bisa diklik.**  
A: WhatsApp **membatasi** fitur interaktif (Buttons/Lists) untuk sebagian akun/klien. Bot akan otomatis kirim **fallback teks**. (Jika Anda butuh 100% andal, gunakan *official WhatsApp Cloud API* untuk tombol.)

**Q: Puppeteer gagal launch di server.**  
A: Tambahkan env `CHROME_PATH` ke path Chromium, dan pastikan flags `--no-sandbox` aktif. Beberapa host perlu paket Chrome/Chromium terpasang.

**Q: Bagaimana agar tetap login setelah restart panel?**  
A: Pastikan folder `.wwebjs_auth` tersimpan di volume/persistent storage panel.

---

## Legal & Etika
Gunakan hanya untuk otomatisasi **akun Anda sendiri** dan sesuai aturan WhatsApp. Hindari spam & penyalahgunaan.

Selamat berkarya! 🚀
