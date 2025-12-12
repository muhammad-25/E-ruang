// FILE: src/utils/utils.js

module.exports = {
  /**
   * Membantu menyusun klausa WHERE untuk filter ruangan
   * @param {Object} filters - object dari req.query (search, gedung, kapasitas)
   */
  buildRoomFilters(filters) {
    let whereClause = "";
    const params = [];

    // 1. Filter Search (Nama Ruang atau Deskripsi)
    if (filters.search) {
      whereClause += " AND (name LIKE ? OR deskripsi LIKE ?)";
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    // 2. Filter Gedung
    // Pastikan value tidak kosong dan bukan string "Gedung" (default option)
    if (filters.gedung && filters.gedung !== 'Gedung') {
      whereClause += " AND gedung = ?";
      params.push(filters.gedung);
    }

    // 3. Filter Kapasitas
    if (filters.kapasitas && filters.kapasitas !== 'Kapasitas') {
      if (filters.kapasitas === '<= 20') {
        whereClause += " AND capacity <= 20";
      } else if (filters.kapasitas === '21 - 50') {
        whereClause += " AND capacity BETWEEN 21 AND 50";
      } else if (filters.kapasitas === '> 50') {
        whereClause += " AND capacity > 50";
      }
    }

    // 4. Filter Waktu (Opsional, logika lebih kompleks jika melibatkan booking)
    // Untuk saat ini kita skip dulu karena butuh join ke tabel booking/schedule
    
    return { whereClause, params };
  }
};