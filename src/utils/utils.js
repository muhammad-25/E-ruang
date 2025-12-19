// FILE: src/utils/utils.js
module.exports = {
  /**
   * @param {Object} filters - object dari req.query (search, gedung, kapasitas)
   */
  buildRoomFilters(filters) {
    let whereClause = "";
    const params = [];
    if (filters.search) {
      whereClause += " AND (name LIKE ? OR deskripsi LIKE ?)";
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.gedung && filters.gedung !== 'Gedung') {
      whereClause += " AND gedung = ?";
      params.push(filters.gedung);
    }

    if (filters.kapasitas && filters.kapasitas !== 'Kapasitas') {
      if (filters.kapasitas === '<= 20') {
        whereClause += " AND capacity <= 20";
      } else if (filters.kapasitas === '21 - 50') {
        whereClause += " AND capacity BETWEEN 21 AND 50";
      } else if (filters.kapasitas === '> 50') {
        whereClause += " AND capacity > 50";
      }
    }

    return { whereClause, params };
  }
};