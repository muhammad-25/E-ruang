function add (){
    // Facilities chip selection
    const chips = document.querySelectorAll('#facilities .chip');
    const facilitiesSelected = document.getElementById('facilitiesSelected');
    function updateFacilitiesField(){
    const picked = Array.from(chips).filter(c=>c.classList.contains('active')).map(c=>c.textContent.trim());
    facilitiesSelected.value = picked.join(',');
    document.getElementById('p-fac').textContent = picked.slice(0,5).join(', ') || 'Tidak ada';
    }
    chips.forEach(ch => ch.addEventListener('click', ()=>{ ch.classList.toggle('active'); updateFacilitiesField(); }));
    updateFacilitiesField();

    // Capacity (number input)
    const capacity = document.getElementById('capacity');
    const pCap = document.getElementById('p-cap');
    capacity.addEventListener('input', ()=>{ pCap.textContent = capacity.value; });

    // Photo preview
    const photosIn = document.getElementById('photos');
    const photoPreview = document.getElementById('photoPreview');
    const previewImage = document.getElementById('previewImage');
    photosIn && photosIn.addEventListener('change', (e)=>{
    photoPreview.innerHTML = '';
    const files = Array.from(e.target.files).slice(0,3);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev)=>{
        const img = document.createElement('img'); img.src = ev.target.result; photoPreview.appendChild(img);
        previewImage.style.backgroundImage = `url(${ev.target.result})`;
        previewImage.style.backgroundSize = 'cover';
        previewImage.innerHTML = '';
        };
        reader.readAsDataURL(file);
    });
    });

    // Update preview text fields live
    const roomName = document.getElementById('roomName');
    roomName && roomName.addEventListener('input', ()=> document.getElementById('p-name').textContent = roomName.value || 'Lab Jaringan 301');
    const building = document.querySelector('input[name="building"]');
    const roomNumber = document.querySelector('input[name="room_number"]');
    function updateSub(){ document.getElementById('p-sub').textContent = ((building.value||'Gedung A') + ' — ' + (roomNumber.value||'301')) }
    building && building.addEventListener('input', updateSub);
    roomNumber && roomNumber.addEventListener('input', updateSub);

    // Accent color -> update CSS variable for preview

    // Schedule add/remove (with multi-day selection per row)
    const scheduleList = document.getElementById('scheduleList');
    document.getElementById('addScheduleBtn').addEventListener('click', ()=>{
    const row = document.createElement('div'); row.className = 'schedule-row';
    row.innerHTML = `<div class="days">
        <label><input type="checkbox" value="Senin" class="day-checkbox">Senin</label>
        <label><input type="checkbox" value="Selasa" class="day-checkbox">Selasa</label>
        <label><input type="checkbox" value="Rabu" class="day-checkbox">Rabu</label>
        <label><input type="checkbox" value="Kamis" class="day-checkbox">Kamis</label>
        <label><input type="checkbox" value="Jumat" class="day-checkbox">Jumat</label>
        <label><input type="checkbox" value="Sabtu" class="day-checkbox">Sabtu</label>
        <label><input type="checkbox" value="Minggu" class="day-checkbox">Minggu</label>
        </div>
        <input name="schedule_start[]" type="time" /> <span class="to">—</span> <input name="schedule_end[]" type="time" />
        <input type="hidden" name="schedule_days[]" class="schedule-days-hidden" />
        <button type="button" class="btn--remove">Hapus</button>`;
    scheduleList.appendChild(row);
    });

    // update hidden input when checkboxes change
    scheduleList.addEventListener('change', (e)=>{
    if(e.target.classList && e.target.classList.contains('day-checkbox')){
        const row = e.target.closest('.schedule-row');
        const hidden = row.querySelector('.schedule-days-hidden');
        const picked = Array.from(row.querySelectorAll('.day-checkbox')).filter(c=>c.checked).map(c=>c.value);
        hidden.value = picked.join(',');
    }
    });

    scheduleList.addEventListener('click', (e)=>{
    if(e.target.classList.contains('btn--remove')) e.target.closest('.schedule-row').remove();
    });

    // Preview toggle
    const previewCard = document.getElementById('previewCard');
    document.getElementById('previewToggle').addEventListener('click', ()=>{
    previewCard.classList.toggle('hidden');
    });

    // Basic form validation prior to submit (simple client-side check)
    const form = document.getElementById('addClassForm');
    form.addEventListener('submit', (e)=>{
    if(!roomName.value.trim()){ e.preventDefault(); alert('Nama ruang harus diisi'); roomName.focus(); return false; }
    // ensure schedule hidden inputs are up to date
    Array.from(document.querySelectorAll('.schedule-row')).forEach(row=>{
        const hidden = row.querySelector('.schedule-days-hidden');
        if(hidden){
        const picked = Array.from(row.querySelectorAll('.day-checkbox')).filter(c=>c.checked).map(c=>c.value);
        hidden.value = picked.join(',');
        }
    });
    // facilities data already stored to hidden input
    });

}

add()