const RoomModel = require('../models/roomModel');
const RoomPhoto = require('../models/roomphoto');
const RoomFacilities = require('../models/roomFacilities');

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

      res.render('pages/detail_ruangan', {
        title: `Detail ${room.name}`,
        layout: 'layouts/main',
        user: req.user ? req.user.name : 'User', 
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