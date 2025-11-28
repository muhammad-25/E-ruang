// FILE: models/roomPhotos.js
// Model untuk tabel `rooms_photo` (One-to-Many terhadap rooms)
// Asumsi: ../database mengekspor pool dari mysql2/promise (atau object yang memiliki execute/query/getConnection)

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
  throw new Error('Database client tidak ditemukan. Pastikan ../database mengekspor pool dari mysql2/promise.');
}

module.exports = {
  // Ambil semua foto (opsional filter by room)
  async listPhotos({ roomId = null } = {}) {
    let sql = 'SELECT * FROM rooms_photo';
    const params = [];
    if (roomId !== null) {
      sql += ' WHERE room_id = ?';
      params.push(roomId);
    }
    sql += ' ORDER BY is_primary DESC, id ASC';
    return await query(sql, params);
  },

  async listPhotosByRoom(roomId) {
    return await this.listPhotos({ roomId });
  },

  async getPhotoById(id) {
    const rows = await query('SELECT * FROM rooms_photo WHERE id = ? LIMIT 1', [id]);
    return rows && rows.length ? rows[0] : null;
  },

  // data: { room_id, filename, url, is_primary }
  async createPhoto(data) {
    const sql = `INSERT INTO rooms_photo (room_id, filename, url, is_primary, created_at)
      VALUES (?, ?, ?, ?, NOW())`;
    const params = [
      data.room_id || null,
      data.filename || null,
      data.url || null,
      (typeof data.is_primary === 'number' || typeof data.is_primary === 'boolean') ? Number(data.is_primary) : 0
    ];
    if (typeof db.execute === 'function') {
      const [result] = await db.execute(sql, params);
      return { insertId: result.insertId, affectedRows: result.affectedRows };
    }
    const [result] = await db.query(sql, params);
    return { insertId: result.insertId, affectedRows: result.affectedRows };
  },

  async updatePhoto(id, data) {
    const sets = [];
    const params = [];
    const allowed = ['filename','url','is_primary','room_id'];
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(data, k)) {
        sets.push(`${k} = ?`);
        if (k === 'is_primary') params.push(Number(data[k]));
        else params.push(data[k]);
      }
    }
    if (!sets.length) return { affectedRows: 0 };
    const sql = `UPDATE rooms_photo SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`;
    params.push(id);
    if (typeof db.execute === 'function') {
      const [result] = await db.execute(sql, params);
      return { affectedRows: result.affectedRows };
    }
    const [result] = await db.query(sql, params);
    return { affectedRows: result.affectedRows };
  },

  async deletePhoto(id) {
    const sql = 'DELETE FROM rooms_photo WHERE id = ?';
    if (typeof db.execute === 'function') {
      const [result] = await db.execute(sql, [id]);
      return { affectedRows: result.affectedRows };
    }
    const [result] = await db.query(sql, [id]);
    return { affectedRows: result.affectedRows };
  },

  // Set satu foto sebagai primary untuk satu room (non-primary semua lainnya)
  async setPrimaryPhoto(roomId, photoId) {
    // Best-effort transaction if available
    if (typeof db.getConnection === 'function') {
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();
        await conn.execute('UPDATE rooms_photo SET is_primary = 0 WHERE room_id = ?', [roomId]);
        await conn.execute('UPDATE rooms_photo SET is_primary = 1 WHERE id = ? AND room_id = ?', [photoId, roomId]);
        await conn.commit();
        return { success: true };
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }
    // fallback: non-transactional
    await query('UPDATE rooms_photo SET is_primary = 0 WHERE room_id = ?', [roomId]);
    await query('UPDATE rooms_photo SET is_primary = 1 WHERE id = ? AND room_id = ?', [photoId, roomId]);
    return { success: true };
  }
};




