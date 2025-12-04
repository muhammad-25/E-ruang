// FILE: controllers/addller.js

// Import semua model yang dibutuhkan
const RoomModel = require('../models/roomModel');
const RoomFacilities = require('../models/roomFacilities'); // Perhatikan exportnya di file kamu
const RoomPhoto = require('../models/roomphoto');
const RoomSchedule = require('../models/roomSchedule');

module.exports = {
  // Menampilkan halaman tambah kelas (GET)
  viewTambahKelas: async (req, res) => {
    // Kita butuh list fasilitas untuk ditampilkan di view (opsional jika view hardcode)
    // Tapi di view kamu sepertinya hardcode button, jadi render biasa saja
    res.render('pages/tambahKelas', { 
        layout: "layouts/admin", 
        title: 'Tambah Kelas' 
    });
  },

  // Proses Simpan Kelas (POST)
  // adminController.js

    storeClass: async (req, res) => {
        try {
            const { 
            name, 
            building, 
            room_number, 
            description, 
            capacity, 
            facilities, // UBAH: Ambil 'facilities' (dari checkbox name="facilities[]")
            schedule_days,      
            schedule_start, 
            schedule_end 
            } = req.body;

            // 1. Generate Kode Unik
            const uniqueCode = `${building.substring(0,3).toUpperCase()}-${room_number}-${Date.now().toString().slice(-4)}`;

            // 2. Simpan Data Ruangan Utama
            const roomData = {
            code: uniqueCode,
            name: name,
            gedung: building,
            nomor_ruang: room_number,
            deskripsi: description,
            capacity: parseInt(capacity) || 0,
            is_active: 1
            };

            const newRoom = await RoomModel.createRoom(roomData);
            const newRoomId = newRoom.insertId;

            if (!newRoomId) {
            throw new Error('Gagal menyimpan data ruangan utama.');
            }

            // 3. Simpan Fasilitas (LOGIKA BARU)
            // Cek apakah user mencentang minimal satu fasilitas
            if (facilities) {
            // Pastikan data berbentuk Array. 
            // (Jika user cuma centang 1, HTML kadang kirim string, bukan array. Kita convert paksa jadi array)
            const facilityIds = Array.isArray(facilities) ? facilities : [facilities];

            for (const fid of facilityIds) {
                // Parse ke integer biar aman
                const facilityIdInt = parseInt(fid);
                
                // Simpan ke DB hanya jika valid number
                if (!isNaN(facilityIdInt)) {
                // Mengakses model sesuai struktur export Anda
                await RoomFacilities.RoomFacilities.addFacilityToRoom(newRoomId, facilityIdInt);
                }
            }
            }

            // 4. Simpan Foto (Tidak berubah)
            if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const photoData = {
                room_id: newRoomId,
                filename: file.filename, 
                url: `/uploads/rooms/${file.filename}`, 
                is_primary: i === 0 ? 1 : 0, 
                };
                await RoomPhoto.createPhoto(photoData);
            }
            }

            // 5. Simpan Jadwal (Tidak berubah)
            if (schedule_days && Array.isArray(schedule_days)) {
            for (let i = 0; i < schedule_days.length; i++) {
                const daysArray = schedule_days[i].split(','); 
                const start = schedule_start[i];
                const end = schedule_end[i];

                if (start && end && daysArray.length > 0) {
                for (const day of daysArray) {
                    if (day.trim() !== '') {
                    await RoomSchedule.createSchedule({
                        room_id: newRoomId,
                        hari: day.trim(),
                        jam_mulai: start,
                        jam_selesai: end
                    });
                    }
                }
                }
            }
            }

            // Redirect Sukses
            res.redirect('/add'); 

        } catch (error) {
            console.error('Error adding class:', error);
            res.redirect('/add');
        }
    },

    viewDaftarRuangan: async (req, res) => {
    try {
        // Ambil semua ruangan
        const rooms = await RoomModel.listRooms();

        // Kita perlu melengkapi data ruangan dengan Foto Utama & Fasilitas
        // Menggunakan Promise.all agar efisien
        const roomsWithData = await Promise.all(rooms.map(async (room) => {
            // Ambil foto
            const photos = await RoomPhoto.listPhotosByRoom(room.id);
            const mainPhoto = photos.find(p => p.is_main === 1) || photos[0];
            
            // Ambil fasilitas
            // Akses model sesuai struktur export di file roomFacilities.js kamu
            const facilities = await RoomFacilities.RoomFacilities.getFacilitiesByRoom(room.id);

            return {
                ...room,
                thumbnail: mainPhoto ? mainPhoto.filename : null,
                facilities: facilities || [] // Array fasilitas
            };
        }));

        res.render('pages/admin-DaftarRuangan', { 
            layout: "layouts/admin", 
            title: 'Daftar Ruangan',
            rooms: roomsWithData // Kirim data ke EJS
        });

    } catch (error) {
        console.error("Error fetching rooms:", error);
        res.status(500).send("Terjadi kesalahan server");
    }
  },

  // 2. MENGHAPUS RUANGAN
  deleteRoom: async (req, res) => {
      const { id } = req.params;
      try {
          // Hapus data (Logic penghapusan relasi foto/fasilitas biasanya ditangani DB cascade 
          // atau harus dihapus manual satu persatu. Untuk sekarang kita panggil model deleteRoom)
          await RoomModel.deleteRoom(id);
          
          // Kirim respon JSON agar bisa ditangkap fetch di frontend
          res.json({ success: true, message: 'Ruangan berhasil dihapus' });
      } catch (error) {
          console.error("Error deleting room:", error);
          res.status(500).json({ success: false, message: 'Gagal menghapus ruangan' });
      }
  }
};

