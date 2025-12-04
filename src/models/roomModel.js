// Model untuk tabel `rooms` dari database e-ruang (MySQL).
// Fungsi yang ada:
//  - listRooms()            -> ambil semua ruangan
//  - getRoomById(id)        -> ambil 1 ruangan berdasarkan id
//  - createRoom(data)       -> tambah ruangan baru
//  - updateRoom(id, data)   -> edit ruangan
//  - deleteRoom(id)         -> hapus ruangan (hard delete)
//  - softDeleteRoom(id)     -> non-aktifkan ruangan (set is_active = 0)


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
  async listRooms({ onlyActive = false } = {}) {
    let sql = 'SELECT * FROM rooms';
    const params = [];
    if (onlyActive) {
      sql += ' WHERE is_active = 1';
    }
    sql += ' ORDER BY name ASC';
    return await query(sql, params);
  },

  async getRoomById(id) {
    const sql = 'SELECT * FROM rooms WHERE id = ? LIMIT 1';
    const rows = await query(sql, [id]);
    return rows && rows.length ? rows[0] : null;
  },

  // Tambah ruangan baru
  async createRoom(data) {
    const sql = `INSERT INTO rooms
      (code, name, gedung, nomor_ruang, deskripsi, capacity, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
    const params = [
      data.code || null,
      data.name || null,
      data.gedung || null,
      data.nomor_ruang || null,
      data.deskripsi || null,
      Number.isInteger(data.capacity) ? data.capacity : 0,
      typeof data.is_active === 'number' || typeof data.is_active === 'boolean' ? Number(data.is_active) : 1
    ];
    if (typeof db.execute === 'function') {
      const [result] = await db.execute(sql, params);
      return { insertId: result.insertId, affectedRows: result.affectedRows };
    }
    const [result] = await db.query(sql, params);
    return { insertId: result.insertId, affectedRows: result.affectedRows };
  },

  // Edit ruangan
  async updateRoom(id, data) {
    const sql = `UPDATE rooms SET
      code = ?,
      name = ?,
      gedung = ?,
      nomor_ruang = ?,
      deskripsi = ?,
      capacity = ?,
      is_active = ?,
      updated_at = NOW()
      WHERE id = ?`;

    const params = [
      data.code || null,
      data.name || null,
      data.gedung || null,
      data.nomor_ruang || null,
      data.deskripsi || null,
      Number.isInteger(data.capacity) ? data.capacity : 0,
      typeof data.is_active === 'number' || typeof data.is_active === 'boolean' ? Number(data.is_active) : 1,
      id
    ];

    if (typeof db.execute === 'function') {
      const [result] = await db.execute(sql, params);
      return { affectedRows: result.affectedRows };
    }
    const [result] = await db.query(sql, params);
    return { affectedRows: result.affectedRows };
  },

  async updateRoomPartial(id, data) {
    const allowed = ['code','name','gedung','nomor_ruang','deskripsi','capacity','is_active'];
    const sets = [];
    const params = [];
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(data, k)) {
        sets.push(`${k} = ?`);
        if (k === 'capacity') params.push(Number.isInteger(data[k]) ? data[k] : 0);
        else if (k === 'is_active') params.push(Number(data[k]));
        else params.push(data[k]);
      }
    }
    if (!sets.length) return { affectedRows: 0 };
    const sql = `UPDATE rooms SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`;
    params.push(id);
    if (typeof db.execute === 'function') {
      const [result] = await db.execute(sql, params);
      return { affectedRows: result.affectedRows };
    }
    const [result] = await db.query(sql, params);
    return { affectedRows: result.affectedRows };
  },

  // Hapus ruangan (hard delete)
  // FILE: src/models/roomModel.js

// ... kode atas ...

  // Hapus ruangan (hard delete) diperbarui
  async deleteRoom(id) {
    // 1. Hapus Booking dulu (PENTING: Ini yang bikin error)
    await query('DELETE FROM bookings WHERE room_id = ?', [id]);
    
    // 2. Hapus Jadwal
    await query('DELETE FROM room_schedules WHERE room_id = ?', [id]);
    
    // 3. Hapus Foto
    await query('DELETE FROM room_photos WHERE room_id = ?', [id]);
    
    // 4. Hapus Relasi Fasilitas
    await query('DELETE FROM room_facilities WHERE room_id = ?', [id]);

    // 5. Baru hapus Ruangannya
    const sql = 'DELETE FROM rooms WHERE id = ?';
    
    if (typeof db.execute === 'function') {
      const [result] = await db.execute(sql, [id]);
      return { affectedRows: result.affectedRows };
    }
    const [result] = await db.query(sql, [id]);
    return { affectedRows: result.affectedRows };
  },


  // Soft delete: set is_active = 0
  async softDeleteRoom(id) {
    const sql = 'UPDATE rooms SET is_active = 0, updated_at = NOW() WHERE id = ?';
    if (typeof db.execute === 'function') {
      const [result] = await db.execute(sql, [id]);
      return { affectedRows: result.affectedRows };
    }
    const [result] = await db.query(sql, [id]);
    return { affectedRows: result.affectedRows };
  }
};

