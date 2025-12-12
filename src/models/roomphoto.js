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
  async listPhotos({ roomId = null } = {}) {
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

  async createPhoto(data) {
    const sql = `INSERT INTO room_photos (room_id, filename, is_main, uploaded_at)
      VALUES (?, ?, ?, NOW())`;
      
    const params = [
      data.room_id || null,
      data.filename || null,
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

  async setPrimaryPhoto(roomId, photoId) {
    if (typeof db.getConnection === 'function') {
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();
        await conn.execute('UPDATE room_photos SET is_main = 0 WHERE room_id = ?', [roomId]);
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
    await query('UPDATE room_photos SET is_main = 0 WHERE room_id = ?', [roomId]);
    await query('UPDATE room_photos SET is_main = 1 WHERE id = ? AND room_id = ?', [photoId, roomId]);
    return { success: true };
  }
};