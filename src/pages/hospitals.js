// src/pages/hospitals.js
// ==========================================
// HOSPITALS LIST PAGE
// ==========================================

import { state } from '../js/state.js';
import * as api from '../js/api.js';
import { renderHospitalCard, renderSkeleton, renderEmptyState } from '../js/components.js';

let currentPage = 0;
let isLoadingMore = false;
let hasMore = true;
let currentFilters = {};

export default async function renderHospitalsPage(params) {
  currentPage = 0;
  hasMore = true;
  currentFilters = {
    type: params.type || '',
    city: params.city || state.get('userCity') || ''
  };

  document.title = 'হাসপাতাল ও ডায়াগনস্টিক | উত্তরবঙ্গ স্বাস্থ্য সেতু';

  return `
    <section class="search-bar-wrap mb-4">
      <div class="search-bar">
        <svg class="search-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input type="text" id="hospital-search" class="search-bar__input" placeholder="হাসপাতালের নাম বা এলাকা লিখুন...">
      </div>
    </section>

    <section class="filter-chips mb-4" id="hospital-type-chips">
      <button class="chip ${!currentFilters.type ? 'chip--active' : ''}" data-type="">সব</button>
      <button class="chip ${currentFilters.type === 'hospital' ? 'chip--active' : ''}" data-type="hospital">🏥 হাসপাতাল</button>
      <button class="chip ${currentFilters.type === 'diagnostic_center' ? 'chip--active' : ''}" data-type="diagnostic_center">🔬 ডায়াগনস্টিক</button>
      <button class="chip ${currentFilters.type === 'clinic' ? 'chip--active' : ''}" data-type="clinic">🏨 ক্লিনিক</button>
      <button class="chip ${currentFilters.type === 'nursing_home' ? 'chip--active' : ''}" data-type="nursing_home">🛏️ নার্সিং হোম</button>
    </section>

    <section id="hospitals-list" class="hospitals-list">
      ${renderSkeleton(4, 'doctor')}
    </section>

    <div id="load-more-wrap" class="load-more-wrap" style="display:none;">
      <button id="btn-load-more-hosp" class="btn btn--secondary w-100">আরো হাসপাতাল দেখুন</button>
    </div>
  `;
}
window.addEventListener('route:changed', () => {
  const route = state.get('currentRoute');
  if (route.path === '/hospitals') {
    initHospitalsPage();
  }
});

function initHospitalsPage() {
  fetchHospitals(true);

  // Event Delegation for Type Chips
  const chipsWrap = document.getElementById('hospital-type-chips');
  if (chipsWrap) {
    chipsWrap.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      
      currentFilters.type = chip.dataset.type;
      chipsWrap.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');
      
      fetchHospitals(true);
    });
  }

  // Load More
  const loadMoreBtn = document.getElementById('btn-load-more-hosp');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => fetchHospitals(false));
  }
}

async function fetchHospitals(reset = false) {
  if (isLoadingMore) return;
  
  const listEl = document.getElementById('hospitals-list');
  const loadMoreWrap = document.getElementById('load-more-wrap');
  if (!listEl) return;

  if (reset) {
    currentPage = 0;
    hasMore = true;
    listEl.innerHTML = renderSkeleton(3, 'doctor');
  } else {
    isLoadingMore = true;
    const btn = document.getElementById('btn-load-more-hosp');
    if (btn) btn.textContent = 'লোড হচ্ছে...';
  }

  try {    const limit = 10;
    const offset = currentPage * limit;
    
    const hospitals = await api.getHospitals({ 
      type: currentFilters.type, 
      city: currentFilters.city,
      limit, 
      offset 
    });

    if (reset) listEl.innerHTML = '';

    if (hospitals.length === 0 && currentPage === 0) {
      listEl.innerHTML = renderEmptyState('এই এলাকায় কোনো হাসপাতাল পাওয়া যায়নি।');
      if (loadMoreWrap) loadMoreWrap.style.display = 'none';
    } else {
      const html = hospitals.map(h => renderHospitalCard(h)).join('');
      listEl.insertAdjacentHTML('beforeend', html);
      
      currentPage++;
      hasMore = hospitals.length === limit;
      
      if (loadMoreWrap) {
        loadMoreWrap.style.display = hasMore ? 'block' : 'none';
        const btn = document.getElementById('btn-load-more-hosp');
        if (btn) btn.textContent = 'আরো হাসপাতাল দেখুন';
      }
    }
  } catch (error) {
    console.error('Fetch Hospitals Error:', error);
    if (reset) listEl.innerHTML = `<div class="error-state">ডেটা লোড করতে ব্যর্থ।</div>`;
  } finally {
    isLoadingMore = false;
  }
}
