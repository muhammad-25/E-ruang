
    // Thumbnail switcher
    document.querySelectorAll('.thumb').forEach(t=>{
      t.addEventListener('click',()=>{
        document.querySelectorAll('.thumb').forEach(x=>x.classList.remove('active'));
        t.classList.add('active');
        document.getElementById('mainImg').src = t.dataset.src;
      })
    })

    // Simple form submit demo
    document.getElementById('bookingForm').addEventListener('submit',function(e){
      const msg = document.getElementById('msg');
      msg.innerHTML = '<div class="success">Permintaan peminjaman dikirim. Tunggu konfirmasi dari admin.</div>';
      // reset form after 1.2s
      setTimeout(()=>{this.reset()},1200);
    })