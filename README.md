# 🎵 Music Streaming App (SoundCloud Clone)

Web aplikasi streaming musik modern yang dibangun dengan **React** dan **Supabase**. Aplikasi ini memungkinkan pengguna untuk memutar musik, membuat playlist, mengunggah lagu (Admin), dan melihat riwayat pemutaran.

## ✨ Fitur Utama

- **Authentication:** Login & Register aman dengan Supabase Auth (Email & Password).
- **Music Player:** Pemutar musik full-featured (Play, Pause, Seek, Volume, Loop) menggunakan `Howler.js`.
- **User Library:**
  - ❤️ **Liked Songs:** Menyukai lagu favorit.
  - 📜 **Playlists:** Membuat dan mengelola playlist pribadi.
  - 🕒 **History:** Mencatat lagu yang baru saja diputar.
- **Upload System:** Admin/User dapat mengunggah file MP3 dan cover image.
- **Search:** Pencarian lagu berdasarkan judul.
- **Responsive UI:** Tampilan yang rapi di Desktop dan Mobile (Tailwind CSS).

## 🛠️ Teknologi yang Digunakan

- **Frontend:** React.js (Vite), Tailwind CSS, Radix UI (opsional).
- **Backend:** Supabase (PostgreSQL Database, Auth, Storage).
- **State Management:** Zustand (untuk Player state).
- **Audio:** React-Howler / Howler.js.
- **Icons:** Lucide React.
- **Routing:** React Router DOM.
