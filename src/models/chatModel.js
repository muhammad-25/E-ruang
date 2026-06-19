const pool = require('../../database');

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function columnExists(tableName, columnName) {
  const rows = await query(
    `
      SELECT COUNT(*) AS total
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [tableName, columnName]
  );

  return rows[0] && rows[0].total > 0;
}

function normalizeLimit(limit, fallback = 100, max = 200) {
  const parsed = Number.parseInt(limit, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

const ChatModel = {
  async ensureSchema() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_threads (
        id BIGINT(20) NOT NULL AUTO_INCREMENT,
        user_id INT(11) NOT NULL,
        admin_id INT(11) DEFAULT NULL,
        status ENUM('open','closed') NOT NULL DEFAULT 'open',
        last_message_at DATETIME DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_chat_threads_user (user_id),
        KEY idx_chat_threads_admin (admin_id),
        KEY idx_chat_threads_status (status),
        KEY idx_chat_threads_last_message (last_message_at),
        CONSTRAINT chat_threads_user_fk
          FOREIGN KEY (user_id) REFERENCES users (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT chat_threads_admin_fk
          FOREIGN KEY (admin_id) REFERENCES users (id)
          ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    if (!(await columnExists('chat_threads', 'last_message_at'))) {
      await pool.query(`
        ALTER TABLE chat_threads
        ADD COLUMN last_message_at DATETIME DEFAULT NULL AFTER status
      `);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id BIGINT(20) NOT NULL AUTO_INCREMENT,
        thread_id BIGINT(20) NOT NULL,
        sender_id INT(11) NOT NULL,
        message_text TEXT NOT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        read_at DATETIME DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_chat_messages_thread_time (thread_id, created_at),
        KEY idx_chat_messages_sender (sender_id),
        KEY idx_chat_messages_unread (thread_id, is_read, created_at),
        CONSTRAINT chat_messages_thread_fk
          FOREIGN KEY (thread_id) REFERENCES chat_threads (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT chat_messages_sender_fk
          FOREIGN KEY (sender_id) REFERENCES users (id)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
  },

  async getAdminUserId() {
    const rows = await query(
      'SELECT id FROM users WHERE role_id = 1 ORDER BY id ASC LIMIT 1'
    );
    return rows[0] ? rows[0].id : null;
  },

  async getThreadById(threadId) {
    const rows = await query(
      `
        SELECT
          t.id,
          t.user_id,
          t.admin_id,
          t.status,
          t.last_message_at,
          t.created_at,
          t.updated_at,
          u.name AS user_name,
          u.email AS user_email,
          u.NIM AS user_nim,
          admin.name AS admin_name
        FROM chat_threads t
        JOIN users u ON u.id = t.user_id
        LEFT JOIN users admin ON admin.id = t.admin_id
        WHERE t.id = ?
        LIMIT 1
      `,
      [threadId]
    );

    return rows[0] || null;
  },

  async getThreadByUserId(userId) {
    const rows = await query(
      `
        SELECT
          t.id,
          t.user_id,
          t.admin_id,
          t.status,
          t.last_message_at,
          t.created_at,
          t.updated_at,
          u.name AS user_name,
          u.email AS user_email,
          u.NIM AS user_nim,
          admin.name AS admin_name
        FROM chat_threads t
        JOIN users u ON u.id = t.user_id
        LEFT JOIN users admin ON admin.id = t.admin_id
        WHERE t.user_id = ?
        LIMIT 1
      `,
      [userId]
    );

    return rows[0] || null;
  },

  async getOrCreateThreadForUser(userId, adminId = null) {
    const [result] = await pool.query(
      `
        INSERT INTO chat_threads (user_id, admin_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
          id = LAST_INSERT_ID(id),
          admin_id = IF(admin_id IS NULL, VALUES(admin_id), admin_id)
      `,
      [userId, adminId]
    );

    return this.getThreadById(result.insertId);
  },

  async assignAdmin(threadId, adminId) {
    await pool.query(
      `
        UPDATE chat_threads
        SET admin_id = IF(admin_id IS NULL, ?, admin_id)
        WHERE id = ?
      `,
      [adminId, threadId]
    );

    return this.getThreadById(threadId);
  },

  async createMessage({ threadId, senderId, messageText }) {
    const text = String(messageText || '').trim();
    if (!text) {
      throw new Error('Pesan tidak boleh kosong.');
    }

    const [result] = await pool.query(
      `
        INSERT INTO chat_messages (thread_id, sender_id, message_text, is_read)
        VALUES (?, ?, ?, 0)
      `,
      [threadId, senderId, text]
    );

    await pool.query(
      `
        UPDATE chat_threads
        SET last_message_at = NOW(), updated_at = NOW()
        WHERE id = ?
      `,
      [threadId]
    );

    return this.getMessageById(result.insertId);
  },

  async getMessageById(messageId) {
    const rows = await query(
      `
        SELECT
          m.id,
          m.thread_id,
          m.sender_id,
          sender.role_id AS sender_role_id,
          sender.name AS sender_name,
          m.message_text,
          m.is_read,
          m.read_at,
          m.created_at,
          m.updated_at
        FROM chat_messages m
        JOIN users sender ON sender.id = m.sender_id
        WHERE m.id = ?
        LIMIT 1
      `,
      [messageId]
    );

    return rows[0] || null;
  },

  async listMessages(threadId, limit = 100) {
    const safeLimit = normalizeLimit(limit);

    return query(
      `
        SELECT
          m.id,
          m.thread_id,
          m.sender_id,
          sender.role_id AS sender_role_id,
          sender.name AS sender_name,
          m.message_text,
          m.is_read,
          m.read_at,
          m.created_at,
          m.updated_at
        FROM chat_messages m
        JOIN users sender ON sender.id = m.sender_id
        WHERE m.thread_id = ?
        ORDER BY m.created_at ASC, m.id ASC
        LIMIT ?
      `,
      [threadId, safeLimit]
    );
  },

  async listConversationsForAdmin(adminId) {
    return query(
      `
        SELECT
          t.id,
          t.user_id,
          t.admin_id,
          t.status,
          t.last_message_at,
          t.created_at,
          t.updated_at,
          u.name AS user_name,
          u.email AS user_email,
          u.NIM AS user_nim,
          admin.name AS admin_name,
          lm.message_text AS last_message_text,
          lm.sender_id AS last_sender_id,
          lm.created_at AS last_message_created_at,
          COALESCE(unread.unread_count, 0) AS unread_count
        FROM chat_threads t
        JOIN users u ON u.id = t.user_id
        LEFT JOIN users admin ON admin.id = t.admin_id
        LEFT JOIN (
          SELECT m1.*
          FROM chat_messages m1
          JOIN (
            SELECT thread_id, MAX(id) AS last_id
            FROM chat_messages
            GROUP BY thread_id
          ) last_msg ON last_msg.last_id = m1.id
        ) lm ON lm.thread_id = t.id
        LEFT JOIN (
          SELECT thread_id, COUNT(*) AS unread_count
          FROM chat_messages
          WHERE sender_id <> ? AND is_read = 0
          GROUP BY thread_id
        ) unread ON unread.thread_id = t.id
        ORDER BY COALESCE(t.last_message_at, t.updated_at, t.created_at) DESC
      `,
      [adminId]
    );
  },

  async getUnreadCount(threadId, viewerId) {
    const rows = await query(
      `
        SELECT COUNT(*) AS total
        FROM chat_messages
        WHERE thread_id = ?
          AND sender_id <> ?
          AND is_read = 0
      `,
      [threadId, viewerId]
    );

    return rows[0] ? rows[0].total : 0;
  },

  async markThreadRead(threadId, readerId) {
    const [result] = await pool.query(
      `
        UPDATE chat_messages
        SET is_read = 1, read_at = NOW()
        WHERE thread_id = ?
          AND sender_id <> ?
          AND is_read = 0
      `,
      [threadId, readerId]
    );

    return result.affectedRows || 0;
  },
};

module.exports = ChatModel;
