
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

  async checkAvailabilityExcludingBooking(roomId, startDateTime, endDateTime, bookingId) {
    const sql = `
      SELECT id FROM bookings
      WHERE room_id = ?
      AND id <> ?
      AND status = 'approved'
      AND (
        (start_datetime < ? AND end_datetime > ?)
      )
      LIMIT 1
    `;
    const rows = await query(sql, [roomId, bookingId, endDateTime, startDateTime]);
    return rows.length > 0;
  },

  async getCalendarBookings(roomId, rangeStart, rangeEnd) {
    const sql = `
      SELECT
        b.id,
        b.status,
        b.description,
        b.penanggung_jawab,
        DATE_FORMAT(b.start_datetime, '%Y-%m-%dT%H:%i:%s') AS start_datetime,
        DATE_FORMAT(b.end_datetime, '%Y-%m-%dT%H:%i:%s') AS end_datetime,
        u.name AS requester_name
      FROM bookings b
      LEFT JOIN users u ON b.requester_id = u.id
      WHERE b.room_id = ?
        AND b.status IN ('approved', 'pending')
        AND b.start_datetime < ?
        AND b.end_datetime > ?
      ORDER BY b.start_datetime ASC
    `;

    return await query(sql, [roomId, rangeEnd, rangeStart]);
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

  async getBookingForUser(bookingId, userId) {
    const sql = `
      SELECT
        b.*,
        r.name AS room_name,
        r.gedung,
        r.nomor_ruang,
        r.capacity
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.id = ? AND b.requester_id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [bookingId, userId]);
    return rows[0] || null;
  },

  async cancelBooking(bookingId, userId) {
    const sql = `
      UPDATE bookings
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = ?
        AND requester_id = ?
        AND status IN ('pending', 'approved')
    `;
    return await query(sql, [bookingId, userId]);
  },

  async rescheduleBooking(bookingId, userId, startDateTime, endDateTime) {
    const sql = `
      UPDATE bookings
      SET
        start_datetime = ?,
        end_datetime = ?,
        status = 'pending',
        approved_by = NULL,
        approved_at = NULL,
        updated_at = NOW()
      WHERE id = ?
        AND requester_id = ?
        AND status IN ('pending', 'approved')
    `;
    const result = await query(sql, [startDateTime, endDateTime, bookingId, userId]);
    if (result && result.affectedRows > 0) {
      await query('DELETE FROM booking_reminders WHERE booking_id = ?', [bookingId]);
    }
    return result;
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
  },

  async ensureReminderSchema() {
    await query(`
      CREATE TABLE IF NOT EXISTS booking_reminders (
        id BIGINT(20) NOT NULL AUTO_INCREMENT,
        booking_id BIGINT(20) NOT NULL,
        reminder_type VARCHAR(30) NOT NULL,
        status ENUM('sent','failed') NOT NULL DEFAULT 'sent',
        message TEXT DEFAULT NULL,
        error_message TEXT DEFAULT NULL,
        sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_booking_reminders_once (booking_id, reminder_type),
        KEY idx_booking_reminders_booking (booking_id),
        KEY idx_booking_reminders_type (reminder_type),
        CONSTRAINT booking_reminders_booking_fk
          FOREIGN KEY (booking_id) REFERENCES bookings (id)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
  },

  async getBookingsNeedingReminder(reminderType, hoursBefore) {
    const sql = `
      SELECT
        b.id,
        b.requester_id,
        b.room_id,
        b.start_datetime,
        b.end_datetime,
        b.description,
        r.name AS room_name,
        r.gedung,
        r.nomor_ruang
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      LEFT JOIN booking_reminders br
        ON br.booking_id = b.id
        AND br.reminder_type = ?
      WHERE b.status = 'approved'
        AND b.start_datetime > NOW()
        AND b.start_datetime <= DATE_ADD(NOW(), INTERVAL ? HOUR)
        AND br.id IS NULL
      ORDER BY b.start_datetime ASC
      LIMIT 50
    `;
    return await query(sql, [reminderType, hoursBefore]);
  },

  async logReminder(bookingId, reminderType, status, message, errorMessage = null) {
    const sql = `
      INSERT INTO booking_reminders (
        booking_id,
        reminder_type,
        status,
        message,
        error_message,
        sent_at,
        created_at
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;
    return await query(sql, [bookingId, reminderType, status, message, errorMessage]);
  }
};
