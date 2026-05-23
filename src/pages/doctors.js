// src/pages/doctors.js
// ==========================================
// DOCTORS LIST PAGE
// ==========================================

import { state } from '../js/state.js';
import * as api from '../js/api.js';
import { renderDoctorCard, renderSkeleton, renderEmptyState } from '../js/components.js';
import { debounce } from '../js/utils.js';

let currentPage = 0;
let isLoadingMore = false;
let hasMore = true;
let currentFilters = {};

export default async function renderDoctorsPage(params) {
  // Reset pagination
  currentPage = 0;
  hasMore = true;
  currentFilters = {
    specialty: params.specialty || '',
    city: params.city || state.get('userCity') || ''
  };

  const specialtyTitle = currentFilters.specialty 
    ? state.get('categories').find(c => c.specialty === currentFilters.specialty)?.name_bn || 'বিশেষজ্ঞ'
    : 'সকল';

  // SEO
  document.title = `${specialtyTitle} ডাক্তার | উত্তরবঙ্গ স্বাস্থ্য সেতু`;

  return `
    <section class="search-bar-wrap mb-4">
      <div class="search-bar">
        <svg class="search-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input type="text" id="doctor-search" class="search-bar__input" placeholder="নাম, বিভাগ বা এলাকা লিখুন..." value="${params.q || ''}">
      </div>
    </section>

    <section class="filter-chips mb-4" id="filter-chips">
      <button class="chip ${!currentFilters.specialty ? 'chip--active' : ''}" data-specialty="">সকল</button>
      <!-- Chips will be injected here -->
    </section>

    <section class="sort-bar mb-4">
      <span id="result-count" class="text-muted text-sm">লোড হচ্ছে...</span>
      <select id="sort-select" class="sort-select">
        <option value="rating">সেরা রেটিং</option>
        <option value="experience">অভিজ্ঞতা</option>
        <option value="fee_low">কম ফি</option>      </select>
    </section>

    <section id="doctors-list" class="doctors-list">
      ${renderSkeleton(5, 'doctor')}
    </section>

    <div id="load-more-wrap" class="load-more-wrap" style="display:none;">
      <button id="btn-load-more" class="btn btn--secondary w-100">আরো ডাক্তার দেখুন</button>
    </div>
  `;
}

// Initialize Page Logic
window.addEventListener('route:changed', () => {
  const route = state.get('currentRoute');
  if (route.path.startsWith('/doctors')) {
    initDoctorsPage(route.params);
  }
});

async function initDoctorsPage(params) {
  // 1. Render Filter Chips
  renderChips();

  // 2. Fetch Initial Data
  await fetchDoctors(true);

  // 3. Attach Event Listeners
  const searchInput = document.getElementById('doctor-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      currentFilters.q = e.target.value;
      fetchDoctors(true);
    }, 500));
  }

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentFilters.sort = e.target.value;
      fetchDoctors(true);
    });
  }

  const loadMoreBtn = document.getElementById('btn-load-more');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => fetchDoctors(false));
  }
  // Chip clicks (Event Delegation)
  const chipsWrap = document.getElementById('filter-chips');
  if (chipsWrap) {
    chipsWrap.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      
      const spec = chip.dataset.specialty;
      currentFilters.specialty = spec;
      
      // Update UI
      chipsWrap.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');
      
      // Update URL without reload
      const newUrl = spec ? `#/doctors?specialty=${spec}` : '#/doctors';
      history.replaceState(null, '', newUrl);
      
      fetchDoctors(true);
    });
  }
}

function renderChips() {
  const wrap = document.getElementById('filter-chips');
  if (!wrap) return;

  const categories = state.get('categories').slice(0, 8); // Show top 8
  const chipsHtml = categories.map(cat => `
    <button class="chip ${currentFilters.specialty === cat.specialty ? 'chip--active' : ''}" data-specialty="${cat.specialty}">
      ${cat.name_bn}
    </button>
  `).join('');

  // Keep the "All" button, append others
  wrap.innerHTML = `
    <button class="chip ${!currentFilters.specialty ? 'chip--active' : ''}" data-specialty="">সকল</button>
    ${chipsHtml}
  `;
}

async function fetchDoctors(reset = false) {
  if (isLoadingMore) return;
  
  const listEl = document.getElementById('doctors-list');
  const countEl = document.getElementById('result-count');
  const loadMoreWrap = document.getElementById('load-more-wrap');
  
  if (!listEl) return;
  if (reset) {
    currentPage = 0;
    hasMore = true;
    listEl.innerHTML = renderSkeleton(3, 'doctor');
  } else {
    isLoadingMore = true;
    const btn = document.getElementById('btn-load-more');
    if (btn) btn.textContent = 'লোড হচ্ছে...';
  }

  try {
    const limit = 10;
    const offset = currentPage * limit;
    
    // Note: In a real app, search (q) would be passed to API
    const doctors = await api.getDoctors({ 
      specialty: currentFilters.specialty, 
      limit, 
      offset 
    });

    if (reset) listEl.innerHTML = '';

    if (doctors.length === 0 && currentPage === 0) {
      listEl.innerHTML = renderEmptyState('আপনার অনুসন্ধান অনুযায়ী কোনো ডাক্তার পাওয়া যায়নি।');
      if (loadMoreWrap) loadMoreWrap.style.display = 'none';
    } else {
      const html = doctors.map(d => renderDoctorCard(d)).join('');
      listEl.insertAdjacentHTML('beforeend', html);
      
      currentPage++;
      hasMore = doctors.length === limit;
      
      if (loadMoreWrap) {
        loadMoreWrap.style.display = hasMore ? 'block' : 'none';
        const btn = document.getElementById('btn-load-more');
        if (btn) btn.textContent = 'আরো ডাক্তার দেখুন';
      }
    }

    if (countEl) {
      countEl.textContent = `${listEl.children.length}+ জন পাওয়া গেছে`;
    }

  } catch (error) {
    console.error('Fetch Doctors Error:', error);
    if (reset) listEl.innerHTML = `<div class="error-state">ডেটা লোড করতে ব্যর্থ। অনুগ্রহ করে রিলোড করুন।</div>`;
  } finally {
    isLoadingMore = false;
  }}
