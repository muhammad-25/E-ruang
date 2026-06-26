// FILE: controllers/bookingController.js
const BookingModel = require('../models/bookingModel');
const RoomModel = require('../models/roomModel');
const RoomSchedule = require('../models/roomSchedule');

function normalizeTime(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 5);
  if (value instanceof Date) {
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  }
  return String(value).slice(0, 5);
}

function timeToMinutes(value) {
  const [hour, minute] = String(value || '00:00').split(':').map(Number);
  return (hour || 0) * 60 + (minute || 0);
}

function dayName(date) {
  return ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][date.getDay()];
}

function isWithinOperatingHours(startObj, endObj, schedules) {
  const requestDay = dayName(startObj);
  const requestStart = startObj.getHours() * 60 + startObj.getMinutes();
  const requestEnd = endObj.getHours() * 60 + endObj.getMinutes();

  return schedules.some((schedule) => {
    if (schedule.hari !== requestDay) return false;
    const open = timeToMinutes(normalizeTime(schedule.jam_mulai));
    const close = timeToMinutes(normalizeTime(schedule.jam_selesai));
    return requestStart >= open && requestEnd <= close && requestEnd > requestStart;
  });
}

function getFallbackSchedules() {
  return ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map((hari) => ({
    hari,
    jam_mulai: '07:00',
    jam_selesai: '21:00'
  }));
}

function formatDateTimeForDb(date, time) {
  return `${date} ${time}:00`;
}

function isAtLeastHoursBefore(dateTime, hours) {
  return dateTime.getTime() - Date.now() >= hours * 60 * 60 * 1000;
}

function redirectWithHistoryError(res, message) {
  return res.redirect(`/history?error=${encodeURIComponent(message)}`);
}

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
      const startDateTimeStr = formatDateTimeForDb(date, start);
      const endDateTimeStr = formatDateTimeForDb(date, end);

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

      const schedulesRaw = await RoomSchedule.getSchedulesByRoom(room_id);
      const schedules = schedulesRaw.length ? schedulesRaw : getFallbackSchedules();
      if (!isWithinOperatingHours(startObj, endObj, schedules)) {
        return res.redirect(`/room/${room_id}?error=Waktu peminjaman berada di luar jam operasional ruangan.`);
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
        const startTimeValue = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
        const endTimeValue = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
        const timeStr = `${startTimeValue} - ${endTimeValue}`;

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
          participants: b.participants,
          dateValue: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
          startTime: startTimeValue,
          endTime: endTimeValue,
          canCancel: ['pending', 'approved'].includes(b.db_status) && isAtLeastHoursBefore(start, 24),
          canReschedule: ['pending', 'approved'].includes(b.db_status) && isAtLeastHoursBefore(start, 48)
        };
      });

      // 3. Kirim ke View
      res.render('pages/history', { 
        title: 'Riwayat Peminjaman',
        user: req.session, // Data user untuk navbar
        error: req.query.error || '',
        success: req.query.success || '',
        bookingsData: JSON.stringify(formattedBookings) // KITA KIRIM SEBAGAI STRING JSON
      });

    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).send('Terjadi kesalahan server saat mengambil data riwayat.');
    }
  },

  cancelBooking: async (req, res) => {
    try {
      const userId = req.session.userId;
      const bookingId = req.params.id;

      if (!userId) {
        return res.redirect('/login');
      }

      const booking = await BookingModel.getBookingForUser(bookingId, userId);
      if (!booking) {
        return redirectWithHistoryError(res, 'Data peminjaman tidak ditemukan.');
      }

      if (!['pending', 'approved'].includes(booking.status)) {
        return redirectWithHistoryError(res, 'Peminjaman dengan status ini tidak dapat dibatalkan.');
      }

      const startObj = new Date(booking.start_datetime);
      if (!isAtLeastHoursBefore(startObj, 24)) {
        return redirectWithHistoryError(res, 'Pembatalan hanya dapat dilakukan maksimal H-1 sebelum jadwal mulai.');
      }

      const result = await BookingModel.cancelBooking(bookingId, userId);
      if (!result || result.affectedRows === 0) {
        return redirectWithHistoryError(res, 'Gagal membatalkan peminjaman. Silakan muat ulang halaman.');
      }

      return res.redirect('/history?success=Peminjaman berhasil dibatalkan.');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return redirectWithHistoryError(res, 'Terjadi kesalahan server saat membatalkan peminjaman.');
    }
  },

  rescheduleBooking: async (req, res) => {
    try {
      const userId = req.session.userId;
      const bookingId = req.params.id;
      const { date, start, end } = req.body;

      if (!userId) {
        return res.redirect('/login');
      }

      const booking = await BookingModel.getBookingForUser(bookingId, userId);
      if (!booking) {
        return redirectWithHistoryError(res, 'Data peminjaman tidak ditemukan.');
      }

      if (!['pending', 'approved'].includes(booking.status)) {
        return redirectWithHistoryError(res, 'Peminjaman dengan status ini tidak dapat diubah jadwalnya.');
      }

      const oldStartObj = new Date(booking.start_datetime);
      if (!isAtLeastHoursBefore(oldStartObj, 48)) {
        return redirectWithHistoryError(res, 'Perubahan jadwal hanya dapat dilakukan maksimal H-2 sebelum jadwal mulai.');
      }

      if (!date || !start || !end) {
        return redirectWithHistoryError(res, 'Tanggal, jam mulai, dan jam selesai wajib diisi.');
      }

      const startDateTimeStr = formatDateTimeForDb(date, start);
      const endDateTimeStr = formatDateTimeForDb(date, end);
      const startObj = new Date(startDateTimeStr);
      const endObj = new Date(endDateTimeStr);

      if (startObj < new Date()) {
        return redirectWithHistoryError(res, 'Tidak dapat mengubah jadwal ke waktu yang sudah lewat.');
      }

      if (endObj <= startObj) {
        return redirectWithHistoryError(res, 'Jam selesai harus lebih akhir dari jam mulai.');
      }

      const schedulesRaw = await RoomSchedule.getSchedulesByRoom(booking.room_id);
      const schedules = schedulesRaw.length ? schedulesRaw : getFallbackSchedules();
      if (!isWithinOperatingHours(startObj, endObj, schedules)) {
        return redirectWithHistoryError(res, 'Waktu baru berada di luar jam operasional ruangan.');
      }

      const isBooked = await BookingModel.checkAvailabilityExcludingBooking(
        booking.room_id,
        startDateTimeStr,
        endDateTimeStr,
        bookingId
      );
      if (isBooked) {
        return redirectWithHistoryError(res, 'Ruangan sudah dipesan pada jadwal baru tersebut.');
      }

      const result = await BookingModel.rescheduleBooking(bookingId, userId, startDateTimeStr, endDateTimeStr);
      if (!result || result.affectedRows === 0) {
        return redirectWithHistoryError(res, 'Gagal mengubah jadwal peminjaman. Silakan muat ulang halaman.');
      }

      return res.redirect('/history?success=Jadwal peminjaman berhasil diubah dan menunggu persetujuan admin.');
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      return redirectWithHistoryError(res, 'Terjadi kesalahan server saat mengubah jadwal peminjaman.');
    }
  }
};
