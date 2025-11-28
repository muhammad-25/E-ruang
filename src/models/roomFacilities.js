// -----------------------------
// FILE: models/roomFacilities.js

const db = require('../../database'); 

// --- TAMBAHKAN FUNGSI HELPER INI ---
async function query(sql, params = []) {
  if (typeof db.execute === 'function') {
    const [rows] = await db.execute(sql, params);
    return rows;
  }
  if (typeof db.query === 'function') {
    const [rows] = await db.query(sql, params);
    return rows;
  }
  throw new Error('Database client error');
}
// ------------------------------------

const RoomFacilities = {
  // add single mapping
  async addFacilityToRoom(roomId, facilityId) {
    const sql = 'INSERT INTO room_facilities (room_id, facility_id, created_at) VALUES (?, ?, NOW())';
    if (typeof db.execute === 'function') {
      const [result] = await db.execute(sql, [roomId, facilityId]);
      return { insertId: result.insertId, affectedRows: result.affectedRows };
    }
    const [result] = await db.query(sql, [roomId, facilityId]);
    return { insertId: result.insertId, affectedRows: result.affectedRows };
  },

  async removeFacilityFromRoom(roomId, facilityId) {
    const sql = 'DELETE FROM room_facilities WHERE room_id = ? AND facility_id = ?';
    if (typeof db.execute === 'function') {
      const [result] = await db.execute(sql, [roomId, facilityId]);
      return { affectedRows: result.affectedRows };
    }
    const [result] = await db.query(sql, [roomId, facilityId]);
    return { affectedRows: result.affectedRows };
  },

  async getFacilitiesByRoom(roomId) {
    // Perhatikan: di DB kolom nama fasilitas adalah 'nama', bukan 'name'
    // Saya ubah ORDER BY f.name menjadi ORDER BY f.nama sesuai SQL dump kamu
    const sql = `SELECT f.* FROM facilities f
      JOIN room_facilities rf ON rf.facility_id = f.id
      WHERE rf.room_id = ? ORDER BY f.nama ASC`;
    return await query(sql, [roomId]);
  },

  async getRoomsByFacility(facilityId) {
    const sql = `SELECT r.* FROM rooms r
      JOIN room_facilities rf ON rf.room_id = r.id
      WHERE rf.facility_id = ? ORDER BY r.name ASC`;
    return await query(sql, [facilityId]);
  },

  // Replace all facilities for a room with a given array of facilityIds
  async replaceFacilitiesForRoom(roomId, facilityIds = []) {
    if (typeof db.getConnection === 'function') {
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();
        await conn.execute('DELETE FROM room_facilities WHERE room_id = ?', [roomId]);
        if (Array.isArray(facilityIds) && facilityIds.length) {
          const placeholders = facilityIds.map(() => '(?, ?)').join(', ');
          const params = [];
          for (const fid of facilityIds) {
            params.push(roomId, fid);
          }
          const insertSql = `INSERT INTO room_facilities (room_id, facility_id) VALUES ${placeholders}`;
          await conn.execute(insertSql, params);
        }
        await conn.commit();
        return { success: true };
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }

    // fallback non-transactional
    await query('DELETE FROM room_facilities WHERE room_id = ?', [roomId]);
    if (Array.isArray(facilityIds) && facilityIds.length) {
      for (const fid of facilityIds) {
        await query('INSERT INTO room_facilities (room_id, facility_id, created_at) VALUES (?, ?, NOW())', [roomId, fid]);
      }
    }
    return { success: true };
  }
};

module.exports.RoomPhotos = module.exports; 
module.exports.Facilities = module.exports; 
module.exports.RoomFacilities = RoomFacilities;