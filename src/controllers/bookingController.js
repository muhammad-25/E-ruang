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
  },
  userHistory: async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.redirect('/login');
      }

      // 1. Ambil data dari Model
      const bookingsRaw = await BookingModel.getBookingsByUserId(userId);

      // 2. Format data agar sesuai dengan struktur 'mockBookings' di frontend
      const formattedBookings = bookingsRaw.map(b => {
        const start = new Date(b.start_datetime);
        const end = new Date(b.end_datetime);
        const now = new Date();

        // Format Tanggal (contoh: 15 Nov 2025)
        const dateStr = start.toLocaleDateString('id-ID', {
          day: 'numeric', month: 'short', year: 'numeric'
        });

        // Format Jam (contoh: 09:00 - 11:00)
        const timeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;

        // Hitung Durasi (Jam)
        const durationMs = end - start;
        const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
        const durationStr = `${durationHours} jam`;

        // Logic Status Frontend (upcoming, ongoing, completed, cancelled)
        let frontendStatus = 'upcoming';
        
        // Jika status DB 'pending' atau 'approved'
        if (b.db_status !== 'rejected' && b.db_status !== 'cancelled') {
            if (now > end) {
                frontendStatus = 'completed';
            } else if (now >= start && now <= end) {
                frontendStatus = 'ongoing';
            } else {
                frontendStatus = 'upcoming';
            }
        } else {
            // Jika DB bilang rejected/cancelled
            frontendStatus = 'cancelled';
        }

        // Gambar Default jika kosong
        const imagePath = b.room_image 
          ? `/uploads/rooms/${b.room_image}` 
          : 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1080&q=80'; // Placeholder

        return {
          id: b.id,
          roomName: b.room_name,
          roomImage: imagePath,
          location: `${b.gedung || '-'}, Ruang ${b.nomor_ruang || '-'}`,
          date: dateStr,
          time: timeStr,
          duration: durationStr,
          purpose: b.purpose || 'Tidak ada keterangan',
          status: frontendStatus, // status hasil kalkulasi waktu
          dbStatus: b.db_status, // status asli dari DB (pending/approved)
          participants: b.participants
        };
      });

      // 3. Kirim ke View
      res.render('pages/history', { 
        title: 'Riwayat Peminjaman',
        user: req.session, // Data user untuk navbar
        bookingsData: JSON.stringify(formattedBookings) // KITA KIRIM SEBAGAI STRING JSON
      });

    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).send('Terjadi kesalahan server saat mengambil data riwayat.');
    }
  }
};