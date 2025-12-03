// FILE: controllers/bookingController.js
const BookingModel = require('../models/bookingModel');
const RoomModel = require('../models/roomModel');

module.exports = {
  processBooking: async (req, res) => {
    try {
      console.log('--- START PROCESS BOOKING ---');
      console.log('Body:', req.body); // Cek data dari form
      console.log('Session User ID:', req.session.userId); // Cek apakah ID user ada

      const { room_id, date, start, end, name, note } = req.body;
      const requesterId = req.session.userId; 

      // Validasi: Pastikan user login (Safety check)
      if (!requesterId) {
        return res.redirect('/login?error=Sesi habis, silakan login kembali.');
      }

      // 1. Validasi Input Dasar
      if (!room_id || !date || !start || !end || !name) {
        return res.redirect(`/room/${room_id}?error=Mohon lengkapi semua data formulir.`);
      }

      // Gabungkan Date dan Time
      const startDateTimeStr = `${date} ${start}:00`;
      const endDateTimeStr = `${date} ${end}:00`;

      const startObj = new Date(startDateTimeStr);
      const endObj = new Date(endDateTimeStr);
      const now = new Date();

      // 2. Validasi Waktu
      if (startObj < now) {
        return res.redirect(`/room/${room_id}?error=Tidak dapat meminjam ruangan di waktu yang sudah lewat.`);
      }
      if (endObj <= startObj) {
        return res.redirect(`/room/${room_id}?error=Jam selesai harus lebih akhir dari jam mulai.`);
      }

      // 3. Ambil Kapasitas Ruangan
      const room = await RoomModel.getRoomById(room_id);
      if (!room) {
        return res.redirect('/?error=Ruangan tidak ditemukan.');
      }
      
      // 4. Cek Bentrok
      const isBooked = await BookingModel.checkAvailability(room_id, startDateTimeStr, endDateTimeStr);
      if (isBooked) {
        return res.redirect(`/room/${room_id}?error=Ruangan sudah dipesan pada jam tersebut.`);
      }

      // 5. Simpan ke Database
      const bookingData = {
        requester_id: requesterId,
        room_id: room_id,
        penanggung_jawab: name,
        description: note || '',
        start_datetime: startDateTimeStr,
        end_datetime: endDateTimeStr,
        attendees_count: room.capacity // Mengambil dari room model
      };

      console.log('Data yang akan disimpan:', bookingData);

      // Eksekusi Simpan
      await BookingModel.createBooking(bookingData);
      
      console.log('--- BOOKING BERHASIL DISIMPAN ---');

      // 6. Sukses
      return res.redirect(`/room/${room_id}?success=Permintaan peminjaman berhasil dikirim. Menunggu persetujuan Admin.`);

    } catch (error) {
      console.error('CRITICAL BOOKING ERROR:', error);
      // Redirect dengan pesan error yang jelas agar user tahu terjadi kesalahan sistem
      return res.redirect(`/room/${req.body.room_id || ''}?error=Gagal menyimpan data ke database (Server Error).`);
    }
  }
};