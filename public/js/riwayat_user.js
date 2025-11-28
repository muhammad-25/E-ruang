// --- DATA ---

const mockBookings = [
    {
        id: "1",
        roomName: "Ruang Rapat Utama",
        roomImage: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWV0aW5nJTIwcm9vbXxlbnwxfHx8fDE3NjMwMjg5MDR8MA&ixlib=rb-4.1.0&q=80&w=1080",
        location: "Gedung A, Lantai 3",
        date: "15 Nov 2025",
        time: "09:00 - 11:00",
        duration: "2 jam",
        purpose: "Presentasi Proyek Q4",
        status: "upcoming",
        participants: 12
    },
    {
        id: "2",
        roomName: "Ruang Konferensi B",
        roomImage: "https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25mZXJlbmNlJTIwcm9vbXxlbnwxfHx8fDE3NjMwMTI1MzR8MA&ixlib=rb-4.1.0&q=80&w=1080",
        location: "Gedung B, Lantai 2",
        date: "13 Nov 2025",
        time: "14:00 - 16:00",
        duration: "2 jam",
        purpose: "Workshop Tim Marketing",
        status: "ongoing",
        participants: 8
    },
    {
        id: "3",
        roomName: "Ruang Diskusi 101",
        roomImage: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBzcGFjZXxlbnwxfHx8fDE3NjMwMjUzMTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
        location: "Gedung C, Lantai 1",
        date: "10 Nov 2025",
        time: "10:00 - 12:00",
        duration: "2 jam",
        purpose: "Brainstorming Produk Baru",
        status: "completed",
        participants: 6
    },
    {
        id: "4",
        roomName: "Ruang Training A",
        roomImage: "https://images.unsplash.com/photo-1611074182055-4ac85bad8bb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGFzc3Jvb20lMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjMwMjg5MDV8MA&ixlib=rb-4.1.0&q=80&w=1080",
        location: "Gedung A, Lantai 2",
        date: "08 Nov 2025",
        time: "13:00 - 17:00",
        duration: "4 jam",
        purpose: "Pelatihan Software Development",
        status: "completed",
        participants: 20
    },
    {
        id: "5",
        roomName: "Ruang Meeting Eksekutif",
        roomImage: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWV0aW5nJTIwcm9vbXxlbnwxfHx8fDE3NjMwMjg5MDR8MA&ixlib=rb-4.1.0&q=80&w=1080",
        location: "Gedung A, Lantai 5",
        date: "05 Nov 2025",
        time: "15:00 - 16:00",
        duration: "1 jam",
        purpose: "Rapat Direksi",
        status: "cancelled",
        participants: 5
    },
    {
        id: "6",
        roomName: "Ruang Kreativitas",
        roomImage: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBzcGFjZXxlbnwxfHx8fDE3NjMwMjUzMTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
        location: "Gedung B, Lantai 1",
        date: "02 Nov 2025",
        time: "09:00 - 12:00",
        duration: "3 jam",
        purpose: "Design Sprint",
        status: "completed",
        participants: 10
    }
];

// Mapping status ke class CSS yang kita buat
const statusConfig = {
    completed: { label: "Selesai", className: "badge-completed" },
    ongoing: { label: "Berlangsung", className: "badge-ongoing" },
    cancelled: { label: "Dibatalkan", className: "badge-cancelled" },
    upcoming: { label: "Akan Datang", className: "badge-upcoming" }
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

function renderBadge(status) {
    const config = statusConfig[status];
    return `<div class="badge ${config.className}">
        ${config.label}
    </div>`;
}

function renderTimelineItem(booking, index, total) {
    const isLast = index === total - 1;
    // Gunakan class CSS .timeline-line
    const line = !isLast ? `<div class="timeline-line"></div>` : '';

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
                                ${renderBadge(booking.status)}
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
                        ${renderBadge(booking.status)}
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
    // Filter logic
    const filtered = mockBookings.filter(booking => {
        const matchesSearch = booking.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                booking.purpose.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "all" || booking.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Empty state check
    if (filtered.length === 0) {
        container.innerHTML = '';
        container.className = ''; // Remove layout classes
        emptyState.classList.add('show');
        return;
    } else {
        emptyState.classList.remove('show');
    }

    // Render view logic
    if (currentView === 'timeline') {
        container.className = 'timeline-layout';
        container.innerHTML = filtered.map((b, i) => renderTimelineItem(b, i, filtered.length)).join('');
    } else {
        container.className = 'grid-layout';
        container.innerHTML = filtered.map(b => renderGridItem(b)).join('');
    }

    // Re-initialize icons
    lucide.createIcons();
}

function setView(view) {
    currentView = view;
    
    // Toggle Active Classes
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
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderBookings();
});

statusFilter.addEventListener('change', (e) => {
    filterStatus = e.target.value;
    renderBookings();
});

// --- INITIAL RENDER ---
lucide.createIcons();
renderBookings();
