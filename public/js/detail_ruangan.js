(function () {
  const config = window.roomCalendarConfig || {};
  const calendarEl = document.getElementById('availabilityCalendar');
  const roomSelector = document.getElementById('roomSelector');
  const loadingEl = document.getElementById('calendarLoading');
  const errorEl = document.getElementById('calendarError');
  const emptyEl = document.getElementById('calendarEmpty');
  const queryAlert = document.getElementById('queryAlert');
  const loginNotice = document.getElementById('loginNotice');
  const bookingForm = document.getElementById('bookingForm');
  const submitButton = bookingForm ? bookingForm.querySelector('.submit-booking') : null;
  const msgEl = document.getElementById('msg');

  const dayIndex = {
    Minggu: 0,
    Senin: 1,
    Selasa: 2,
    Rabu: 3,
    Kamis: 4,
    Jumat: 5,
    Sabtu: 6
  };

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function toDateInputValue(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function toTimeInputValue(date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
  }

  function parseTimeToMinutes(value) {
    const parts = String(value || '00:00').split(':');
    return Number(parts[0] || 0) * 60 + Number(parts[1] || 0);
  }

  function dateMinutes(date) {
    return date.getHours() * 60 + date.getMinutes();
  }

  function getSchedulesForDate(date) {
    return (config.schedules || []).filter((schedule) => dayIndex[schedule.hari] === date.getDay());
  }

  function isInsideOperatingHours(start, end) {
    const schedules = getSchedulesForDate(start);
    const startMinutes = dateMinutes(start);
    const endMinutes = dateMinutes(end);

    return schedules.some((schedule) => {
      const open = parseTimeToMinutes(schedule.jam_mulai);
      const close = parseTimeToMinutes(schedule.jam_selesai);
      return startMinutes >= open && endMinutes <= close && endMinutes > startMinutes;
    });
  }

  function findDefaultSlotForDate(date) {
    const schedules = getSchedulesForDate(date);
    if (!schedules.length) return null;

    const first = schedules[0];
    const [startHour, startMinute] = first.jam_mulai.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(startHour, startMinute, 0, 0);

    const slotEnd = addMinutes(slotStart, 60);
    const closeMinutes = parseTimeToMinutes(first.jam_selesai);
    if (dateMinutes(slotEnd) > closeMinutes) return null;

    return { start: slotStart, end: slotEnd };
  }

  function showMessage(type, text) {
    if (!msgEl) return;
    msgEl.innerHTML = `<div class="${type}">${text}</div>`;
  }

  function showQueryAlert(type, text) {
    if (!queryAlert || !text) return;
    queryAlert.hidden = false;
    queryAlert.className = `form-alert ${type}`;
    queryAlert.textContent = text;
  }

  function clearTransientMessages() {
    if (msgEl) msgEl.innerHTML = '';
  }

  function handleLoginRequired() {
    if (loginNotice) loginNotice.hidden = false;
    showMessage('error', 'Silakan login terlebih dahulu sebelum mengirim pengajuan peminjaman.');
  }

  function fillBookingForm(start, end) {
    const roomInput = document.getElementById('room_id');
    const dateInput = document.getElementById('date');
    const startInput = document.getElementById('start');
    const endInput = document.getElementById('end');

    if (roomInput) roomInput.value = config.roomId;
    if (dateInput) dateInput.value = toDateInputValue(start);
    if (startInput) startInput.value = toTimeInputValue(start);
    if (endInput) endInput.value = toTimeInputValue(end);

    document.getElementById('booking')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  function handleEmptySlot(start, end) {
    clearTransientMessages();

    if (!isInsideOperatingHours(start, end)) {
      showMessage('error', 'Slot berada di luar jam operasional ruangan.');
      return;
    }

    fillBookingForm(start, end);

    if (!config.isLoggedIn) {
      handleLoginRequired();
      return;
    }

    showMessage('success', 'Slot kosong dipilih. Data tanggal dan jam sudah masuk ke formulir.');
  }

  function setCalendarStatus(isLoading, hasError, hasEvents) {
    if (loadingEl) loadingEl.hidden = !isLoading;
    if (errorEl) errorEl.hidden = !hasError;
    if (emptyEl) emptyEl.hidden = isLoading || hasError || hasEvents;
  }

  function setActiveViewButton(viewName) {
    document.querySelectorAll('.view-btn').forEach((button) => {
      button.classList.toggle('active', button.dataset.view === viewName);
    });
  }

  function readQueryMessages() {
    const params = new URLSearchParams(window.location.search);
    const errorMsg = params.get('error');
    const successMsg = params.get('success');

    if (errorMsg) showQueryAlert('error', errorMsg);
    if (successMsg) showQueryAlert('success', successMsg);

    if (errorMsg || successMsg) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash || ''}`);
    }
  }

  document.querySelectorAll('.thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.thumb').forEach((item) => item.classList.remove('active'));
      thumb.classList.add('active');
      const mainImage = document.getElementById('mainImg');
      if (mainImage) mainImage.src = thumb.dataset.src;
    });
  });

  if (roomSelector) {
    roomSelector.addEventListener('change', (event) => {
      window.location.href = `/room/${event.target.value}#kalender-ketersediaan`;
    });
  }

  readQueryMessages();

  if (!config.isLoggedIn && submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Login untuk Booking';
  }

  if (bookingForm) {
    bookingForm.addEventListener('submit', (event) => {
      if (!config.isLoggedIn) {
        event.preventDefault();
        handleLoginRequired();
        return;
      }

      const dateInput = document.getElementById('date');
      const startInput = document.getElementById('start');
      const endInput = document.getElementById('end');

      if (!dateInput.value || !startInput.value || !endInput.value) return;

      const start = new Date(`${dateInput.value}T${startInput.value}:00`);
      const end = new Date(`${dateInput.value}T${endInput.value}:00`);

      if (end <= start) {
        event.preventDefault();
        showMessage('error', 'Jam selesai harus lebih akhir dari jam mulai.');
        return;
      }

      if (!isInsideOperatingHours(start, end)) {
        event.preventDefault();
        showMessage('error', 'Waktu peminjaman harus berada dalam jam operasional ruangan.');
      }
    });
  }

  if (!calendarEl || !window.FullCalendar) return;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: window.innerWidth < 760 ? 'timeGridDay' : 'timeGridWeek',
    locale: 'id',
    timeZone: 'local',
    height: 'auto',
    nowIndicator: true,
    selectable: true,
    selectMirror: true,
    selectOverlap: false,
    slotDuration: '00:30:00',
    slotMinTime: '06:00:00',
    slotMaxTime: '22:30:00',
    allDaySlot: false,
    businessHours: (config.schedules || []).map((schedule) => ({
      daysOfWeek: [dayIndex[schedule.hari]],
      startTime: schedule.jam_mulai,
      endTime: schedule.jam_selesai
    })),
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: ''
    },
    buttonText: {
      today: 'Hari Ini',
      month: 'Bulan',
      week: 'Minggu',
      day: 'Hari'
    },
    events(info, successCallback, failureCallback) {
      setCalendarStatus(true, false, true);

      fetch(`/api/rooms/${config.roomId}/availability?start=${encodeURIComponent(info.startStr)}&end=${encodeURIComponent(info.endStr)}`)
        .then((response) => {
          if (!response.ok) throw new Error('Gagal memuat kalender');
          return response.json();
        })
        .then((payload) => {
          if (!payload.success) throw new Error(payload.message || 'Gagal memuat kalender');

          if (payload.businessHours && payload.businessHours.length) {
            calendar.setOption('businessHours', payload.businessHours);
          }

          setCalendarStatus(false, false, payload.events.length > 0);
          successCallback(payload.events);
        })
        .catch((error) => {
          console.error(error);
          setCalendarStatus(false, true, true);
          failureCallback(error);
        });
    },
    select(selectionInfo) {
      handleEmptySlot(selectionInfo.start, selectionInfo.end);
      calendar.unselect();
    },
    dateClick(clickInfo) {
      if (calendar.view.type === 'dayGridMonth') {
        const slot = findDefaultSlotForDate(clickInfo.date);
        if (!slot) {
          showMessage('error', 'Tidak ada jam operasional pada tanggal yang dipilih.');
          return;
        }
        handleEmptySlot(slot.start, slot.end);
        return;
      }

      handleEmptySlot(clickInfo.date, addMinutes(clickInfo.date, 60));
    },
    eventClick(clickInfo) {
      const status = clickInfo.event.extendedProps.statusLabel || clickInfo.event.title;
      const start = clickInfo.event.start ? toTimeInputValue(clickInfo.event.start) : '';
      const end = clickInfo.event.end ? toTimeInputValue(clickInfo.event.end) : '';
      showMessage('error', `Slot ${status}: ${start}-${end}. Silakan pilih slot kosong lain.`);
    },
    eventDidMount(info) {
      const status = info.event.extendedProps.statusLabel || info.event.title;
      const start = info.event.start ? toTimeInputValue(info.event.start) : '';
      const end = info.event.end ? toTimeInputValue(info.event.end) : '';
      info.el.setAttribute('title', `${status} ${start}-${end}`);
    },
    datesSet(info) {
      setActiveViewButton(info.view.type);
    }
  });

  calendar.render();

  document.querySelectorAll('.view-btn').forEach((button) => {
    button.addEventListener('click', () => {
      calendar.changeView(button.dataset.view);
      setActiveViewButton(button.dataset.view);
    });
  });
})();
