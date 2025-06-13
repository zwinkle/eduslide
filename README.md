# 🎓 EduSlide - Sistem Presentasi Edukatif Interaktif untuk Guru dan Siswa

EduSlide adalah platform presentasi edukatif interaktif berbasis web yang dirancang khusus untuk guru dan siswa dalam proses pembelajaran di kelas maupun daring. Platform ini tidak hanya menampilkan materi pembelajaran dalam bentuk slide (PDF atau PPT), tetapi juga menyisipkan kegiatan interaktif secara real-time yang meningkatkan keterlibatan, fokus, dan partisipasi siswa selama pembelajaran berlangsung.

---

## 📌 Masalah Utama

1. **Minimnya keterlibatan siswa** selama pembelajaran karena metode satu arah yang dominan.
2. **Penggunaan slide presentasi yang pasif**, hanya berupa perpindahan halaman tanpa aktivitas berarti.
3. **Kurangnya interaksi dua arah** antara guru dan siswa secara real-time saat pembelajaran.
4. **Guru kesulitan membuat pembelajaran interaktif** karena harus menggunakan banyak platform yang terpisah.

---

## 🎯 Tujuan Sistem

- Menyediakan media presentasi yang interaktif, mudah digunakan, dan terpadu.
- Meningkatkan keterlibatan siswa melalui aktivitas langsung selama penyampaian materi.
- Memberikan fleksibilitas kepada guru untuk menyisipkan aktivitas sesuai kebutuhan pembelajaran.
- Mencatat dan menganalisis keterlibatan siswa dalam setiap sesi secara real-time.

---

## 🌟 Fitur Utama

### 🔧 Presentasi Materi
- Upload file **PDF** atau **PPT** untuk dijadikan presentasi.
- Slide dapat diputar per halaman seperti slideshow.
- Dukungan pembuatan slide langsung di platform menggunakan **HTML/Markdown** editor.

### 🧩 Kegiatan Interaktif (Disisipkan di Slide)
- **Live Drawing (Kelompok):** Kolaborasi guru dan siswa menggambar langsung di canvas yang sama.
- **Word Cloud:** Siswa mengirimkan kata kunci, dan sistem menampilkan word cloud dinamis.
- **Polling:** Voting pilihan ganda dengan visualisasi hasil secara langsung.
- **Kuis Gambar (Heatmap):** Siswa diminta mengklik bagian tertentu dalam gambar; hasil dikumpulkan dalam bentuk heatmap.
- **Random Choice (Picker):** Menentukan siswa secara acak dalam kegiatan tertentu.
- **Leaderboard dan Skor:** Sistem penghargaan dan peringkat berdasarkan skor kegiatan interaktif siswa.

### 👩‍🏫 Fitur Guru
- Buat dan kelola presentasi.
- Tambahkan dan posisikan aktivitas interaktif di setiap slide.
- Pantau semua interaksi siswa secara real-time.
- Ekspor data interaksi dan skor siswa ke Excel.

### 🧑‍🎓 Fitur Siswa
- Masuk ke sesi menggunakan kode atau QR.
- Ikut serta dalam setiap kegiatan interaktif.
- Lihat hasil polling, leaderboard, dan skor pribadi.

---

## ⚙️ Alur Kerja Sistem

1. Guru mendaftar dan login.
2. Guru membuat atau mengunggah presentasi.
3. Guru menyisipkan kegiatan interaktif pada slide tertentu.
4. Sesi presentasi dimulai, siswa bergabung menggunakan kode unik atau QR.
5. Guru menavigasi slide sambil menjalankan kegiatan interaktif.
6. Data interaksi siswa dicatat dan divisualisasikan secara langsung.
7. Guru mengunduh rekap skor, hasil word cloud, polling, dan lainnya.

---

## 🏗️ Arsitektur Teknologi

### Frontend
- **React.js** (dengan Vite)
- **TailwindCSS v3**
- **React Router DOM**
- **Konva.js** (untuk live drawing)
- **Chart.js** (polling dan visualisasi data)
- **heatmap.js** (untuk kuis gambar interaktif)
- **Socket.IO Client** (untuk real-time communication)
- **QRCode.js** (untuk kode sesi)

### Backend
- **FastAPI** (Python)
- **PostgreSQL** sebagai database utama
- **Redis** untuk pub/sub dan cache real-time
- **Socket.IO Server (ASGI)**
- **JWT Authentication + Refresh Token**
- **PDF/PPT Parser** untuk konversi halaman ke image (menggunakan pdf2image atau cloud convert API)

### Deployment
- **Docker** (multistage)
- **Gunicorn + Uvicorn Worker**
- **Nginx** sebagai reverse proxy
- **HTTPS** dengan Let's Encrypt
- **CI/CD** dengan GitHub Actions

---

## 🔐 Keamanan

- Autentikasi menggunakan JWT Access dan Refresh Token.
- Authorization Role-Based Access (admin, guru, siswa).
- Input validation & sanitization di seluruh aktivitas siswa.
- WebSocket menggunakan autentikasi token.
- Proteksi brute force dengan limiter login.

---

## 📡 Endpoint API

| Method | Endpoint | Autentikasi | Keterangan |
|--------|----------|-------------|------------|
| POST | `/auth/register` | ❌ | Registrasi pengguna |
| POST | `/auth/login` | ❌ | Login dan generate JWT |
| POST | `/auth/refresh` | ❌ | Perbarui token akses |
| GET | `/me` | ✔️ | Informasi profil pengguna |
| POST | `/presentations` | ✔️ (guru) | Buat presentasi baru |
| GET | `/presentations` | ✔️ | Daftar presentasi |
| GET | `/presentations/{id}` | ✔️ | Detail presentasi |
| POST | `/slides` | ✔️ | Tambah slide presentasi |
| GET | `/slides/{id}` | ✔️ | Detail slide |
| POST | `/slides/{id}/activity` | ✔️ (guru) | Tambahkan kegiatan interaktif |
| POST | `/slides/{id}/interact` | ✔️ (siswa) | Kirim jawaban interaktif |
| GET | `/leaderboard/{session_id}` | ✔️ | Lihat skor siswa |
| GET | `/sessions/{code}` | ✔️ | Join sesi oleh siswa |
| GET | `/export/{session_id}` | ✔️ (guru) | Ekspor hasil interaksi |

---

## 🧾 Struktur Database (PostgreSQL)

### `users`
- `id` UUID PRIMARY KEY
- `name` TEXT
- `email` TEXT UNIQUE
- `password_hash` TEXT
- `role` TEXT CHECK IN ('admin', 'teacher', 'student')
- `created_at` TIMESTAMP

### `presentations`
- `id` UUID PRIMARY KEY
- `title` TEXT
- `owner_id` UUID REFERENCES users(id)
- `created_at` TIMESTAMP

### `slides`
- `id` UUID PRIMARY KEY
- `presentation_id` UUID REFERENCES presentations(id)
- `page_number` INTEGER
- `type` TEXT CHECK IN ('static', 'interactive')
- `interactive_type` TEXT NULLABLE
- `content_url` TEXT
- `settings` JSONB

### `sessions`
- `id` UUID PRIMARY KEY
- `presentation_id` UUID
- `code` TEXT UNIQUE
- `start_time` TIMESTAMP
- `end_time` TIMESTAMP NULLABLE

### `interactions`
- `id` UUID PRIMARY KEY
- `session_id` UUID
- `slide_id` UUID
- `user_id` UUID
- `data` JSONB
- `created_at` TIMESTAMP

### `scores`
- `id` UUID PRIMARY KEY
- `session_id` UUID
- `user_id` UUID
- `score` INTEGER

---

## 📊 Contoh Studi Kasus

Guru Matematika mengunggah file *Persamaan Linear.pdf* dan menyisipkan:
- Slide 2: polling “Berapa nilai x dari 5x+2=17?”
- Slide 3: live drawing “Gambarkan grafik fungsi linear”
- Slide 5: kuis heatmap, siswa klik titik maksimum pada parabola

Siswa join via kode atau QR, menjawab aktivitas, dan leaderboard tampil secara real-time. Semua data tersimpan dan bisa diunduh sebagai laporan akhir.

---

## 📈 Manfaat Sistem

- Membantu guru membuat pembelajaran aktif dan tidak membosankan.
- Memberikan pengalaman belajar dua arah yang menyenangkan.
- Mendorong siswa untuk aktif, berpikir, dan berpartisipasi.
- Memungkinkan analisis data untuk evaluasi pembelajaran.

---

## 👨‍💻 Developer

- **Nama:** Danar Wasis Pambudi
- **Proyek Skripsi:** Sistem Interaktif Presentasi Edukasi
- **Universitas:** Universitas Muhammadiyah Surakarta
- **Email:** danarwasis@gmail.com, a710220063@student.ums.ac.id
- **GitHub:** zwinkle

---

## 📄 Lisensi

MIT License. Bebas digunakan untuk pendidikan, riset, dan pengembangan sistem pembelajaran.


---

## 📌 Catatan Tambahan
- Sistem bisa digunakan oleh guru di SMP/SMA atau universitas.
- Potensial dipakai sebagai startup produk.
- Kode akan dipisah frontend dan backend, siap untuk deployment dengan Docker.

---

## 📁 Struktur Folder (Saran)

```bash
📦eduslide
 ┣ 📂backend
 ┃ ┣ 📜main.py
 ┃ ┣ 📂crud
 ┃ ┣ 📂routers
 ┃ ┣ 📂models
 ┃ ┣ 📂schemas
 ┃ ┗ 📂services
 ┣ 📂frontend
 ┃ ┣ 📂src
 ┃ ┣ 📜App.jsx
 ┃ ┣ 📜main.jsx
 ┃ ┣ 📜index.css
 ┃ ┣ 📜tailwind.config.js
 ┃ ┣ 📂components
 ┃ ┣ 📂pages
 ┃ ┗ 📂services
 ┗ 📜README.md