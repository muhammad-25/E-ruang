const pool = require('../../database');

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

const ReviewModel = {
  async ensureSchema() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS room_reviews (
        id INT(11) NOT NULL AUTO_INCREMENT,
        booking_id INT(11) NOT NULL,
        room_id INT(11) NOT NULL,
        user_id INT(11) NOT NULL,
        rating TINYINT UNSIGNED NOT NULL,
        comment TEXT NOT NULL,
        is_visible TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_room_reviews_booking (booking_id),
        KEY idx_room_reviews_room_visible (room_id, is_visible, created_at),
        KEY idx_room_reviews_user (user_id),
        CONSTRAINT room_reviews_booking_fk
          FOREIGN KEY (booking_id) REFERENCES bookings (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT room_reviews_room_fk
          FOREIGN KEY (room_id) REFERENCES rooms (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT room_reviews_user_fk
          FOREIGN KEY (user_id) REFERENCES users (id)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
  },

  async listVisibleByRoom(roomId) {
    await this.ensureSchema();
    return query(
      `
        SELECT
          rr.id,
          rr.rating,
          rr.comment,
          rr.created_at,
          u.name AS user_name
        FROM room_reviews rr
        JOIN users u ON u.id = rr.user_id
        WHERE rr.room_id = ?
          AND rr.is_visible = 1
        ORDER BY rr.created_at DESC
      `,
      [roomId]
    );
  },

  async getRoomSummary(roomId) {
    await this.ensureSchema();
    const rows = await query(
      `
        SELECT
          COUNT(*) AS total_reviews,
          COALESCE(AVG(rating), 0) AS average_rating
        FROM room_reviews
        WHERE room_id = ?
          AND is_visible = 1
      `,
      [roomId]
    );

    return rows[0] || { total_reviews: 0, average_rating: 0 };
  },

  async listEligibleBookings(userId, roomId) {
    await this.ensureSchema();
    return query(
      `
        SELECT
          b.id,
          b.start_datetime,
          b.end_datetime,
          b.penanggung_jawab
        FROM bookings b
        LEFT JOIN room_reviews rr ON rr.booking_id = b.id
        WHERE b.requester_id = ?
          AND b.room_id = ?
          AND b.status = 'approved'
          AND b.end_datetime <= NOW()
          AND rr.id IS NULL
        ORDER BY b.end_datetime DESC
      `,
      [userId, roomId]
    );
  },

  async getReviewableBooking({ bookingId, roomId, userId }) {
    await this.ensureSchema();
    const rows = await query(
      `
        SELECT b.id
        FROM bookings b
        LEFT JOIN room_reviews rr ON rr.booking_id = b.id
        WHERE b.id = ?
          AND b.room_id = ?
          AND b.requester_id = ?
          AND b.status = 'approved'
          AND b.end_datetime <= NOW()
          AND rr.id IS NULL
        LIMIT 1
      `,
      [bookingId, roomId, userId]
    );

    return rows[0] || null;
  },

  async create({ bookingId, roomId, userId, rating, comment }) {
    await this.ensureSchema();
    const [result] = await pool.query(
      `
        INSERT INTO room_reviews (booking_id, room_id, user_id, rating, comment)
        VALUES (?, ?, ?, ?, ?)
      `,
      [bookingId, roomId, userId, rating, comment]
    );

    return result;
  },

  async listAll() {
    await this.ensureSchema();
    return query(`
      SELECT
        rr.id,
        rr.rating,
        rr.comment,
        rr.is_visible,
        rr.created_at,
        u.name AS user_name,
        u.NIM AS user_nim,
        r.name AS room_name,
        r.gedung,
        b.start_datetime,
        b.end_datetime
      FROM room_reviews rr
      JOIN users u ON u.id = rr.user_id
      JOIN rooms r ON r.id = rr.room_id
      JOIN bookings b ON b.id = rr.booking_id
      ORDER BY rr.created_at DESC
    `);
  },

  async updateVisibility(reviewId, isVisible) {
    await this.ensureSchema();
    const [result] = await pool.query(
      'UPDATE room_reviews SET is_visible = ?, updated_at = NOW() WHERE id = ?',
      [isVisible ? 1 : 0, reviewId]
    );
    return result;
  },

  async delete(reviewId) {
    await this.ensureSchema();
    const [result] = await pool.query('DELETE FROM room_reviews WHERE id = ?', [reviewId]);
    return result;
  }
};

module.exports = ReviewModel;
