// FILE: models/roomphoto.js
// FIXED: Disesuaikan dengan tabel `room_photos` di e-ruang (2).sql

const db = require('../../database');

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

module.exports = {
  // Ambil semua foto
  async listPhotos({ roomId = null } = {}) {
    // FIXED: Nama tabel `room_photos` dan kolom `is_main`
    let sql = 'SELECT * FROM room_photos';
    const params = [];
    if (roomId !== null) {
      sql += ' WHERE room_id = ?';
      params.push(roomId);
    }
    sql += ' ORDER BY is_main DESC, id ASC';
    return await query(sql, params);
  },

  async listPhotosByRoom(roomId) {
    return await this.listPhotos({ roomId });
  },

  async getPhotoById(id) {
    const rows = await query('SELECT * FROM room_photos WHERE id = ? LIMIT 1', [id]);
    return rows && rows.length ? rows[0] : null;
  },

  // FIXED: Fungsi Create disesuaikan dengan kolom DB
  async createPhoto(data) {
    // Tabel: room_photos
    // Kolom tersedia: id, room_id, filename, is_main, uploaded_by, uploaded_at
    
    const sql = `INSERT INTO room_photos (room_id, filename, is_main, uploaded_at)
      VALUES (?, ?, ?, NOW())`;
      
    const params = [
      data.room_id || null,
      data.filename || null,
      // Map data.is_primary (dari controller) ke is_main (database)
      (data.is_primary === 1 || data.is_primary === true || data.is_main === 1) ? 1 : 0
    ];

    if (typeof db.execute === 'function') {
      const [result] = await db.execute(sql, params);
      return { insertId: result.insertId, affectedRows: result.affectedRows };
    }
    const [result] = await db.query(sql, params);
    return { insertId: result.insertId, affectedRows: result.affectedRows };
  },

  async deletePhoto(id) {
    const sql = 'DELETE FROM room_photos WHERE id = ?';
    if (typeof db.execute === 'function') {
      const [result] = await db.execute(sql, [id]);
      return { affectedRows: result.affectedRows };
    }
    const [result] = await db.query(sql, [id]);
    return { affectedRows: result.affectedRows };
  },

  // Set satu foto sebagai main (primary)
  async setPrimaryPhoto(roomId, photoId) {
    // Gunakan transaksi jika memungkinkan
    if (typeof db.getConnection === 'function') {
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();
        // Reset semua jadi 0
        await conn.execute('UPDATE room_photos SET is_main = 0 WHERE room_id = ?', [roomId]);
        // Set yang dipilih jadi 1
        await conn.execute('UPDATE room_photos SET is_main = 1 WHERE id = ? AND room_id = ?', [photoId, roomId]);
        await conn.commit();
        return { success: true };
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }
    // Fallback tanpa transaksi
    await query('UPDATE room_photos SET is_main = 0 WHERE room_id = ?', [roomId]);
    await query('UPDATE room_photos SET is_main = 1 WHERE id = ? AND room_id = ?', [photoId, roomId]);
    return { success: true };
  }
};