export const changelog = [
  {
    version: 'v1.3.3',
    date: '27 Okt 2026',
    isLatest: true,
    features: [
      'Fitur Drag & Drop Re-arrange Dompet: Atur urutan tampilan kartu dompet dengan mudah menggunakan drag handle khusus dan tersimpan permanen ke database',
      'Analitik Pertumbuhan Saldo MoM (Month-over-Month): Indikator persentase perubahan saldo bulanan dinamis di Beranda Desktop dan Mobile',
      'Kalkulasi Akumulasi Bunga: Tampilan akumulasi total nominal bunga yang telah diterima langsung pada kartu dompet berbunga (APR > 0%)',
      'Integrasi Emoji Picker Modern: Pemilihan emoji kategori dan dompet kini menggunakan library eksternal yang interaktif dengan kategori lengkap dan pencarian cepat',
      'Perhitungan Akurat Saldo Berjalan: Algoritma kalkulasi mundur (reverse calculation) dari saldo aktual pada riwayat transaksi Detail Dompet',
      'Sinkronisasi Zona Waktu WIB: Penguncian zona waktu Asia/Jakarta pada format tanggal agar label relatif ("Hari ini" & "Kemarin") selalu presisi',
      'Penyempurnaan Form Dompet: Penonaktifkan auto-detect ikon/tema saat mengetik nama dompet untuk kebebasan kustomisasi penuh',
      'Perbaikan Form Transaksi Rutin: Perbaikan layout modal desktop, sanitasi UUID kosong, dan penyesuaian constraint tipe transaksi database',
      'Konsistensi Visibilitas Tombol Aksi: Ikon Edit dan Hapus pada daftar kategori dan kartu dompet kini selalu tampil konsisten di layar Desktop maupun Mobile',
    ],
  },
  {
    version: 'v1.3.2',
    date: '21 Okt 2026',
    isLatest: false,
    features: [
      'Penyempurnaan z-index Custom Numpad & Bottom Navigation untuk memastikan numpad selalu tampil di lapisan paling atas',
      'Pembaruan modal Atur Saldo Dompet menjadi Bottom Sheet Drawer dengan tampilan nominal typography dan integrasi Custom Numpad bebas kursor native',
      'Penyelarasan UI Form Transaksi Rutin agar konsisten dengan Form Transaksi utama (nominal besar dinamis, chip kategori, dan grouped card)',
      'Fitur switcher/swap dompet asal dan tujuan pada transaksi bertipe Transfer yang diletakkan di sisi kanan di bawah badge IDR',
    ],
  },
  {
    version: 'v1.3.1',
    date: '20 Okt 2026',
    isLatest: false,
    features: [
      'Penyempurnaan interaksi mobile: pencegahan auto-zoom pada iOS Safari via viewport lock dan font input standar minimal 16px (text-base)',
      'Perbaikan Custom Numpad pada modal Detail Dompet: pemblokiran keyboard native dan penempatan numpad yang presisi di bawah drawer',
    ],
  },
  {
    version: 'v1.3.0',
    date: '19 Okt 2026',
    isLatest: false,
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
