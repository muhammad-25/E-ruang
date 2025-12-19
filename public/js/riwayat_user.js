const mockBookings = window.serverBookingsData || [];

// 1. UPDATE CONFIG: Tambahkan status pending, approved, rejected
const statusConfig = {
    // Status berdasarkan Waktu
    completed: { label: "Selesai", className: "badge-completed" },
    ongoing:   { label: "Sedang Berlangsung", className: "badge-ongoing" },
    
    // Status berdasarkan Database (Prioritas)
    pending:   { label: "Menunggu Konfirmasi", className: "badge-pending" }, // Kuning
    approved:  { label: "Disetujui", className: "badge-approved" },          // Teal/Hijau
    rejected:  { label: "Ditolak", className: "badge-rejected" },            // Merah
    cancelled: { label: "Dibatalkan", className: "badge-cancelled" },        // Merah
    
    // Fallback
    upcoming:  { label: "Akan Datang", className: "badge-upcoming" }
};

// --- STATE & VARIABLES ---
let currentView = 'timeline';
let searchQuery = '';
let filterStatus = 'all';

// --- ELEMENTS ---
const container = document.getElementById('bookings-container');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const btnTimeline = document.getElementById('btn-timeline');
const btnGrid = document.getElementById('btn-grid');

// --- FUNCTIONS ---

/**
 * Logika Utama Penentuan Status:
 * Menggabungkan status database (dbStatus) dan status waktu (status frontend)
 */
function getDisplayStatus(booking) {
    // 1. Jika status DB adalah Rejected/Cancelled, tampilkan itu langsung
    if (booking.dbStatus === 'rejected') return 'rejected';
    if (booking.dbStatus === 'cancelled') return 'cancelled';

    // 2. Jika status DB masih Pending, tampilkan "Menunggu Konfirmasi" (abaikan waktu)
    if (booking.dbStatus === 'pending') return 'pending';

    // 3. Jika status DB Approved:
    if (booking.dbStatus === 'approved') {
        // Cek waktu dari controller (upcoming/ongoing/completed)
        if (booking.status === 'completed') return 'completed';
        if (booking.status === 'ongoing') return 'ongoing';
        
        // Jika belum mulai dan sudah diapprove -> "Disetujui"
        return 'approved'; 
    }

    // Default fallback
    return booking.status || 'upcoming';
}

function renderBadge(displayStatusKey) {
    const config = statusConfig[displayStatusKey] || statusConfig['upcoming'];
    return `<div class="badge ${config.className}">
        ${config.label}
    </div>`;
}

function renderTimelineItem(booking, index, total) {
    const isLast = index === total - 1;
    const line = !isLast ? `<div class="timeline-line"></div>` : '';
    
    // Hitung status yang akan ditampilkan
    const displayStatus = getDisplayStatus(booking);

    return `
        <div class="relative">
            ${line}
            <div class="card">
                <div class="p-0">
                    <div class="flex flex-col md-row gap-0">
                        <div class="timeline-date-box md-w-48">
                            <div class="timeline-dot hidden md-block"></div>
                            <i data-lucide="calendar" class="w-8 h-8 mb-2 opacity-80"></i>
                            <div class="text-center">
                                <div class="opacity-90 text-sm">Tanggal</div>
                                <div class="mb-1 font-medium">${booking.date}</div>
                            </div>
                        </div>

                        <div class="card-image-container">
                            <img src="${booking.roomImage}" alt="${booking.roomName}" class="card-image">
                        </div>

                        <div class="p-6" style="flex: 1;">
                            <div class="flex items-center justify-between mb-4">
                                <div>
                                    <h3 class="text-lg font-semibold mb-1">${booking.roomName}</h3>
                                    <p style="color: var(--color-slate-600);">${booking.purpose}</p>
                                </div>
                                <div class="absolute" style="top: 0.75rem; right: 0.75rem;">
                                    ${renderBadge(displayStatus)}
                                </div>                                
                            </div>

                            <div class="grid-2-col-responsive">
                                <div class="detail-row">
                                    <div class="icon-circle bg-blue-100">
                                        <i data-lucide="map-pin" class="w-5 h-5 text-blue-600"></i>
                                    </div>
                                    <div>
                                        <div class="text-xs" style="color: var(--color-slate-500);">Lokasi</div>
                                        <div class="text-sm font-medium">${booking.location}</div>
                                    </div>
                                </div>

                                <div class="detail-row">
                                    <div class="icon-circle bg-green-100">
                                        <i data-lucide="clock" class="w-5 h-5 text-green-600"></i>
                                    </div>
                                    <div>
                                        <div class="text-xs" style="color: var(--color-slate-500);">Waktu</div>
                                        <div class="text-sm font-medium">${booking.time}</div>
                                    </div>
                                </div>

                                <div class="detail-row">
                                    <div class="icon-circle bg-purple-100">
                                        <i data-lucide="user" class="w-5 h-5 text-purple-600"></i>
                                    </div>
                                    <div>
                                        <div class="text-xs" style="color: var(--color-slate-500);">Peserta</div>
                                        <div class="text-sm font-medium">${booking.participants} orang</div>
                                    </div>
                                </div>

                                <div class="detail-row">
                                    <div class="icon-circle bg-orange-100">
                                        <i data-lucide="calendar-days" class="w-5 h-5 text-orange-600"></i>
                                    </div>
                                    <div>
                                        <div class="text-xs" style="color: var(--color-slate-500);">Durasi</div>
                                        <div class="text-sm font-medium">${booking.duration}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderGridItem(booking) {
    const displayStatus = getDisplayStatus(booking);

    return `
        <div class="card group">
            <div class="p-0">
                <div class="relative card-image-container" style="height: 12rem;">
                    <img src="${booking.roomImage}" alt="${booking.roomName}" class="card-image">
                    <div class="absolute" style="inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.2), transparent);"></div>
                    
                    <div class="absolute" style="bottom: 1rem; left: 1rem; right: 1rem;">
                        <h3 class="font-semibold text-lg" style="color: white; margin-bottom: 0.25rem;">${booking.roomName}</h3>
                        <p class="text-sm" style="color: rgba(255,255,255,0.9);">${booking.location}</p>
                    </div>
                    <div class="absolute" style="top: 0.75rem; right: 0.75rem;">
                        ${renderBadge(displayStatus)}
                    </div>
                </div>

                <div class="p-5" style="display: flex; flex-direction: column; gap: 1rem;">
                    <p class="font-medium" style="color: #334155;">${booking.purpose}</p>

                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <div class="flex items-center gap-2 text-sm" style="color: var(--color-slate-600);">
                            <i data-lucide="calendar" class="w-4 h-4 text-indigo-500"></i>
                            ${booking.date}
                        </div>
                        <div class="flex items-center gap-2 text-sm" style="color: var(--color-slate-600);">
                            <i data-lucide="clock" class="w-4 h-4 text-green-500"></i>
                            ${booking.time} (${booking.duration})
                        </div>
                        <div class="flex items-center gap-2 text-sm" style="color: var(--color-slate-600);">
                            <i data-lucide="user" class="w-4 h-4 text-purple-500"></i>
                            ${booking.participants} peserta
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderBookings() {
    const q = searchQuery.toLowerCase().trim();

    const filtered = mockBookings.filter(booking => {
        // Ambil display status untuk pencarian teks juga
        const currentStatusKey = getDisplayStatus(booking);
        const statusLabel = statusConfig[currentStatusKey].label.toLowerCase();

        // Safety check null
        const roomName = (booking.roomName || '').toLowerCase();
        const purpose = (booking.purpose || '').toLowerCase();
        const location = (booking.location || '').toLowerCase();
        const date = (booking.date || '').toLowerCase();

        const matchesSearch = 
            roomName.includes(q) || 
            purpose.includes(q) || 
            location.includes(q) || 
            date.includes(q) ||
            statusLabel.includes(q);

        // Logic Filter Dropdown
        let matchesStatus = false;
        if (filterStatus === "all") {
            matchesStatus = true;
        } else {
            // Kita cocokkan filterStatus dengan currentStatusKey
            matchesStatus = (currentStatusKey === filterStatus);
        }

        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        container.innerHTML = '';
        container.className = ''; 
        if (emptyState) emptyState.classList.add('show');
        return;
    } else {
        if (emptyState) emptyState.classList.remove('show');
    }

    if (currentView === 'timeline') {
        container.className = 'timeline-layout';
        container.innerHTML = filtered.map((b, i) => renderTimelineItem(b, i, filtered.length)).join('');
    } else {
        container.className = 'grid-layout';
        container.innerHTML = filtered.map(b => renderGridItem(b)).join('');
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function setView(view) {
    currentView = view;
    if (view === 'timeline') {
        btnTimeline.classList.add('active');
        btnGrid.classList.remove('active');
    } else {
        btnGrid.classList.add('active');
        btnTimeline.classList.remove('active');
    }
    renderBookings();
}

// --- EVENT LISTENERS ---
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderBookings();
    });
}

if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
        filterStatus = e.target.value;
        renderBookings();
    });
}

// --- INITIAL RENDER ---
if (window.lucide) window.lucide.createIcons();
renderBookings();