Nama Anggota Team :
Muhammad Azfa Hermawan	1313624040
Ahmad				    1313624042
Muhammad			    1313624043


1.1 Install Node.js
Pastiin node js sudah terinstall
 
2. Install dan Menjalankan XAMPP
2.1 Download & Install XAMPP
·       Kunjungi website resmi XAMPP.
·       Unduh XAMPP versi terbaru untuk Windows.
·       Lakukan instalasi seperti aplikasi biasa.
2.2 Menjalankan Apache & MySQL
·       Buka XAMPP Control Panel.
·       Tekan tombol Start pada modul Apache.
·       Tekan tombol Start pada modul MySQL.
·       Pastikan status berubah menjadi hijau, yang menandakan layanan aktif.
Catatan: Jika Apache tidak mau berjalan, biasanya karena bentrok dengan port. Anda dapat mengubah port melalui tombol Config.


2.3 Upload Database SQL melalui phpMyAdmin
Mengakses phpMyAdmin
 Buka browser dan masuk ke alamat http://localhost/phpmyadmin. Pastikan Apache dan MySQL pada XAMPP sudah dalam kondisi aktif.


Membuat Database Baru
 Klik menu New pada sidebar kiri, kemudian masukkan nama database sesuai kebutuhan aplikasi e-Ruang. Setelah itu klik tombol Create untuk membuat database.


Memilih Database
 Setelah database berhasil dibuat, pilih nama database tersebut dari daftar database di sebelah kiri phpMyAdmin.


Masuk ke Menu Import
 Pada halaman database, klik menu Import yang berada di bagian atas untuk melakukan proses unggah file database.


Memilih File SQL
 Klik tombol Choose File, lalu pilih file database dengan ekstensi .sql yang telah disediakan (e-ruang.sql di folder root). Pastikan format file yang dipilih adalah SQL.


Melakukan Import Database
 Klik tombol Go untuk memulai proses import. Tunggu hingga proses selesai dan sistem menampilkan pesan bahwa database berhasil diimpor.


Verifikasi Database
 Pastikan seluruh tabel database e-Ruang sudah muncul di phpMyAdmin sebagai tanda bahwa proses upload database berhasil.

3. Setup Proyek E-Ruang
Setelah lingkungan siap, kini saatnya menjalankan proyek E-Ruang.
3.1 Siapkan Folder Proyek
·       Pastikan Anda sudah memiliki folder proyek bernama e-ruang.
·       Simpan folder di direktori yang mudah diakses, misalnya Documents/Projects.

3.2 Masuk ke Folder Proyek (CMD/Terminal)
Buka terminal dan arahkan ke dalam folder proyek menggunakan perintah:
cd path/ke/folder/e-ruang
Contoh:
cd C:/Users/cc/Documents/e-ruang
3.3 Install Dependensi Proyek
Proyek memerlukan beberapa package Node.js. Jalankan perintah:
npm install
Perintah ini akan mengunduh seluruh library yang dibutuhkan oleh aplikasi.
 
4. Menjalankan Aplikasi Web
Untuk menyalakan aplikasi E-Ruang, gunakan perintah berikut:
npm run app
Setelah perintah berjalan, terminal akan menampilkan bahwa server sudah aktif.

5. Mengakses Website
Ketika server sudah berjalan, buka browser Anda lalu akses:
http://localhost:3000
Jika berhasil, maka website E-Ruang tampil dan siap digunakan.
 

