const RoomModel = require('../models/roomModel');
const RoomPhoto = require('../models/roomphoto');
const RoomFacilities = require('../models/roomFacilities');
const RoomSchedule = require('../models/roomSchedule');
const BookingModel = require('../models/bookingModel');

function normalizeTime(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 5);
  if (value instanceof Date) {
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  }
  return String(value).slice(0, 5);
}

function formatSchedules(schedules = []) {
  return schedules.map((schedule) => ({
    id: schedule.id,
    room_id: schedule.room_id,
    hari: schedule.hari,
    jam_mulai: normalizeTime(schedule.jam_mulai),
    jam_selesai: normalizeTime(schedule.jam_selesai)
  }));
}

function getFallbackSchedules(roomId) {
  return ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map((hari, index) => ({
    id: `default-${index + 1}`,
    room_id: Number(roomId),
    hari,
    jam_mulai: '07:00',
    jam_selesai: '21:00'
  }));
}

function toFullCalendarBusinessHours(schedules = []) {
  const dayMap = {
    Minggu: 0,
    Senin: 1,
    Selasa: 2,
    Rabu: 3,
    Kamis: 4,
    Jumat: 5,
    Sabtu: 6
  };

  return schedules
    .filter((schedule) => schedule.jam_mulai && schedule.jam_selesai)
    .map((schedule) => ({
      daysOfWeek: [dayMap[schedule.hari]],
      startTime: schedule.jam_mulai,
      endTime: schedule.jam_selesai
    }))
    .filter((schedule) => schedule.daysOfWeek[0] !== undefined);
}

module.exports = {
  getRoomDetail: async (req, res) => {
    try {
      const roomId = req.params.id;

      const room = await RoomModel.getRoomById(roomId);

      if (!room) {
        return res.status(404).render('pages/404', { 
            title: 'Ruangan Tidak Ditemukan', 
            layout: 'layouts/main',
            user: req.session.user || null 
        });
      }

      const photos = await RoomPhoto.listPhotosByRoom(roomId);

      let mainPhoto = photos.find(p => p.is_main === 1);
      if (!mainPhoto && photos.length > 0) {
        mainPhoto = photos[0];
      }

      const facilities = await RoomFacilities.RoomFacilities.getFacilitiesByRoom(roomId);
      const rooms = await RoomModel.listRooms({ onlyActive: true });
      const schedulesRaw = await RoomSchedule.getSchedulesByRoom(roomId);
      const schedules = schedulesRaw.length ? formatSchedules(schedulesRaw) : getFallbackSchedules(roomId);

      res.render('pages/detail_ruangan', {
        title: `Detail ${room.name}`,
        layout: 'layouts/main',
        user: req.user ? req.user.name : 'User', 
        room: room,
        rooms: rooms,
        photos: photos,
        mainPhoto: mainPhoto,
        facilities: facilities,
        schedules: schedules
      });

    } catch (error) {
      console.error('Error fetching room detail:', error);
      res.status(500).send('Terjadi kesalahan server');
    }
  },

  getRoomAvailability: async (req, res) => {
    try {
      const roomId = req.params.id;
      const { start, end } = req.query;

      if (!start || !end) {
        return res.status(400).json({
          success: false,
          message: 'Rentang tanggal kalender tidak valid.'
        });
      }

      const room = await RoomModel.getRoomById(roomId);
      if (!room || Number(room.is_active) !== 1) {
        return res.status(404).json({
          success: false,
          message: 'Ruangan tidak ditemukan atau tidak aktif.'
        });
      }

      const schedulesRaw = await RoomSchedule.getSchedulesByRoom(roomId);
      const schedules = schedulesRaw.length ? formatSchedules(schedulesRaw) : getFallbackSchedules(roomId);
      const bookings = await BookingModel.getCalendarBookings(roomId, start, end);

      const events = bookings.map((booking) => {
        const isApproved = booking.status === 'approved';
        return {
          id: String(booking.id),
          title: isApproved ? 'Terisi' : 'Menunggu Persetujuan',
          start: booking.start_datetime,
          end: booking.end_datetime,
          display: 'block',
          classNames: [isApproved ? 'event-approved' : 'event-pending'],
          extendedProps: {
            status: booking.status,
            statusLabel: isApproved ? 'Terisi' : 'Menunggu Persetujuan',
            requesterName: booking.requester_name || '-',
            penanggungJawab: booking.penanggung_jawab || '-',
            description: booking.description || ''
          }
        };
      });

      return res.json({
        success: true,
        room: {
          id: room.id,
          name: room.name,
          gedung: room.gedung,
          nomor_ruang: room.nomor_ruang,
          capacity: room.capacity
        },
        schedules,
        businessHours: toFullCalendarBusinessHours(schedules),
        events
      });
    } catch (error) {
      console.error('Error fetching room availability:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memuat data ketersediaan ruangan.'
      });
    }
  }
};
