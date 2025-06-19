# EduSlide

Platform presentasi interaktif modern untuk guru dan siswa, berbasis FastAPI (Python) dan React (Vite, Tailwind v3).

## Fitur Utama
- Upload & presentasi slide (PDF/PPT)
- Aktivitas interaktif real-time: Kuis, Polling, Word Cloud, Bubble Quiz (klik gambar), Kanvas Gambar
- Leaderboard & skor langsung
- Siswa join dengan kode
- Dashboard guru & manajemen sesi
- Autentikasi berbasis peran (JWT)

## Struktur Folder
```
eduslide/
  backend/
    main.py
    crud/
    routers/
    models/
    schemas/
    utils/
    requirements.txt
    ...
  frontend/
    src/
      components/
      pages/
      services/
      ...
    package.json
    tailwind.config.js
    ...
```

## Cara Menjalankan

### Backend (API & WebSocket)
1. Aktifkan venv Python di `backend/` (jika belum):
   ```sh
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   # atau
   source venv/bin/activate  # Mac/Linux
   pip install -r requirements.txt
   ```
2. Dari **root project** (`eduslide/`), jalankan:
   ```sh
   uvicorn backend.main:socket_app --reload
   ```
   - API & Socket.IO server di `http://127.0.0.1:8000`

### Frontend (React)
1. Install dependensi:
   ```sh
   cd frontend
   npm install
   ```
2. Jalankan dev server:
   ```sh
   npm run dev
   ```
   - Aplikasi di `http://localhost:5173`

## Autentikasi
- Login JWT untuk guru/admin
- Siswa join sesi dengan kode (tanpa login)

## Kontak
- **Author:** Danar Wasis Pambudi
- **Email:** danarwasis@gmail.com, a710220063@student.ums.ac.id
- **GitHub:** zwinkle

## Lisensi
MIT License. Bebas digunakan untuk pendidikan dan riset.

---

## Masalah Utama

1. **Minimnya keterlibatan siswa** selama pembelajaran karena metode satu arah yang dominan.
2. **Penggunaan slide presentasi yang pasif**, hanya berupa perpindahan halaman tanpa aktivitas berarti.
3. **Kurangnya interaksi dua arah** antara guru dan siswa secara real-time saat pembelajaran.
4. **Guru kesulitan membuat pembelajaran interaktif** karena harus menggunakan banyak platform yang terpisah.

---

## Tujuan Sistem

- Menyediakan media presentasi yang interaktif, mudah digunakan, dan terpadu.
- Meningkatkan keterlibatan siswa melalui aktivitas langsung selama penyampaian materi.
- Memberikan fleksibilitas kepada guru untuk menyisipkan aktivitas sesuai kebutuhan pembelajaran.
- Mencatat dan menganalisis keterlibatan siswa dalam setiap sesi secara real-time.

---

## Fitur Utama

### Presentasi Materi
- Upload file **PDF** atau **PPT** untuk dijadikan presentasi.
- Slide dapat diputar per halaman seperti slideshow.
- Dukungan pembuatan slide langsung di platform menggunakan **HTML/Markdown** editor.

### Kegiatan Interaktif (Disisipkan di Slide)
- **Live Drawing (Kelompok):** Kolaborasi guru dan siswa menggambar langsung di canvas yang sama.
- **Word Cloud:** Siswa mengirimkan kata kunci, dan sistem menampilkan word cloud dinamis.
- **Polling:** Voting pilihan ganda dengan visualisasi hasil secara langsung.
- **Kuis Gambar (Bubble):** Siswa diminta mengklik bagian tertentu dalam gambar; hasil dikumpulkan dalam bentuk bubble.
- **Random Choice (Picker):** Menentukan siswa secara acak dalam kegiatan tertentu.
- **Leaderboard dan Skor:** Sistem penghargaan dan peringkat berdasarkan skor kegiatan interaktif siswa.

### Fitur Guru
- Buat dan kelola presentasi.
- Tambahkan dan posisikan aktivitas interaktif di setiap slide.
- Pantau semua interaksi siswa secara real-time.
- Ekspor data interaksi dan skor siswa ke Excel.

### Fitur Siswa
- Masuk ke sesi menggunakan kode atau QR.
- Ikut serta dalam setiap kegiatan interaktif.
- Lihat hasil polling, leaderboard, dan skor pribadi.

---

## Alur Kerja Sistem

1. Guru mendaftar dan login.
2. Guru membuat atau mengunggah presentasi.
3. Guru menyisipkan kegiatan interaktif pada slide tertentu.
4. Sesi presentasi dimulai, siswa bergabung menggunakan kode unik atau QR.
5. Guru menavigasi slide sambil menjalankan kegiatan interaktif.
6. Data interaksi siswa dicatat dan divisualisasikan secara langsung.
7. Guru mengunduh rekap skor, hasil word cloud, polling, dan lainnya.

---

## Teknologi
- **Frontend:** React (Vite), TailwindCSS v3, Ant Design, React Konva, Chart.js, Socket.IO Client
- **Backend:** FastAPI, PostgreSQL, Socket.IO (ASGI), JWT Auth

---

## Keamanan

- Autentikasi menggunakan JWT Access dan Refresh Token.
- Authorization Role-Based Access (admin, guru, siswa).
- Input validation & sanitization di seluruh aktivitas siswa.
- WebSocket menggunakan autentikasi token.
- Proteksi brute force dengan limiter login.

---

## Contoh Studi Kasus

Guru Matematika mengunggah file *Persamaan Linear.pdf* dan menyisipkan:
- Slide 2: polling "Berapa nilai x dari 5x+2=17?"
- Slide 3: live drawing "Gambarkan grafik fungsi linear"
- Slide 5: kuis bubble, siswa klik titik maksimum pada parabola

Siswa join via kode atau QR, menjawab aktivitas, dan leaderboard tampil secara real-time. Semua data tersimpan dan bisa diunduh sebagai laporan akhir.

---

## Manfaat Sistem

- Membantu guru membuat pembelajaran aktif dan tidak membosankan.
- Memberikan pengalaman belajar dua arah yang menyenangkan.
- Mendorong siswa untuk aktif, berpikir, dan berpartisipasi.
- Memungkinkan analisis data untuk evaluasi pembelajaran.

---

## Catatan Tambahan
- Sistem bisa digunakan oleh guru di SMP/SMA atau universitas.
- Potensial dipakai sebagai startup produk.
- Kode akan dipisah frontend dan backend, siap untuk deployment dengan Docker.