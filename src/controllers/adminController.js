// FILE: controllers/addller.js

const RoomModel = require('../models/roomModel');
const RoomFacilities = require('../models/roomFacilities'); // Perhatikan exportnya di file kamu
const RoomPhoto = require('../models/roomphoto');
const RoomSchedule = require('../models/roomSchedule');

module.exports = {
  // Menampilkan halaman tambah kelas (GET)
  viewTambahKelas: async (req, res) => {
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
            facilities, 
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

            // 3. Simpan Fasilitas
            if (facilities) {
            const facilityIds = Array.isArray(facilities) ? facilities : [facilities];

            for (const fid of facilityIds) {
                // Parse ke integer
                const facilityIdInt = parseInt(fid);
                
                // Simpan ke DB hanya jika valid number
                if (!isNaN(facilityIdInt)) {
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

        const roomsWithData = await Promise.all(rooms.map(async (room) => {
            // Ambil foto
            const photos = await RoomPhoto.listPhotosByRoom(room.id);
            const mainPhoto = photos.find(p => p.is_main === 1) || photos[0];
            
            // Ambil fasilitas
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
          await RoomModel.deleteRoom(id);

          res.json({ success: true, message: 'Ruangan berhasil dihapus' });
      } catch (error) {
          console.error("Error deleting room:", error);
          res.status(500).json({ success: false, message: 'Gagal menghapus ruangan' });
      }
  },

  viewEditKelas: async (req, res) => {
    try {
        const roomId = req.query.id; 
        console.log('--- Mencoba Edit Ruangan dengan ID:', roomId);

        if (!roomId) {
          console.log('!!! ID Ruangan tidak ditemukan di URL.');
          return res.redirect('/admin-DaftarRuangan');
        }

        const room = await RoomModel.getRoomById(roomId);
        if (!room) {
          console.log('!!! Ruangan tidak ditemukan untuk ID:', roomId);
          return res.redirect('/admin-DaftarRuangan');
        }

        const allFacilities = await require('../models/facilities').listFacilities();
        
        const facilitiesData = await RoomFacilities.RoomFacilities.getFacilitiesByRoom(roomId);

        const currentFacilities = facilitiesData.map(f => f.id);  
        const photos = await RoomPhoto.listPhotosByRoom(roomId);
        const rawSchedules = await RoomSchedule.getSchedulesByRoom(roomId); 
        
        // Pengelompokan Jadwal
        const groupedSchedules = {};
        rawSchedules.forEach(schedule => {
            const key = `${schedule.jam_mulai}-${schedule.jam_selesai}`;
            if (!groupedSchedules[key]) {
                groupedSchedules[key] = {
                    id: schedule.id, 
                    jam_mulai: schedule.jam_mulai,
                    jam_selesai: schedule.jam_selesai,
                    days: [] // Ganti 'hari' jadi 'days' agar sesuai dengan EJS (sch.days.includes)
                };
            }
            // Pastikan push ke 'days' bukan 'hari' karena di EJS viewEditKelas baris 15 pakai 'sch.days'
            groupedSchedules[key].days.push(schedule.hari);
        });
        const scheduleList = Object.values(groupedSchedules);

        console.log('--- Data Berhasil Diambil. Merender halaman edit-kelas.');
        
        res.render('pages/edit-kelas', { 
            layout: "layouts/admin", 
            title: 'Edit Kelas',
            room: room,                   
            allFacilities: allFacilities, 
            currentFacilities: currentFacilities, // Array of IDs
            photos: photos, 
            facilities: currentFacilities, // Tambahkan ini karena EJS baris 9 pakai variabel 'facilities' untuk cek includes
            schedules: scheduleList       
        });

    } catch (error) {
        console.error('!!! ERROR FATAL viewEditKelas:', error);
        res.redirect('/admin-DaftarRuangan');
    }
  },

  // 2. PROSES UPDATE DATA (POST)
  updateClass: async (req, res) => {
    try {
        // Ambil ID dari body (hidden input) atau query, kita asumsikan dikirim via hidden input
        const { 
            id, // Pastikan ada input hidden name="id" di form EJS
            name, building, room_number, description, capacity, 
            facilities, // Checkbox facilities
            schedule_days, schedule_start, schedule_end 
        } = req.body;

        // A. Update Data Utama Ruangan
        const updateData = {
            name, 
            gedung: building, 
            nomor_ruang: room_number, 
            deskripsi: description, 
            capacity: parseInt(capacity) || 0
            // Code ruangan biasanya tidak diubah agar konsisten, atau bisa digenerate ulang
        };
        await RoomModel.updateRoom(id, updateData);

        // B. Update Fasilitas (Hapus lama -> Insert baru)
        // Jika user tidak centang apapun, facilities undefined, jadi kirim array kosong
        const newFacilities = facilities ? (Array.isArray(facilities) ? facilities : [facilities]) : [];
        await RoomFacilities.RoomFacilities.replaceFacilitiesForRoom(id, newFacilities);

        // C. Update Jadwal (Hapus lama -> Insert baru)
        // Hapus semua jadwal lama
        await RoomSchedule.deleteSchedulesByRoom(id);
        
        // Insert jadwal baru (Logika sama seperti storeClass)
        if (schedule_days && Array.isArray(schedule_days)) {
            for (let i = 0; i < schedule_days.length; i++) {
                const daysArray = schedule_days[i].split(','); 
                const start = schedule_start[i];
                const end = schedule_end[i];

                if (start && end && daysArray.length > 0) {
                    for (const day of daysArray) {
                        if (day.trim() !== '') {
                            await RoomSchedule.createSchedule({
                                room_id: id,
                                hari: day.trim(),
                                jam_mulai: start,
                                jam_selesai: end
                            });
                        }
                    }
                }
            }
        }

        // D. Update Foto (Opsional: Tambah foto baru)
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const photoData = {
                    room_id: id,
                    filename: file.filename, 
                    url: `/uploads/rooms/${file.filename}`, 
                    is_main: 0 // Foto baru jadi sekunder dulu
                };
                await RoomPhoto.createPhoto(photoData);
            }
        }

        res.redirect('/admin-DaftarRuangan'); // Selesai, kembali ke list

    } catch (error) {
        console.error('Error updateClass:', error);
        res.redirect('/edit?id=' + req.body.id);
    }
  }
};

