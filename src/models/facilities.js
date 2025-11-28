// -----------------------------
// FILE: models/facilities.js
// Model untuk tabel `facilities` (master list of facilities)

// reuse query helper

const db = require('../../database'); 

module.exports = {
  async listFacilities() {
    return await query('SELECT * FROM facilities ORDER BY name ASC');
  },

  async getFacilityById(id) {
    const rows = await query('SELECT * FROM facilities WHERE id = ? LIMIT 1', [id]);
    return rows && rows.length ? rows[0] : null;
  },

  // data: { name, description }
  async createFacility(data) {
    const sql = 'INSERT INTO facilities (name, description, created_at) VALUES (?, ?, NOW())';
    const params = [data.name || null, data.description || null];
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
    const allowed = ['name','description'];
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(data, k)) {
        sets.push(`${k} = ?`);
        params.push(data[k]);
      }
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
