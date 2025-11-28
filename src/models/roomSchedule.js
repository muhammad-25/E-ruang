// FILE: models/roomSchedule.js
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
  // Menambah jadwal baru
  async createSchedule(data) {
    const sql = `INSERT INTO room_schedules 
      (room_id, hari, jam_mulai, jam_selesai, created_at) 
      VALUES (?, ?, ?, ?, NOW())`;
      
    const params = [
      data.room_id,
      data.hari,        // Enum: 'Senin', 'Selasa', dll
      data.jam_mulai,   // Format 'HH:mm'
      data.jam_selesai  // Format 'HH:mm'
    ];

    if (typeof db.execute === 'function') {
      const [result] = await db.execute(sql, params);
      return result;
    }
    const [result] = await db.query(sql, params);
    return result;
  },

  // Hapus jadwal berdasarkan room_id (berguna saat update)
  async deleteSchedulesByRoom(roomId) {
    return await query('DELETE FROM room_schedules WHERE room_id = ?', [roomId]);
  }
};

