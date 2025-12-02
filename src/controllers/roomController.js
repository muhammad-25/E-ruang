// FILE: controllers/roomController.js

const RoomModel = require('../models/roomModel');
const RoomPhoto = require('../models/roomphoto');
const RoomFacilities = require('../models/roomFacilities');
// const RoomSchedule = require('../models/roomSchedule'); // Opsional jika ingin menampilkan jadwal di kalender nanti

module.exports = {
  getRoomDetail: async (req, res) => {
    try {
      const roomId = req.params.id; // Ambil ID dari URL

      // 1. Ambil Data Ruangan Utama
      const room = await RoomModel.getRoomById(roomId);

      // Cek jika ruangan tidak ditemukan
      if (!room) {
        return res.status(404).render('pages/404', { 
            title: 'Ruangan Tidak Ditemukan', 
            layout: 'layouts/main',
            user: req.session.user || null 
        });
      }

      // 2. Ambil Foto Ruangan
      const photos = await RoomPhoto.listPhotosByRoom(roomId);
      
      // Tentukan foto utama (jika ada is_main=1, jika tidak ambil foto pertama)
      let mainPhoto = photos.find(p => p.is_main === 1);
      if (!mainPhoto && photos.length > 0) {
        mainPhoto = photos[0];
      }

      // 3. Ambil Fasilitas
      // Perhatikan cara import di roomFacilities.js Anda (exportnya nested)
      const facilities = await RoomFacilities.RoomFacilities.getFacilitiesByRoom(roomId);

      // 4. Render View dengan Data
      res.render('pages/detail_ruangan', {
        title: `Detail ${room.name}`,
        layout: 'layouts/main',
        user: req.user ? req.user.name : 'User', // Sesuaikan dengan session user kamu
        room: room,
        photos: photos,
        mainPhoto: mainPhoto,
        facilities: facilities
      });

    } catch (error) {
      console.error('Error fetching room detail:', error);
      res.status(500).send('Terjadi kesalahan server');
    }
  }
};