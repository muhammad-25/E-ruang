// -----------------------------
// FILE: models/facilities.js
// Model untuk tabel `facilities` (master list of facilities)

const db = require('../../database'); 

// 1. Tambahkan Helper Query (Penting agar tidak error "query is not defined")
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
  async listFacilities() {
    // FIX: Mengganti 'ORDER BY name' menjadi 'ORDER BY nama'
    return await query('SELECT * FROM facilities ORDER BY nama ASC');
  },

  async getFacilityById(id) {
    const rows = await query('SELECT * FROM facilities WHERE id = ? LIMIT 1', [id]);
    return rows && rows.length ? rows[0] : null;
  },

  // data: { name, description }
  async createFacility(data) {
    // FIX: Mengganti kolom insert '(name, ...)' menjadi '(nama, ...)'
    const sql = 'INSERT INTO facilities (nama, description, created_at) VALUES (?, ?, NOW())';
    // Kita tetap terima input 'data.name' dari controller, tapi masukkan ke kolom 'nama'
    const params = [data.name || data.nama || null, data.description || null];
    
    if (typeof db.execute === 'function') {
      const [result] = await db.execute(sql, params);
      return { insertId: result.insertId, affectedRows: result.affectedRows };
    }
    const [result] = await db.query(sql, params);
    return { insertId: result.insertId, affectedRows: result.affectedRows };
  },

  async updateFacility(id, data) {
    const sets = [];
    const params = [];
    
    // Cek input 'name' atau 'nama'
    if (data.name !== undefined || data.nama !== undefined) {
        sets.push('nama = ?'); // FIX: update kolom 'nama'
        params.push(data.name || data.nama);
    }
    
    if (data.description !== undefined) {
        sets.push('description = ?');
        params.push(data.description);
    }

    if (!sets.length) return { affectedRows: 0 };
    
    const sql = `UPDATE facilities SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`;
    params.push(id);
    
    if (typeof db.execute === 'function') {
      const [result] = await db.execute(sql, params);
      return { affectedRows: result.affectedRows };
    }
    const [result] = await db.query(sql, params);
    return { affectedRows: result.affectedRows };
  },

  async deleteFacility(id) {
    const sql = 'DELETE FROM facilities WHERE id = ?';
    if (typeof db.execute === 'function') {
      const [result] = await db.execute(sql, [id]);
      return { affectedRows: result.affectedRows };
    }
    const [result] = await db.query(sql, [id]);
    return { affectedRows: result.affectedRows };
  }
};