
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

  async createBooking(data) {
 
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

    if (typeof db.execute === 'function') {
        const [result] = await db.execute(sql, params);
        return result;
      }
      const [result] = await db.query(sql, params);
      return result;
  },

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

  async getDashboardStats() {

  const sqlMonth = `SELECT COUNT(*) as total FROM bookings WHERE MONTH(start_datetime) = MONTH(NOW()) AND YEAR(start_datetime) = YEAR(NOW())`;
  

  const sqlPending = `SELECT COUNT(*) as total FROM bookings WHERE status = 'pending'`;
  

  const sqlRooms = `SELECT COUNT(*) as total FROM rooms WHERE is_active = 1`;

  const [resMonth] = await query(sqlMonth);
  const [resPending] = await query(sqlPending);
  const [resRooms] = await query(sqlRooms);

  return {
    totalMonth: resMonth.total,
    totalPending: resPending.total,
    totalAvailableRooms: resRooms.total
  };
},

async getRecentPendingBookings(limit = 5) {
    const sql = `
    SELECT 
      b.id, b.start_datetime, b.end_datetime, b.status,
      u.name as user_name, r.name as room_name
    FROM bookings b
    JOIN users u ON b.requester_id = u.id
    JOIN rooms r ON b.room_id = r.id
    WHERE b.status = 'pending'
    ORDER BY b.created_at DESC
    LIMIT ?
    `;
    return await query(sql, [limit]);
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