export const changelog = [
  {
    version: 'v1.3.0',
    date: '19 Okt 2026',
    isLatest: true,
    features: [
      'Halaman baru Detail Dompet (/wallet/:id) dengan riwayat transaksi per dompet, navigasi bulan, dan ringkasan arus kas',
      'Header dompet ringkas dan modern dengan logo bank/e-wallet, nama, jenis dompet, dan navigasi terintegrasi',
      'Custom Numpad & Kalkulator bawaan mobile (+, -, ×, ÷, =) dengan live evaluation dan overlay dinamis seperti keyboard native',
      'Desain baru Form Transaksi mobile-first dengan nominal besar dinamis, kursor aktif, dan aksi transfer antar dompet',
      'Fitur pencarian kategori transaksi langsung (Live Search) pada drawer modal semua kategori',
      'Optimasi performa logo finansial lokal dan penyempurnaan kompabilitas build produksi (Vercel)',
    ],
  },
  {
    version: 'v1.2.0',
    date: '15 Okt 2026',
    isLatest: false,
    features: [
      'Fitur Transaksi Rutin & Langganan bulanan otomatis dengan pilihan tanggal eksekusi 1-31',
      'Pusat Notifikasi pintar dengan badge pengingat jatuh tempo tagihan (Hari Ini, Segera, Terjadwal)',
      'Banner pengingat tagihan aktif di Dashboard utama',
      'Fitur Ubah Kata Sandi pada menu Profil dengan validasi aman dan toggle sembunyikan/tampilkan sandi',
      'Pembaruan menu dan log update aplikasi (Apa yang Baru?)',
    ],
  },
  {
    version: 'v1.1.0',
    date: '15 Okt 2026',
    isLatest: false,
    features: [
      'Efek visual dinamis Godrays Shader pada kartu dompet mobile',
      'Pola Responsive Modal: Dialog di Desktop dan Drawer (Bottom Sheet) di Mobile',
      'Format numerik otomatis Rupiah dengan dukungan keyboard numerik pada smartphone',
      'Perbaikan bug dropdown Select melayang di dalam sheet drawer mobile',
    ],
  },
  {
    version: 'v1.0.0',
    date: '14 Okt 2026',
    isLatest: false,
    features: [
      'Rilis perdana Nomi Personal Finance Tracker',
      'Manajemen multi-dompet (Rekening Bank, E-Wallet, dan Tabungan)',
      'Pencatatan transaksi Pemasukan, Pengeluaran, dan Transfer',
      'Dashboard keuangan interaktif dengan grafik kategori, tren bulanan, dan batas anggaran',
      'Konfigurasi kategori kustom dan autentikasi aman dengan Supabase',
    ],
  },
]

export const currentVersion = changelog[0].version
