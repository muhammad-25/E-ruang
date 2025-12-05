// index-page.js
// Smooth single-open animation for <details> FAQ structure
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('faq-eruang');
  if (!container) return;

  const detailsList = Array.from(container.querySelectorAll('details'));

  // Init styles for .answer so animations work consistently
  detailsList.forEach(d => {
    const ans = d.querySelector('.answer');
    if (!ans) return;
    ans.style.overflow = 'hidden';
    ans.style.height = d.open ? 'auto' : '0px';
    ans.style.opacity = d.open ? '1' : '0';
    ans.style.paddingTop = d.open ? '12px' : '0px';
    ans.style.paddingBottom = d.open ? '20px' : '0px';
    ans.style.transition = 'height .36s cubic-bezier(.2,.9,.2,1), opacity .26s ease, padding .26s ease';
    // ensure block for measurements
    ans.style.display = 'block';
  });

  function openDetail(detail) {
    const ans = detail.querySelector('.answer');
    if (!ans) return;
    // measure target
    ans.style.height = '0px';
    // force reflow
    ans.getBoundingClientRect();
    const target = ans.scrollHeight;
    ans.style.height = target + 'px';
    ans.style.opacity = '1';
    ans.style.paddingTop = '12px';
    ans.style.paddingBottom = '20px';

    const finish = () => {
      ans.style.height = 'auto'; // allow dynamic content
      ans.removeEventListener('transitionend', finish);
    };
    ans.addEventListener('transitionend', finish);
  }

  function closeDetail(detail) {
    const ans = detail.querySelector('.answer');
    if (!ans) return;
    // from auto -> set fixed pixel height then to zero
    const current = ans.scrollHeight;
    ans.style.height = current + 'px';
    // force reflow
    ans.getBoundingClientRect();
    ans.style.height = '0px';
    ans.style.opacity = '0';
    ans.style.paddingTop = '0px';
    ans.style.paddingBottom = '0px';
  }

  // Single-open + animate on toggle
  detailsList.forEach(d => {
    d.addEventListener('toggle', () => {
      if (d.open) {
        // close others (will trigger their toggle handlers)
        detailsList.forEach(other => {
          if (other !== d && other.open) other.open = false;
        });
        openDetail(d);
      } else {
        closeDetail(d);
      }
    });

    // Improve keyboard (Enter/Space)
    const summary = d.querySelector('summary');
    if (summary) {
      summary.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          summary.click();
        }
      });
    }
  });

  // Extra: if user clicks a summary, some browsers open before toggle event; normalize:
  container.addEventListener('click', (e) => {
    const s = e.target.closest('summary');
    if (!s) return;
    const parent = s.parentElement;
    requestAnimationFrame(() => {
      if (parent.open) {
        detailsList.forEach(d => { if (d !== parent && d.open) d.open = false; });
      }
    });
  });

  // Respect reduced motion preference
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    detailsList.forEach(d => {
      const ans = d.querySelector('.answer');
      if (ans) ans.style.transition = 'none';
    });
  }
});

/* helper easing */
function easeOutQuad(t){ return t*(2-t); }

function formatNumber(n){
  // ubah jadi number lalu format (ribuan)
  return Number.isFinite(n) ? n.toLocaleString() : n;
}

function animateCount(el, duration = 1500){
  const end = parseFloat(el.dataset.target ?? el.textContent.replace(/,/g, '')) || 0;
  const start = 0;
  let startTime = null;

  function step(timestamp){
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuad(progress);
    const current = Math.round(start + (end - start) * eased);

    el.textContent = formatNumber(current);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = formatNumber(end); // pastikan tepat
    }
  }

  requestAnimationFrame(step);
}

/* Trigger saat elemen terlihat */
const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCount(entry.target, 1400);
      obs.unobserve(entry.target); // hanya sekali
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stats-wrap .value').forEach(el => {
  // jika kamu ingin mulai dari angka yang sudah ada di HTML, jangan set data-target.
  // tapi kita disarankan pakai data-target (lebih konsisten).
  if (!el.dataset.target) {
    el.dataset.target = el.textContent.replace(/,/g, '');
    el.textContent = '0';
  } else {
    el.textContent = '0';
  }
  observer.observe(el);
});