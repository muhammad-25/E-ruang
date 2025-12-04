document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi Icon Lucide
    lucide.createIcons(); 
});

// === LOGIKA PENCARIAN CLIENT SIDE ===
const searchInput = document.getElementById('searchInput');
const tableBody = document.getElementById('roomTableBody');
// Ambil semua baris yang memiliki class 'room-row'
const rows = document.querySelectorAll('.room-row');

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    let visibleCount = 0;

    rows.forEach(row => {
        // Ambil teks nama ruangan di dalam baris ini
        const roomNameEl = row.querySelector('.room-name');
        const roomTypeEl = row.querySelector('.room-type');
        
        const text = (roomNameEl.textContent + " " + roomTypeEl.textContent).toLowerCase();

        if (text.includes(searchTerm)) {
            row.style.display = ''; // Tampilkan
            visibleCount++;
        } else {
            row.style.display = 'none'; // Sembunyikan
        }
    });

    // Update teks jumlah data
    const showingText = document.getElementById('showingText');
    if(showingText) showingText.textContent = `Menampilkan ${visibleCount} data`;
});


// === LOGIKA DELETE KE SERVER ===
async function deleteRoom(id) {
    if (confirm('Apakah Anda yakin ingin menghapus ruangan ini dari database?')) {
        try {
            const response = await fetch(`/admin/room/delete/${id}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                alert('Ruangan berhasil dihapus.');
                window.location.reload(); // Refresh halaman
            } else {
                alert('Gagal menghapus: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan koneksi.');
        }
    }
}