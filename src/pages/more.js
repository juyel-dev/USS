// src/pages/more.js
// ==========================================
// SECONDARY PAGES (More, About, Support, Search, Privacy)
// ==========================================

import { state } from '../js/state.js';
import * as api from '../js/api.js';
import { renderDoctorCard, renderHospitalCard, renderSkeleton, renderEmptyState } from '../js/components.js';
import { debounce, escapeHTML } from '../js/utils.js';

// ==========================================
// 1. MORE PAGE (Menu Grid)
// ==========================================
export async function renderMorePage() {
  document.title = 'আরো সেবা | উত্তরবঙ্গ স্বাস্থ্য সেতু';

  return `
    <section class="more-grid">
      <a href="#/about" class="more-item card">
        <div class="more-item__icon">📱</div>
        <div class="more-item__text">
          <h3>অ্যাপ সম্পর্কে</h3>
          <p>আমাদের লক্ষ্য ও উদ্দেশ্য</p>
        </div>
        <svg class="more-item__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </a>

      <a href="#/support" class="more-item card">
        <div class="more-item__icon">🎧</div>
        <div class="more-item__text">
          <h3>সাপোর্ট ও যোগাযোগ</h3>
          <p>সাহায্যের প্রয়োজন?</p>
        </div>
        <svg class="more-item__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </a>

      <a href="#/privacy" class="more-item card">
        <div class="more-item__icon">🔒</div>
        <div class="more-item__text">
          <h3>প্রাইভেসি পলিসি</h3>
          <p>আপনার তথ্যের সুরক্ষা</p>
        </div>
        <svg class="more-item__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </a>

      <button class="more-item card" id="btn-share-app">
        <div class="more-item__icon">📤</div>
        <div class="more-item__text">
          <h3>বন্ধুকে শেয়ার করুন</h3>
          <p>অ্যাপটি ছড়িয়ে দিন</p>        </div>
        <svg class="more-item__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      <button class="more-item card" id="btn-install-app">
        <div class="more-item__icon">📲</div>
        <div class="more-item__text">
          <h3>অ্যাপ ইনস্টল করুন</h3>
          <p>হোম স্ক্রিনে যুক্ত করুন</p>
        </div>
        <svg class="more-item__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </section>

    <section class="more-footer mt-8 text-center">
      <img src="/assets/icons/icon-192.png" alt="Logo" class="more-footer__logo" width="64" height="64">
      <h3 class="more-footer__name">উত্তরবঙ্গ স্বাস্থ্য সেতু</h3>
      <p class="text-muted text-sm">Version 1.0.0</p>
      <p class="text-muted text-sm mt-2">Made with ❤️ for North Bengal</p>
    </section>
  `;
}

// More Page Event Listeners
window.addEventListener('route:changed', () => {
  if (state.get('currentRoute').path === '/more') {
    const shareBtn = document.getElementById('btn-share-app');
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'উত্তরবঙ্গ স্বাস্থ্য সেতু',
              text: 'ঘরে বসেই পান সেরা ডাক্তারের খোঁজ!',
              url: window.location.href
            });
          } catch (e) { console.log('Share cancelled'); }
        } else {
          // Fallback: Copy to clipboard
          navigator.clipboard.writeText(window.location.href);
          alert('লিংক কপি হয়েছে!');
        }
      });
    }

    const installBtn = document.getElementById('btn-install-app');
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        if (window.deferredInstallPrompt) {
          window.deferredInstallPrompt.prompt();        } else {
          alert('আপনার ব্রাউজারের মেনু থেকে "Add to Home Screen" অপশন ব্যবহার করুন।');
        }
      });
    }
  }
});

// ==========================================
// 2. ABOUT PAGE
// ==========================================
export async function renderAboutPage() {
  document.title = 'আমাদের সম্পর্কে | উত্তরবঙ্গ স্বাস্থ্য সেতু';

  return `
    <div class="card about-hero text-center mb-4">
      <img src="/assets/icons/icon-192.png" alt="Logo" width="96" height="96" style="margin: 0 auto;">
      <h1 class="mt-3">উত্তরবঙ্গ স্বাস্থ্য সেতু</h1>
      <p class="text-muted mt-2">ঘরে বসেই পান সেরা ডাক্তারের খোঁজ</p>
    </div>

    <div class="card mb-4">
      <h3 class="info-title">🎯 আমাদের লক্ষ্য</h3>
      <p class="text-md">
        উত্তরবঙ্গের প্রতিটি মানুষ — কোচবিহার থেকে শিলিগুড়ি, তুফানগঞ্জ থেকে দার্জিলিং — 
        যেন ঘরে বসেই, তাদের নিজের ভাষায়, মোবাইল থেকেই সঠিক বিশেষজ্ঞ ডাক্তার খুঁজে পান।
      </p>
    </div>

    <div class="card mb-4">
      <h3 class="info-title">❓ কেন এই অ্যাপ?</h3>
      <p class="text-md">
        উত্তরবঙ্গে ভালো ডাক্তার আছেন, কিন্তু তাদের তথ্য পাওয়া কঠিন। 
        কোন ডাক্তার কখন কোন চেম্বারে বসেন, তার ফোন নম্বর কী, ভিজিট ফি কত — 
        এই তথ্যগুলো মানুষের কাছে সহজে পৌঁছে দেওয়াই আমাদের কাজ।
      </p>
    </div>

    <div class="card mb-4">
      <h3 class="info-title">✅ আমাদের বৈশিষ্ট্য</h3>
      <ul class="info-list">
        <li>🔍 বাংলায় স্মার্ট সার্চ</li>
        <li>📍 ৮টি শহরের সম্পূর্ণ তথ্য</li>
        <li>🩺 উপসর্গ অনুযায়ী ডাক্তার সাজেশন</li>
        <li>⭐ রোগীদের রিভিউ ও রেটিং</li>
        <li>📞 সরাসরি কল ও WhatsApp</li>
        <li>📱 অফলাইনেও চলে</li>
      </ul>
    </div>
    <div class="card warning-card">
      <h3 class="info-title text-emergency">⚠️ দাবিত্যাগ (Disclaimer)</h3>
      <p class="text-sm text-muted">
        এই অ্যাপ শুধুমাত্র তথ্যমূলক উদ্দেশ্যে। আমরা কোনো চিকিৎসা পরামর্শ দিই না। 
        জরুরি মুহূর্তে অবিলম্বে নিকটস্থ হাসপাতালে যোগাযোগ করুন। 
        সব তথ্য যাচাই করার চেষ্টা করা হয়েছে, তবে কোনো ভুল থাকলে আমাদের জানান।
      </p>
    </div>
  `;
}

// ==========================================
// 3. SUPPORT PAGE
// ==========================================
export async function renderSupportPage() {
  document.title = 'সাপোর্ট ও যোগাযোগ | উত্তরবঙ্গ স্বাস্থ্য সেতু';

  return `
    <div class="card support-hero text-center mb-4">
      <div class="support-avatar">👨‍💻</div>
      <h2>আমাদের সাথে যোগাযোগ করুন</h2>
      <p class="text-muted mt-2">যেকোনো প্রশ্ন, পরামর্শ বা সাহায্যের জন্য</p>
    </div>

    <div class="card mb-4">
      <h3 class="info-title">📞 সরাসরি যোগাযোগ</h3>
      <div class="contact-buttons">
        <a href="tel:+919876543210" class="btn btn--primary w-100 mb-3">
          📞 কল করুন
        </a>
        <a href="https://wa.me/919876543210" target="_blank" class="btn btn--success w-100 mb-3">
          💬 WhatsApp করুন
        </a>
        <a href="mailto:support@uttarbangahealth.com" class="btn btn--secondary w-100">
          ✉️ ইমেইল করুন
        </a>
      </div>
    </div>

    <div class="card mb-4">
      <h3 class="info-title">🏥 ডাক্তার/হাসপাতাল যুক্ত করতে চান?</h3>
      <p class="text-md mb-3">
        আপনি যদি ডাক্তার বা হাসপাতাল কর্তৃপক্ষ হন এবং এই অ্যাপে আপনার তথ্য যুক্ত করতে চান, 
        তাহলে WhatsApp-এ যোগাযোগ করুন:
      </p>
      <a href="https://wa.me/919876543210?text=আমি%20ডাক্তার/হাসপাতাল%20যুক্ত%20করতে%20চাই" 
         target="_blank" 
         class="btn btn--success w-100">
        💬 WhatsApp-এ জানান
      </a>    </div>

    <div class="card mb-4">
      <h3 class="info-title">🐛 ভুল তথ্য রিপোর্ট করুন</h3>
      <p class="text-md">
        কোনো ডাক্তার বা হাসপাতালের তথ্য ভুল পেয়েছেন? আমাদের জানান, 
        আমরা দ্রুত সংশোধন করব।
      </p>
      <button class="btn btn--secondary w-100 mt-3" onclick="alert('ধন্যবাদ! আমরা শীঘ্রই যোগাযোগ করব।')">
        📝 রিপোর্ট করুন
      </button>
    </div>

    <div class="card">
      <h3 class="info-title">🌐 সোশ্যাল মিডিয়া</h3>
      <div class="social-links">
        <a href="https://facebook.com/uttarbangahealth" target="_blank" class="social-link">
          <span>📘</span> Facebook
        </a>
        <a href="https://instagram.com/uttarbangahealth" target="_blank" class="social-link">
          <span>📷</span> Instagram
        </a>
        <a href="https://youtube.com/@uttarbangahealth" target="_blank" class="social-link">
          <span>📺</span> YouTube
        </a>
      </div>
    </div>
  `;
}

// ==========================================
// 4. PRIVACY POLICY PAGE
// ==========================================
export async function renderPrivacyPage() {
  document.title = 'প্রাইভেসি পলিসি | উত্তরবঙ্গ স্বাস্থ্য সেতু';

  return `
    <div class="card">
      <h1 class="text-xl mb-4">গোপনীয়তা নীতি (Privacy Policy)</h1>
      
      <div class="privacy-section">
        <h3 class="info-title">১. তথ্য সংগ্রহ</h3>
        <p class="text-md">
          আমরা শুধুমাত্র সেই তথ্য সংগ্রহ করি যা অ্যাপের সেবা উন্নত করতে প্রয়োজন। 
          আমরা আপনার নাম, ফোন নম্বর বা ব্যক্তিগত তথ্য সংরক্ষণ করি না, যদি না আপনি 
          স্বেচ্ছায় রিভিউ বা ফিডব্যাক দেন।
        </p>
      </div>

      <div class="privacy-section">        <h3 class="info-title">২. কুকি ও লোকাল স্টোরেজ</h3>
        <p class="text-md">
          অ্যাপটি আপনার পছন্দের শহর এবং অফলাইন ডেটা সংরক্ষণ করতে 
          ব্রাউজারের Local Storage ব্যবহার করে। এই তথ্য শুধু আপনার ডিভাইসে থাকে।
        </p>
      </div>

      <div class="privacy-section">
        <h3 class="info-title">৩. তৃতীয় পক্ষের সেবা</h3>
        <p class="text-md">
          আমরা Supabase (ডেটাবেস), Google Fonts এবং WhatsApp ব্যবহার করি। 
          এই সেবাগুলোর নিজস্ব প্রাইভেসি পলিসি রয়েছে।
        </p>
      </div>

      <div class="privacy-section">
        <h3 class="info-title">৪. তথ্যের নিরাপত্তা</h3>
        <p class="text-md">
          আমরা Row Level Security (RLS) ব্যবহার করি। আপনার সংগ্রহ করা 
          তথ্য এনক্রিপ্টেড এবং সুরক্ষিত।
        </p>
      </div>

      <div class="privacy-section">
        <h3 class="info-title">৫. যোগাযোগ</h3>
        <p class="text-md">
          প্রাইভেসি সংক্রান্ত কোনো প্রশ্ন থাকলে আমাদের ইমেইল করুন: 
          <a href="mailto:privacy@uttarbangahealth.com" class="text-primary">
            privacy@uttarbangahealth.com
          </a>
        </p>
      </div>

      <p class="text-muted text-sm mt-4">
        শেষ আপডেট: মে ২০২৬
      </p>
    </div>
  `;
}

// ==========================================
// 5. SEARCH PAGE (Global Search)
// ==========================================
export async function renderSearchPage() {
  document.title = 'খুঁজুন | উত্তরবঙ্গ স্বাস্থ্য সেতু';

  return `
    <section class="search-page-hero mb-4">
      <div class="search-bar search-bar--large">
        <svg class="search-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input 
          type="text" 
          id="global-search-input" 
          class="search-bar__input" 
          placeholder="ডাক্তার, হাসপাতাল বা উপসর্গ লিখুন..."
          autocomplete="off"
          autofocus
        >
      </div>
    </section>

    <section id="search-suggestions" class="search-suggestions mb-4">
      <h3 class="section-title text-sm">জনপ্রিয় সার্চ</h3>
      <div class="suggestion-chips">
        <button class="chip" data-query="মেডিসিন">মেডিসিন ডাক্তার</button>
        <button class="chip" data-query="হার্ট">হার্টের ডাক্তার</button>
        <button class="chip" data-query="শিশু">শিশু বিশেষজ্ঞ</button>
        <button class="chip" data-query="গাইনি">গাইনি বিশেষজ্ঞ</button>
        <button class="chip" data-query="দাঁত">দাঁতের ডাক্তার</button>
        <button class="chip" data-query="চোখ">চোখের ডাক্তার</button>
      </div>
    </section>

    <section id="search-results" class="search-results">
      <!-- Results will be injected here -->
    </section>
  `;
}

// Search Page Logic
window.addEventListener('route:changed', () => {
  if (state.get('currentRoute').path === '/search') {
    initSearchPage();
  }
});

function initSearchPage() {
  const input = document.getElementById('global-search-input');
  const resultsEl = document.getElementById('search-results');
  const suggestionsEl = document.getElementById('search-suggestions');
  
  if (!input) return;

  // Focus input
  setTimeout(() => input.focus(), 300);

  // Debounced Search  input.addEventListener('input', debounce(async (e) => {
    const query = e.target.value.trim();
    if (query.length < 2) {
      resultsEl.innerHTML = '';
      suggestionsEl.style.display = 'block';
      return;
    }

    suggestionsEl.style.display = 'none';
    await performGlobalSearch(query);
  }, 400));

  // Suggestion Chips
  if (suggestionsEl) {
    suggestionsEl.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      
      const query = chip.dataset.query;
      input.value = query;
      performGlobalSearch(query);
    });
  }

  // Check for query param
  const route = state.get('currentRoute');
  if (route.params.q) {
    input.value = route.params.q;
    performGlobalSearch(route.params.q);
  }
}

async function performGlobalSearch(query) {
  const resultsEl = document.getElementById('search-results');
  if (!resultsEl) return;

  resultsEl.innerHTML = renderSkeleton(3, 'doctor');

  try {
    // Parallel search for doctors and hospitals
    // Note: In production, use a dedicated search RPC function
    const [doctors, hospitals] = await Promise.all([
      api.getDoctors({ limit: 10 }), // Simplified, should use text search
      api.getHospitals({ limit: 5 })
    ]);

    // Client-side filter (should be server-side with pg_trgm)
    const q = query.toLowerCase();
    const filteredDoctors = doctors.filter(d => 
      (d.name_en && d.name_en.toLowerCase().includes(q)) ||      (d.name_bn && d.name_bn.includes(q)) ||
      (d.specialty && d.specialty.toLowerCase().includes(q)) ||
      (d.search_keywords && d.search_keywords.some(k => k.toLowerCase().includes(q)))
    );

    const filteredHospitals = hospitals.filter(h =>
      (h.name_en && h.name_en.toLowerCase().includes(q)) ||
      (h.name_bn && h.name_bn.includes(q)) ||
      (h.city && h.city.toLowerCase().includes(q))
    );

    let html = '';

    if (filteredDoctors.length === 0 && filteredHospitals.length === 0) {
      html = renderEmptyState(`"${escapeHTML(query)}" এর কোনো ফলাফল পাওয়া যায়নি`);
    } else {
      if (filteredDoctors.length > 0) {
        html += `<h3 class="section-title mt-4">👨‍⚕️ ডাক্তার (${filteredDoctors.length})</h3>`;
        html += filteredDoctors.map(d => renderDoctorCard(d)).join('');
      }

      if (filteredHospitals.length > 0) {
        html += `<h3 class="section-title mt-4">🏥 হাসপাতাল (${filteredHospitals.length})</h3>`;
        html += filteredHospitals.map(h => renderHospitalCard(h)).join('');
      }
    }

    resultsEl.innerHTML = html;

  } catch (error) {
    console.error('Search error:', error);
    resultsEl.innerHTML = '<div class="error-state">সার্চ করতে সমস্যা হয়েছে।</div>';
  }
        }
