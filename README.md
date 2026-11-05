# Serat Nasib

Website ramalan nasib statis (HTML + CSS + JavaScript murni, tanpa build).

- `index.html` – halaman siap hosting (GitHub Pages, Netlify, Vercel, cPanel).
- `natal.js` – bagan kelahiran astrologi: posisi Matahari, Bulan, dan 8 planet (rumus Meeus + elemen Kepler JPL),
  ascendant/MC, rumah Whole Sign, aspek, dan teks analisa. Tanpa pustaka luar.
- `en.js` – semua teks Bahasa Inggris (tampilan dan isi ramalan). Tombol ID/EN ada di pojok kanan atas;
  bahasa awal mengikuti bahasa browser pengunjung dan pilihan terakhir disimpan di browser.
- `ramalan.js` – mesin perhitungan: zodiak, angka jalan hidup, numerologi nama (Pythagoras),
  Ba Zi empat pilar, weton Jawa + cek jodoh, shio (tanggal Imlek dihitung dari fase bulan).
- `page.html` – versi pratinjau untuk Artifact claude.ai (isi sama dengan index.html).

Buka `index.html` langsung di browser untuk mencoba. Semua perhitungan di sisi klien.

## Iklan untuk membuka bacaan

Setiap bacaan terkunci dan dibuka satu per satu setelah pengunjung menonton iklan berhadiah
(rewarded ad) dari Google Ad Manager (GPT). Selama unit iklan belum diisi, situs memakai mode demo
(hitung mundur 5 detik).

Cara mengaktifkan iklan asli:
1. Daftar Google Ad Manager (bisa ditautkan dengan akun AdSense) dan buat unit iklan format **Rewarded**.
2. Tambahkan baris ini di `index.html` sebelum `<script src="ramalan.js">`:
   `<script>window.SERAT_IKLAN = { adUnitPath: "/KODE_JARINGAN/nama_unit_rewarded" };</script>`
3. Hosting di domain sendiri dan tambahkan domain itu di Ad Manager.

Jika iklan tidak tersedia, diblokir, atau gagal dimuat, bacaan tetap dibuka agar pengunjung tidak terjebak.
Jika pengunjung menutup iklan sebelum selesai, bacaan tetap terkunci.

## Langganan ramalan mingguan (email)

Formulir langganan mengirim email, nama, tanggal lahir, serta kelompok ZODIAK, SHIO, WETON, ANGKA, dan BAHASA (id/en)
ke layanan newsletter, supaya pelanggan bisa dikirimi ramalan per kelompok. Selama belum tersambung, formulir berjalan dalam mode demo.

Cara menyambungkan (contoh Brevo):
1. Buat akun Brevo, lalu buat atribut kontak TGL_LAHIR, ZODIAK, SHIO, WETON, ANGKA, BAHASA (teks). Nilai ZODIAK/SHIO/WETON selalu memakai nama Indonesia (mis. Sagitarius, Kuda, Selasa Pon) walau pengunjung memakai Bahasa Inggris, jadi segmen tidak terpecah. Pakai BAHASA untuk mengirim edisi Inggris ke pelanggan `en`.
2. Buat formulir pendaftaran (Contacts > Forms) dan salin URL `action` formulirnya (…sibforms.com/serve/…).
3. Tambahkan di `index.html` sebelum `<script src="ramalan.js">`:
   `<script>window.SERAT_LANGGANAN = { provider: "brevo", actionUrl: "URL_ACTION_FORMULIR" };</script>`
Untuk MailerLite pakai `provider: "mailerlite"` dengan URL `…/jsonp/<akun>/forms/<id>/subscribe` dan field zodiak, shio, weton, angka, tgl_lahir.

## Hosting (Vercel)

1. Hubungkan repo GitHub di vercel.com > Add New Project, pilih repo ini.
2. Framework Preset: **Other**. Build command kosong, output directory `.` (root).
3. Setelah tayang, pasang domain sendiri di Settings > Domains, lalu daftarkan domain itu di Google Ad Manager.

Bahan newsletter mingguan ada di folder `konten/`.

## Kota lahir & zona waktu

Kotak "Kota lahir" mencari kota di seluruh dunia lewat Open-Meteo Geocoding API (gratis, tanpa kunci).
Bila layanan tidak bisa diakses, dipakai daftar cadangan ±130 kota di `natal.js`.
Selisih waktu dihitung oleh browser dari zona waktu IANA, jadi musim panas (DST) dan perubahan zona historis
(mis. Jakarta GMT+7:30 sebelum 1964) ikut diperhitungkan.
