-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 20 Des 2025 pada 06.18
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `e-ruang`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `bookings`
--

CREATE TABLE `bookings` (
  `id` bigint(20) NOT NULL,
  `requester_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `Penanggung_jawab` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `attendees_count` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL
) ;

--
-- Dumping data untuk tabel `bookings`
--

INSERT INTO `bookings` (`id`, `requester_id`, `room_id`, `Penanggung_jawab`, `description`, `start_datetime`, `end_datetime`, `attendees_count`, `status`, `created_at`, `updated_at`, `approved_by`, `approved_at`) VALUES
(3, 8, 4, 'Vaazi 17', 'perlu banget buat meeting kelas', '2025-12-12 08:00:00', '2025-12-12 21:00:00', 50, 'pending', '2025-12-05 17:03:39', '2025-12-05 17:03:39', NULL, NULL),
(5, 8, 4, 'tes', 'hahhahahah', '2025-12-25 02:06:00', '2025-12-25 23:06:00', 50, 'rejected', '2025-12-05 17:06:35', '2025-12-20 07:37:54', 1, '2025-12-20 07:37:54'),
(6, 7, 10, 'muhammad', 'coba demo', '2025-12-15 09:29:00', '2025-12-15 15:33:00', 50, 'approved', '2025-12-06 09:29:23', '2025-12-10 14:14:52', NULL, NULL),
(7, 7, 10, '213', '123321', '2040-02-12 12:01:00', '2040-02-12 19:00:00', 50, 'approved', '2025-12-13 10:22:42', '2025-12-19 14:58:39', 1, '2025-12-19 14:58:39'),
(8, 7, 10, 'tes', '12321312', '2025-12-13 13:00:00', '2025-12-13 19:00:00', 50, 'approved', '2025-12-13 10:29:54', '2025-12-19 15:30:35', 1, '2025-12-19 15:30:35'),
(9, 7, 10, '1123132', '123123', '2025-12-13 12:12:00', '2025-12-13 19:00:00', 50, 'rejected', '2025-12-13 10:42:28', '2025-12-19 15:29:51', 1, '2025-12-19 15:29:51'),
(10, 7, 11, 'tes waktu', 'tes waktu', '2025-12-25 07:30:00', '2025-12-25 21:00:00', 50, 'rejected', '2025-12-19 19:15:40', '2025-12-20 07:37:40', 1, '2025-12-20 07:37:40'),
(11, 9, 10, 'muh', 'minjam kelas untuk acara bemp', '2025-12-22 08:00:00', '2025-12-22 10:00:00', 50, 'approved', '2025-12-20 07:31:25', '2025-12-20 07:37:31', 1, '2025-12-20 07:37:31'),
(12, 7, 12, 'muhammad', 'pinjam kelas untuk acara bem', '2025-12-31 10:30:00', '2025-12-31 12:30:00', 50, 'approved', '2025-12-20 11:44:23', '2025-12-20 11:45:12', 1, '2025-12-20 11:45:12');

-- --------------------------------------------------------

--
-- Struktur dari tabel `facilities`
--

CREATE TABLE `facilities` (
  `id` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `facilities`
--

INSERT INTO `facilities` (`id`, `nama`, `created_at`, `updated_at`) VALUES
(1, 'Proyektor', '2025-11-27 21:44:19', '2025-11-27 21:44:19'),
(2, 'AC', '2025-11-27 21:44:19', '2025-11-27 21:44:19'),
(3, 'WiFi', '2025-11-27 21:44:19', '2025-11-27 21:44:19'),
(4, 'Meja & Kursi', '2025-11-27 21:44:19', '2025-11-27 21:44:19'),
(5, 'Papan Tulis', '2025-11-27 21:44:19', '2025-11-27 21:44:19'),
(6, 'Sound System', '2025-11-27 21:44:19', '2025-11-27 21:44:19');

-- --------------------------------------------------------

--
-- Struktur dari tabel `roles`
--

CREATE TABLE `roles` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `name` varchar(20) NOT NULL,
  `description` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'admin', 'Administrator sistem'),
(2, 'user', 'Pengguna biasa');

-- --------------------------------------------------------

--
-- Struktur dari tabel `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `gedung` varchar(100) DEFAULT NULL,
  `nomor_ruang` varchar(50) DEFAULT NULL,
  `deskripsi` text DEFAULT NULL,
  `capacity` int(10) UNSIGNED DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `rooms`
--

INSERT INTO `rooms` (`id`, `code`, `name`, `gedung`, `nomor_ruang`, `deskripsi`, `capacity`, `is_active`, `created_at`, `updated_at`) VALUES
(4, 'GDS-513-0473', 'GDS 513', 'GDS', '513', 'LAB KOMPUTER', 50, 1, '2025-11-28 17:45:50', '2025-12-05 16:14:49'),
(10, 'GED-512-1276', 'GDS 503', 'Gedung Dewi Sartika', '503', 'Kelas ini adalah laboratorium komputer yang terlihat rapi, bersih, dan tertata dengan sangat terstruktur. Setiap meja dilengkapi satu set PC desktop lengkap—monitor, keyboard, dan mouse—yang tersusun dalam beberapa baris menghadap ke papan tulis di depan. Meja berbahan kayu terang memberikan kesan minimalis dan profesional.\r\n\r\nRuangan memiliki pencahayaan yang baik dari lampu plafon serta dinding berwarna terang yang membuat ruang tampak luas. Kursi-kursi tersusun rapi di belakang setiap meja, menunjukkan bahwa ruangan ini siap digunakan untuk praktikum atau pelajaran komputer.\r\n\r\nDi bagian depan kelas terdapat whiteboard dan sebuah meja instruktur, menandakan posisi pengajar saat memberikan penjelasan. Bagian belakang menunjukkan area pintu masuk dengan kaca sehingga memberikan kesan lebih terbuka.\r\n\r\nSecara keseluruhan, ruangan ini memberikan suasana laboratorium komputer modern yang nyaman dan kondusif untuk belajar maupun praktek pemrograman atau aktivitas digital lainnya.', 50, 1, '2025-12-05 20:24:11', '2025-12-06 09:30:36'),
(11, 'GED-613-7121', 'GDS 613', 'Gedung Dewi Sartika', '613', 'Ruang Kelas ini merupakan ruang perkuliahan yang digunakan untuk kegiatan belajar mengajar, diskusi, dan presentasi. Ruangan ini mendukung aktivitas akademik dengan fasilitas yang memadai dan dapat dipinjam sesuai kebutuhan civitas akademika.', 50, 1, '2025-12-19 19:14:57', '2025-12-19 19:14:57'),
(12, 'GED-608-3639', 'GDS 610', 'Gedung Dewi Sartika', '610', 'RUANG KELAS', 50, 1, '2025-12-20 07:35:03', '2025-12-20 07:36:35');

-- --------------------------------------------------------

--
-- Struktur dari tabel `room_facilities`
--

CREATE TABLE `room_facilities` (
  `id` bigint(20) NOT NULL,
  `room_id` int(11) NOT NULL,
  `facility_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `room_facilities`
--

INSERT INTO `room_facilities` (`id`, `room_id`, `facility_id`, `created_at`) VALUES
(20, 4, 2, '2025-12-05 16:14:49'),
(21, 4, 3, '2025-12-05 16:14:49'),
(22, 4, 4, '2025-12-05 16:14:49'),
(28, 10, 1, '2025-12-06 09:30:36'),
(29, 10, 2, '2025-12-06 09:30:36'),
(30, 10, 3, '2025-12-06 09:30:36'),
(31, 10, 4, '2025-12-06 09:30:36'),
(32, 11, 1, '2025-12-19 19:14:57'),
(33, 11, 2, '2025-12-19 19:14:57'),
(34, 11, 3, '2025-12-19 19:14:57'),
(35, 11, 4, '2025-12-19 19:14:57'),
(36, 11, 5, '2025-12-19 19:14:57'),
(42, 12, 1, '2025-12-20 07:36:35'),
(43, 12, 2, '2025-12-20 07:36:35'),
(44, 12, 3, '2025-12-20 07:36:35'),
(45, 12, 4, '2025-12-20 07:36:35'),
(46, 12, 5, '2025-12-20 07:36:35');

-- --------------------------------------------------------

--
-- Struktur dari tabel `room_photos`
--

CREATE TABLE `room_photos` (
  `id` bigint(20) NOT NULL,
  `room_id` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `is_main` tinyint(1) NOT NULL DEFAULT 0,
  `uploaded_by` int(11) DEFAULT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `room_photos`
--

INSERT INTO `room_photos` (`id`, `room_id`, `filename`, `is_main`, `uploaded_by`, `uploaded_at`) VALUES
(2, 4, 'room-1764326750468-252700213.jpeg', 1, NULL, '2025-11-28 17:45:50'),
(9, 4, 'room-1764926089454-494230666.png', 0, NULL, '2025-12-05 16:14:49'),
(10, 10, 'room-1764941051267-794507875.jpg', 1, NULL, '2025-12-05 20:24:11'),
(11, 11, 'room-1766146497115-618142588.jpeg', 1, NULL, '2025-12-19 19:14:57'),
(12, 12, 'room-1766190903627-83738608.jpeg', 1, NULL, '2025-12-20 07:35:03'),
(13, 12, 'room-1766190995979-266860032.jpg', 0, NULL, '2025-12-20 07:36:35');

-- --------------------------------------------------------

--
-- Struktur dari tabel `room_schedules`
--

CREATE TABLE `room_schedules` (
  `id` bigint(20) NOT NULL,
  `room_id` int(11) NOT NULL,
  `hari` enum('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu') NOT NULL,
  `jam_mulai` time NOT NULL,
  `jam_selesai` time NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `room_schedules`
--

INSERT INTO `room_schedules` (`id`, `room_id`, `hari`, `jam_mulai`, `jam_selesai`, `created_at`) VALUES
(33, 4, 'Senin', '08:00:00', '18:00:00', '2025-12-05 16:14:49'),
(34, 4, 'Selasa', '08:00:00', '18:00:00', '2025-12-05 16:14:49'),
(35, 4, 'Rabu', '08:00:00', '18:00:00', '2025-12-05 16:14:49'),
(36, 4, 'Kamis', '08:00:00', '18:00:00', '2025-12-05 16:14:49'),
(37, 4, 'Jumat', '08:00:00', '18:00:00', '2025-12-05 16:14:49'),
(43, 10, 'Senin', '06:30:00', '22:30:00', '2025-12-06 09:30:36'),
(44, 10, 'Selasa', '06:30:00', '22:30:00', '2025-12-06 09:30:36'),
(45, 10, 'Rabu', '06:30:00', '22:30:00', '2025-12-06 09:30:36'),
(46, 10, 'Kamis', '06:30:00', '22:30:00', '2025-12-06 09:30:36'),
(47, 10, 'Jumat', '06:30:00', '22:30:00', '2025-12-06 09:30:36'),
(48, 11, 'Senin', '07:30:00', '18:00:00', '2025-12-19 19:14:57'),
(49, 11, 'Selasa', '07:30:00', '18:00:00', '2025-12-19 19:14:57'),
(50, 11, 'Rabu', '07:30:00', '18:00:00', '2025-12-19 19:14:57'),
(51, 11, 'Kamis', '07:30:00', '18:00:00', '2025-12-19 19:14:57'),
(52, 11, 'Jumat', '07:30:00', '18:00:00', '2025-12-19 19:14:57');

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `role_id` tinyint(3) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(150) NOT NULL,
  `NIM` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `role_id`, `email`, `password_hash`, `name`, `NIM`, `created_at`, `updated_at`) VALUES
(1, 1, 'admin123@gmail.com', '$2b$12$DVQy0KtTMXHk6fyUVN7Nl.pKJsRfc2ydsc8nBau8zluIL3UmpB9ru', 'Admin', '1', '2025-11-14 15:04:40', '2025-12-20 09:29:46'),
(7, 2, 'vaazi17@gmail.com', '$2b$12$96FtX2qc.7aGIEeGmcCUHuYKaITc8kfB9Y8sGs1mkggZ5OpF3kso6', 'Muhammad', '1313624043', '2025-11-27 17:39:11', '2025-12-13 10:41:57'),
(8, 2, 'vaazi254@gmail.com', '$2b$12$MqC3ok39G4jYRbgsz6dB6OhfrE15JeOayZjeyTagaQ0oXQVNPnGuO', 'hello', '12345678', '2025-12-05 17:03:04', '2025-12-12 20:23:36'),
(9, 2, 'vaazi49@gmail.com', '$2b$12$CNQrEt/JEeromovsEt3rSejVDpMZgzQXjlNdnQTjAweICGR/RS1rS', 'muh', '111111111111', '2025-12-20 07:28:33', '2025-12-20 07:30:13');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `requester_id` (`requester_id`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `idx_bookings_room_time` (`room_id`,`start_datetime`,`end_datetime`),
  ADD KEY `idx_bookings_status` (`status`);

--
-- Indeks untuk tabel `facilities`
--
ALTER TABLE `facilities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nama` (`nama`);

--
-- Indeks untuk tabel `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indeks untuk tabel `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_room_code` (`code`);

--
-- Indeks untuk tabel `room_facilities`
--
ALTER TABLE `room_facilities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_room_facility` (`room_id`,`facility_id`),
  ADD KEY `idx_room` (`room_id`),
  ADD KEY `idx_facility` (`facility_id`);

--
-- Indeks untuk tabel `room_photos`
--
ALTER TABLE `room_photos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `room_id` (`room_id`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indeks untuk tabel `room_schedules`
--
ALTER TABLE `room_schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_room_hari` (`room_id`,`hari`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `identity_number` (`NIM`),
  ADD KEY `role_id` (`role_id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `facilities`
--
ALTER TABLE `facilities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `roles`
--
ALTER TABLE `roles`
  MODIFY `id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT untuk tabel `room_facilities`
--
ALTER TABLE `room_facilities`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT untuk tabel `room_photos`
--
ALTER TABLE `room_photos`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT untuk tabel `room_schedules`
--
ALTER TABLE `room_schedules`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  ADD CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `room_facilities`
--
ALTER TABLE `room_facilities`
  ADD CONSTRAINT `rf_facility_fk` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `rf_room_fk` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `room_photos`
--
ALTER TABLE `room_photos`
  ADD CONSTRAINT `room_photos_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `room_photos_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `room_schedules`
--
ALTER TABLE `room_schedules`
  ADD CONSTRAINT `rs_room_fk` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
