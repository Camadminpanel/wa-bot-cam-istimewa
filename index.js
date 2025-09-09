/**
 * WA Bot Istimewa
 * - Pairing code (phone number) & QR fallback
 * - Buttons menu (dengan fallback teks jika diblok)
 * - Auto-sticker (gambar -> sticker)
 * - Aman untuk panel (Pterodactyl) & server headless (no-sandbox flags)
 *
 * Ingat: Gunakan sesuai kebijakan WhatsApp. Ini bukan akses ilegal / bypass API.
 */
require('dotenv').config();
const { Client, LocalAuth, Buttons, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// -------- Konfigurasi dari ENV / CLI --------
const args = process.argv.slice(2);
const PAIR_MODE = args.includes('--pair') || process.env.PAIR_MODE === 'true';
const PAIR_PHONE = (process.env.PAIR_PHONE || '').replace(/[^\d]/g, ''); // e.g. 6281234567890
const SESSION_PATH = process.env.SESSION_PATH || './.wwebjs_auth';
const CHROME_PATH = process.env.CHROME_PATH || undefined;

// -------- Inisialisasi Client --------
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: SESSION_PATH
  }),
  puppeteer: {
    headless: true,
    // Flag penting untuk panel/docker/VPS tanpa GUI
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    executablePath: CHROME_PATH
  }
});

// -------- Helper --------
function info(...a){ console.log('[INFO]', ...a); }
function warn(...a){ console.warn('[WARN]', ...a); }
function err(...a){ console.error('[ERROR]', ...a); }
function formatPairing(code){
  // tampilkan sebagai AAAA-BBBB (lebih mudah diketik di hp)
  return (code || '').match(/.{1,4}/g)?.join('-') || code;
}

// -------- Events penting --------
let pairingRequested = false;

client.on('qr', async (qr) => {
  // Jika user ingin pairing code, minta code begitu session siap menghasilkan QR
  if (PAIR_MODE && PAIR_PHONE && !pairingRequested) {
    pairingRequested = true;
    try {
      const code = await client.requestPairingCode(PAIR_PHONE);
      info('PAIRING CODE:', formatPairing(code), '(buka WhatsApp > Perangkat tertaut > Tautkan dengan nomor telepon)');
    } catch (e) {
      err('Gagal mengambil pairing code, fallback ke QR. Details:', e?.message || e);
      qrcode.generate(qr, { small: true });
    }
  } else {
    // QR fallback
    info('Scan QR berikut (WhatsApp > Perangkat tertaut):');
    qrcode.generate(qr, { small: true });
  }
});

client.on('ready', () => info('Client READY. Bot aktif.'));
client.on('authenticated', () => info('Authenticated.'));
client.on('auth_failure', (m) => err('Auth failure:', m));
client.on('change_state', (s) => info('State:', s));
client.on('disconnected', (reason) => {
  warn('Terputus:', reason, '-> reinitialize dalam 3s');
  setTimeout(() => client.initialize(), 3000);
});

// -------- Menu Buttons (dengan fallback) --------
const BUTTONS_SUPPORTED_HINT = 'Catatan: Di beberapa akun/klien, tombol bisa dibatasi oleh WhatsApp.\nKalau tidak muncul, balas dengan kata kunci:\nmenu | ping | sticker | tentang';

async function sendMenu(chatId) {
  try {
    const buttons = new Buttons(
      'Pilih fitur:',
      [
        { id: 'BTN_STICKER', body: 'Sticker' },
        { id: 'BTN_PING', body: 'Ping' },
        { id: 'BTN_TENTANG', body: 'Tentang' },
      ],
      '🤖 Bot Istimewa',
      'Tips: kirim gambar + caption "sticker" untuk ubah jadi stiker.'
    );
    await client.sendMessage(chatId, buttons);
    await client.sendMessage(chatId, BUTTONS_SUPPORTED_HINT);
  } catch (e) {
    // Fallback ke teks bila buttons diblok
    warn('Buttons mungkin diblok. Fallback ke teks. Details:', e?.message || e);
    const txt = [
      '🤖 *Bot Istimewa*',
      'Perintah:',
      '• menu – tampilkan menu',
      '• ping – cek status bot',
      '• tentang – info bot',
      '• sticker – kirim gambar dengan caption "sticker"',
    ].join('\n');
    await client.sendMessage(chatId, txt);
  }
}

// -------- Fitur: Auto-sticker (gambar -> sticker) --------
async function handleSticker(msg) {
  try {
    const chat = await msg.getChat();
    if (!msg.hasMedia) {
      return msg.reply('Kirim *gambar* lalu beri caption: sticker');
    }
    const media = await msg.downloadMedia();
    if (!media || !media.mimetype.startsWith('image/')) {
      return msg.reply('Hanya mendukung gambar (bukan video) untuk sticker.');
    }
    await client.sendMessage(chat.id._serialized, media, {
      sendMediaAsSticker: true,
      stickerAuthor: 'Bot Istimewa',
      stickerName: 'AutoSticker'
    });
  } catch (e) {
    err('Gagal buat sticker:', e?.message || e);
    await msg.reply('Maaf, gagal membuat sticker. Coba gambar lain.');
  }
}

// -------- Fitur: Ping/Tentang --------
async function handlePing(msg){
  const t = new Date();
  await msg.reply(`PONG 🟢\n${t.toISOString()}`);
}
async function handleTentang(msg){
  const lines = [
    '🤖 *Bot Istimewa*',
    '• Pairing code + QR fallback',
    '• Menu tombol (fallback teks jika diblok)',
    '• Auto-sticker (gambar -> sticker)',
    '',
    'Gunakan dengan bijak & patuhi Ketentuan WhatsApp.',
  ];
  await msg.reply(lines.join('\n'));
}

// -------- Router pesan --------
client.on('message', async (msg) => {
  try {
    const txt = (msg.body || '').trim().toLowerCase();
    // Klik button akan mengisi selectedButtonId (lebih andal dibanding body)
    const buttonId = msg.selectedButtonId || '';

    if (txt === 'menu' || txt === '/menu') return sendMenu(msg.from);
    if (txt === 'ping' || txt === '/ping' || buttonId === 'BTN_PING') return handlePing(msg);
    if (txt === 'tentang' || txt === '/tentang' || buttonId === 'BTN_TENTANG') return handleTentang(msg);

    // Auto-sticker: caption "sticker" atau tombol
    if (txt === 'sticker' || txt === '/sticker' || buttonId === 'BTN_STICKER') {
      return handleSticker(msg);
    }

    // Salam awal singkat
    if (['hi','hai','halo','hello'].includes(txt)) {
      await msg.reply('Halo! Ketik *menu* untuk melihat fitur.');
    }
  } catch (e) {
    err('Handler error:', e?.message || e);
  }
});

// -------- Start --------
process.on('unhandledRejection', (e)=>err('unhandledRejection:', e));
process.on('uncaughtException', (e)=>err('uncaughtException:', e));

client.initialize();
info('Inisialisasi...',
  PAIR_MODE && PAIR_PHONE
    ? `(mode pairing, nomor: ${PAIR_PHONE})`
    : '(mode QR default)'
);
