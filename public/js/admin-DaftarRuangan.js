// State Awal
let rooms = [
    {
        id: 1,
        name: 'Ruang Meeting Alpha',
        capacity: 10,
        type: 'Small Room',
        facilities: ['WiFi', 'Proyektor', 'Whiteboard'],
        status: 'available',
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=200'
    },
    {
        id: 2,
        name: 'Aula Utama Beta',
        capacity: 50,
        type: 'Hall',
        facilities: ['WiFi', 'Sound System', 'Panggung'],
        status: 'maintenance',
        image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=200'
    },
    {
        id: 3,
        name: 'Creative Space Gamma',
        capacity: 8,
        type: 'Creative',
        facilities: ['WiFi', 'Sofa', 'TV LED'],
        status: 'available',
        image: 'https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&q=80&w=200'
    }
];

let searchTerm = '';

// DOM Elements
const tableBody = document.getElementById('roomTableBody');
const searchInput = document.getElementById('searchInput');
const showingText = document.getElementById('showingText');

// Init
document.addEventListener('DOMContentLoaded', () => {
    renderTable();
    // This re-renders Lucide icons based on data-lucide attributes in the generated table content
    lucide.createIcons(); 
});

// Render Functions
function renderTable() {
    tableBody.innerHTML = '';
    
    const filteredRooms = rooms.filter(room => 
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        room.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredRooms.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <div class="empty-state-content">
                        <i data-lucide="search" class="w-8 h-8 text-gray-300"></i>
                        <p>Tidak ada ruangan yang ditemukan dengan kata kunci "${searchTerm}"</p>
                    </div>
                </td>
            </tr>
        `;
    } else {
        filteredRooms.forEach(room => {
            const row = document.createElement('tr');
            // Class name for hover effect defined in CSS
            row.className = ''; 
            
            // Status Badge Logic: assign specific CSS class based on status
            let statusClass, statusLabel;
            if (room.status === 'available') {
                statusClass = 'status-available';
                statusLabel = 'Tersedia';
            } else if (room.status === 'maintenance') {
                statusClass = 'status-maintenance';
                statusLabel = 'Perbaikan';
            } else {
                statusClass = 'status-default';
                statusLabel = 'Dipesan';
            }

            // Facilities Logic
            let facilitiesHtml = '';
            room.facilities.slice(0, 2).forEach(fac => {
                facilitiesHtml += `<span class="facility-badge">${fac}</span>`;
            });
            if (room.facilities.length > 2) {
                facilitiesHtml += `<span class="facility-badge facility-count">+${room.facilities.length - 2}</span>`;
            }

            // Perubahan: Tombol Edit sekarang menjadi Link <a>
            row.innerHTML = `
                <td>
                    <div class="room-info">
                        <img src="${room.image}" alt="${room.name}" class="room-image">
                        <div>
                            <div class="room-name">${room.name}</div>
                            <div class="room-type">${room.type}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="capacity-info">
                        <i data-lucide="users" class="w-4 h-4"></i>
                        <span>${room.capacity} Orang</span>
                    </div>
                </td>
                <td>
                    <div class="facilities-list">
                        ${facilitiesHtml}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusLabel}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <a href="edit-ruangan.html?id=${room.id}" class="action-button edit-button" title="Edit">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </a>
                        <button onclick="deleteRoom(${room.id})" class="action-button delete-button" title="Hapus">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    showingText.textContent = `Menampilkan ${filteredRooms.length} dari ${rooms.length} data`;
    // Re-create icons for newly generated HTML rows
    lucide.createIcons(); 
}

// Search Handler
searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    renderTable();
});

// Delete Function (Tetap dipertahankan untuk demo interaksi tabel)
function deleteRoom(id) {
    // Note: confirm() is used here for simplicity in a single-file demo, 
    // but in a production environment, a custom modal is recommended.
    if (confirm('Apakah Anda yakin ingin menghapus ruangan ini?')) {
        rooms = rooms.filter(r => r.id !== id);
        renderTable();
    }
}