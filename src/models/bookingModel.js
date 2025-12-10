// FILE: models/bookingModel.js
const db = require('../../database');

// ... (kode query wrapper dan checkAvailability tetap sama) ...
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
  // ... (fungsi checkAvailability dan createBooking biarkan saja) ...
  async checkAvailability(roomId, startDateTime, endDateTime) {
    // ... kode lama ...
    const sql = `
      SELECT id FROM bookings 
      WHERE room_id = ? 
      AND status = 'approved'
      AND (
        (start_datetime < ? AND end_datetime > ?) 
      )
      LIMIT 1
    `;
    const rows = await query(sql, [roomId, endDateTime, startDateTime]);
    return rows.length > 0;
  },

  async createBooking(data) {
     // ... kode lama ...
     const sql = `
      INSERT INTO bookings (
        requester_id, 
        room_id, 
        penanggung_jawab, 
        description, 
        start_datetime, 
        end_datetime, 
        attendees_count, 
        status, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `;

    const params = [
      data.requester_id,
      data.room_id,
      data.penanggung_jawab, 
      data.description,
      data.start_datetime,
      data.end_datetime,
      data.attendees_count || 0 
    ];
    
    // ... eksekusi ...
    if (typeof db.execute === 'function') {
        const [result] = await db.execute(sql, params);
        return result;
      }
      const [result] = await db.query(sql, params);
      return result;
  },

  // --- TAMBAHKAN INI ---
  async getAllBookings() {
  const sql = `
    SELECT 
      b.id,
      b.start_datetime,
      b.end_datetime,
      b.status,
      b.approved_at,
      b.description,        
      b.penanggung_jawab,   
      b.attendees_count,  
      u.NIM,
      u.name as user_name,
      r.name as room_name,
      r.gedung,             
      admin.name as admin_name
    FROM bookings b
    JOIN users u ON b.requester_id = u.id
    JOIN rooms r ON b.room_id = r.id
    LEFT JOIN users admin ON b.approved_by = admin.id
    ORDER BY b.created_at DESC
  `;
  return await query(sql);
},

  async updateStatus(bookingId, status, adminId) {
    // Kita update status, approved_by (ID Admin), dan approved_at (Waktu Sekarang)
    const sql = `
      UPDATE bookings 
      SET 
        status = ?, 
        approved_by = ?, 
        approved_at = NOW() 
      WHERE id = ?
    `;
    return await query(sql, [status, adminId, bookingId]);
  },

  async getBookingsByUserId(userId) {
     // ... kode lama ...
     const sql = `
      SELECT 
        b.id,
        b.room_id,
        b.penanggung_jawab,
        b.description as purpose,
        b.start_datetime,
        b.end_datetime,
        b.attendees_count as participants,
        b.status as db_status,
        b.created_at, 
        r.name as room_name,
        r.gedung,
        r.nomor_ruang,
        (
          SELECT filename 
          FROM room_photos rp 
          WHERE rp.room_id = r.id AND rp.is_main = 1 
          LIMIT 1
        ) as room_image
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.requester_id = ?
      ORDER BY b.created_at DESC 
    `;
    return await query(sql, [userId]);
  }
};