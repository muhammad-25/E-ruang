// FILE: models/bookingModel.js
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
  // Cek ketersediaan (Logika Overlap)
  async checkAvailability(roomId, startDateTime, endDateTime) {
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

  // --- PERBAIKAN DI SINI ---
  async createBooking(data) {
    // Pastikan nama kolom sesuai standar (penanggung_jawab) 
    // Hapus tanda strip (-) dan backtick jika kolom di DB Anda menggunakan underscore
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
      data.attendees_count || 0 // Default 0 jika capacity undefined
    ];

    console.log("Menjalankan Query Insert Booking:", sql); // Debugging Log
    console.log("Parameter:", params); // Debugging Log

    if (typeof db.execute === 'function') {
      const [result] = await db.execute(sql, params);
      return result;
    }
    const [result] = await db.query(sql, params);
    return result;
  },
  async getBookingsByUserId(userId) {
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
        b.created_at,  -- (Opsional) Ambil ini jika ingin menampilkan kapan dibuat
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
      ORDER BY b.created_at DESC  -- <--- UBAH DI SINI (Terbaru dibuat ada di atas)
    `;
    return await query(sql, [userId]);
  }
};