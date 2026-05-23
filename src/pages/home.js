// src/pages/home.js
// ==========================================
// HOME PAGE RENDERER
// ==========================================

import { state } from '../js/state.js';
import * as api from '../js/api.js';
import { renderDoctorCard, renderCategoryCard, renderHospitalCard, renderSkeleton, renderEmptyState } from '../js/components.js';
import { resolveImageUrl, escapeHTML } from '../js/utils.js';

// SEO Helper
const updateSEO = () => {
  document.title = 'উত্তরবঙ্গ স্বাস্থ্য সেতু | ডাক্তার ও হাসপাতালের তথ্য';
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', 'উত্তরবঙ্গের কুচবিহার, শিলিগুড়ি সহ সব শহরের বিশেষজ্ঞ ডাক্তার ও হাসপাতালের তথ্য। ঘরে বসেই সেরা ডাক্তার খুঁজুন।');
};

export default async function renderHomePage() {
  updateSEO();
  
  // Show skeleton immediately
  let html = `
    <section class="location-chip mb-4">
      <button id="btn-change-city" class="chip chip--location">
        <span class="chip__icon">📍</span>
        <span id="current-city-name">আপনার এলাকা</span>
        <span class="chip__arrow">▾</span>
      </button>
    </section>

    <section class="hero-slider mb-6" id="hero-slider">
      <div class="slider__track" id="slider-track">
        <div class="skeleton-image animate-pulse" style="height:160px;width:100%;border-radius:16px;"></div>
      </div>
      <div class="slider__dots" id="slider-dots"></div>
    </section>

    <section class="quick-stats mb-6">
      <div class="stats-row">
        <div class="stat-item"><span class="stat-num num" id="stat-doctors">০</span><span class="stat-label">ডাক্তার</span></div>
        <div class="stat-item"><span class="stat-num num" id="stat-hospitals">০</span><span class="stat-label">হাসপাতাল</span></div>
        <div class="stat-item"><span class="stat-num num" id="stat-cities">০</span><span class="stat-label">শহর</span></div>
      </div>
    </section>

    <section class="mb-6">
      <div class="section-title">
        <h2>বিভাগ অনুযায়ী ডাক্তার</h2>
        <a href="#/doctors" class="section-title__link">সব দেখুন →</a>
      </div>      <div class="category-grid" id="category-grid">
        ${renderSkeleton(6, 'grid')}
      </div>
    </section>

    <section class="mb-6">
      <div class="section-title">
        <h2>জনপ্রিয় বিশেষজ্ঞ</h2>
        <a href="#/doctors" class="section-title__link">সব দেখুন →</a>
      </div>
      <div id="featured-doctors">
        ${renderSkeleton(3, 'doctor')}
      </div>
    </section>

    <section class="mb-6">
      <div class="section-title">
        <h2>কাছের হাসপাতাল</h2>
        <a href="#/hospitals" class="section-title__link">সব দেখুন →</a>
      </div>
      <div class="horizontal-scroll" id="trending-hospitals">
        ${renderSkeleton(2, 'doctor')}
      </div>
    </section>
  `;

  // Defer data fetching to not block initial paint
  setTimeout(() => loadHomeData(), 50);

  return html;
}

async function loadHomeData() {
  try {
    // 1. Fetch Core Data (Parallel)
    const [categories, doctors, hospitals, ads] = await Promise.all([
      state.get('categories').length ? state.get('categories') : api.getCategories(),
      api.getDoctors({ featured: true, limit: 5 }),
      api.getHospitals({ limit: 10 }),
      api.getAds('homepage_banner')
    ]);

    // Update State Cache
    if (!state.get('categories').length) state.set('categories', categories);

    // 2. Render Categories
    const catGrid = document.getElementById('category-grid');
    if (catGrid) {
      catGrid.innerHTML = categories.slice(0, 9).map(renderCategoryCard).join('') || renderEmptyState('কোনো বিভাগ নেই');
    }
    // 3. Render Featured Doctors
    const docList = document.getElementById('featured-doctors');
    if (docList) {
      docList.innerHTML = doctors.map(d => renderDoctorCard(d, 'compact')).join('') || renderEmptyState('কোনো ডাক্তার পাওয়া যায়নি');
    }

    // 4. Render Hospitals
    const hospList = document.getElementById('trending-hospitals');
    if (hospList) {
      hospList.innerHTML = hospitals.map(h => `
        <div class="h-scroll-card">
          ${renderHospitalCard(h)}
        </div>
      `).join('');
    }

    // 5. Render Slider
    renderSlider(ads);

    // 6. Update Stats (Animated)
    animateStats(doctors.length, hospitals.length, 8); // 8 cities hardcoded for now

  } catch (error) {
    console.error('Home Data Load Error:', error);
    const docList = document.getElementById('featured-doctors');
    if (docList) docList.innerHTML = `<div class="error-state">ডেটা লোড করতে সমস্যা হয়েছে। <button onclick="location.reload()">রিলোড</button></div>`;
  }
}

function renderSlider(ads) {
  const track = document.getElementById('slider-track');
  const dots = document.getElementById('slider-dots');
  if (!track || !dots) return;

  if (!ads || ads.length === 0) {
    track.innerHTML = `<div class="slider__slide default-banner"><h3>ঘরে বসেই পান সেরা ডাক্তারের খোঁজ</h3><p>উত্তরবঙ্গের ১০০+ বিশেষজ্ঞ ডাক্তার</p></div>`;
    dots.innerHTML = '';
    return;
  }

  track.innerHTML = ads.map(ad => `
    <a href="${ad.target_url || '#'}" class="slider__slide" target="_blank" rel="noopener">
      <img src="${resolveImageUrl('banner-ads', ad.image_url)}" alt="${escapeHTML(ad.title)}" loading="lazy">
    </a>
  `).join('');

  dots.innerHTML = ads.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('');

  // Auto-slide logic  let current = 0;
  const total = ads.length;
  
  const slide = () => {
    current = (current + 1) % total;
    track.scrollTo({ left: track.clientWidth * current, behavior: 'smooth' });
    dots.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === current));
  };

  let interval = setInterval(slide, 4500);
  
  // Pause on touch
  track.addEventListener('touchstart', () => clearInterval(interval), { passive: true });
}

function animateStats(docCount, hospCount, cityCount) {
  // Simple number animation or just set text
  const dEl = document.getElementById('stat-doctors');
  const hEl = document.getElementById('stat-hospitals');
  const cEl = document.getElementById('stat-cities');
  
  if (dEl) dEl.textContent = docCount > 0 ? `${docCount}+` : '০';
  if (hEl) hEl.textContent = hospCount > 0 ? `${hospCount}+` : '০';
  if (cEl) cEl.textContent = cityCount;
}

// Event Delegation for Home Page
window.addEventListener('route:changed', () => {
  if (state.get('currentRoute').path === '/') {
    const cityBtn = document.getElementById('btn-change-city');
    if (cityBtn) {
      cityBtn.addEventListener('click', () => {
        // Trigger city modal (to be implemented in utils/modal)
        console.log('Open City Picker');
      });
    }
    
    // Update city name
    const cityNameEl = document.getElementById('current-city-name');
    if (cityNameEl) {
      const currentCity = state.get('userCity');
      cityNameEl.textContent = currentCity === 'cooch_behar' ? 'কোচবিহার' : currentCity;
    }
  }
});
