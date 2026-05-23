// src/pages/symptoms.js
// ==========================================
// SYMPTOMS LIST & DETAIL PAGE
// ==========================================

import { state } from '../js/state.js';
import * as api from '../js/api.js';
import { renderSymptomCard, renderDoctorCard, renderSkeleton, renderEmptyState } from '../js/components.js';
import { resolveImageUrl, escapeHTML } from '../js/utils.js';

// ==========================================
// 1. SYMPTOMS GRID PAGE (/symptoms)
// ==========================================
export async function renderSymptomsListPage() {
  document.title = 'উপসর্গ অনুযায়ী ডাক্তার | উত্তরবঙ্গ স্বাস্থ্য সেতু';

  return `
    <section class="symptoms-hero mb-4">
      <h2 class="symptoms-hero__title">এই লক্ষণগুলোর কোনোটি আছে কি?</h2>
      <p class="symptoms-hero__subtitle">উপসর্গ বেছে নিন — সঠিক বিশেষজ্ঞ খুঁজুন</p>
    </section>

    <section id="symptoms-grid" class="symptoms-grid">
      ${renderSkeleton(6, 'grid')}
    </section>
  `;
}

// ==========================================
// 2. SYMPTOM DETAIL PAGE (/symptoms/:slug)
// ==========================================
export async function renderSymptomDetailPage(params) {
  const { slug } = params;
  if (!slug) return renderEmptyState('উপসর্গের তথ্য পাওয়া যায়নি।');

  setTimeout(() => loadSymptomData(slug), 50);

  return `
    <div id="symptom-detail-content">
      ${renderSkeleton(1, 'doctor')}
      <div class="skeleton-line w-80 animate-pulse mt-4" style="height:150px;border-radius:12px;"></div>
    </div>
  `;
}

// ==========================================
// DATA LOADING & RENDERING LOGIC
// ==========================================

window.addEventListener('route:changed', () => {  const route = state.get('currentRoute');
  if (route.path === '/symptoms') {
    loadSymptomsGrid();
  }
});

async function loadSymptomsGrid() {
  const gridEl = document.getElementById('symptoms-grid');
  if (!gridEl) return;

  try {
    // Use cached symptoms if available
    let symptoms = state.get('symptoms');
    if (!symptoms || symptoms.length === 0) {
      symptoms = await api.getSymptoms();
      state.set('symptoms', symptoms);
    }

    if (symptoms.length === 0) {
      gridEl.innerHTML = renderEmptyState('কোনো উপসর্গ পাওয়া যায়নি।');
    } else {
      gridEl.innerHTML = symptoms.map(s => renderSymptomCard(s)).join('');
    }
  } catch (error) {
    console.error('Load Symptoms Error:', error);
    gridEl.innerHTML = `<div class="error-state">ডেটা লোড করতে ব্যর্থ।</div>`;
  }
}

async function loadSymptomData(slug) {
  const container = document.getElementById('symptom-detail-content');
  if (!container) return;

  try {
    const symptom = await api.getSymptomBySlug(slug);

    if (!symptom) {
      container.innerHTML = renderEmptyState('এই উপসর্গের কোনো তথ্য পাওয়া যায়নি।');
      return;
    }

    // Update SEO
    document.title = `${symptom.title_bn} - কোন ডাক্তার দেখাবেন? | স্বাস্থ্য সেতু`;

    // Render Symptom Info
    container.innerHTML = renderSymptomDetailUI(symptom);

    // Fetch Recommended Doctors based on mapping
    loadRecommendedDoctors(symptom);
  } catch (error) {
    console.error('Symptom Detail Error:', error);
    container.innerHTML = `<div class="error-state">তথ্য লোড করতে সমস্যা হয়েছে।</div>`;
  }
}

function renderSymptomDetailUI(symptom) {
  const imgSrc = resolveImageUrl('symptom-images', symptom.image_url);
  const emergencyFlag = symptom.is_emergency ? `<span class="badge badge--emergency">🚨 জরুরি অবস্থা</span>` : '';

  return `
    <section class="symptom-detail-hero card">
      ${imgSrc ? `<img src="${imgSrc}" alt="${escapeHTML(symptom.title_bn)}" class="symptom-detail__img">` : ''}
      <h1 class="symptom-detail__title">${escapeHTML(symptom.title_bn)} ${emergencyFlag}</h1>
      <p class="symptom-detail__desc mt-2">${escapeHTML(symptom.description_bn || 'এই উপসর্গ সম্পর্কে বিস্তারিত তথ্য শীঘ্রই যুক্ত করা হবে।')}</p>
    </section>

    <section class="info-section mt-4">
      <h3 class="section-title">👨‍⚕️ এই উপসর্গে কোন ডাক্তার দেখাবেন?</h3>
      <div id="recommended-specialties" class="specialties-chips mb-4">
        <!-- Injected by JS -->
      </div>
    </section>

    <section id="recommended-doctors" class="mt-4">
      <h3 class="section-title">সম্পর্কিত বিশেষজ্ঞ ডাক্তার</h3>
      ${renderSkeleton(3, 'doctor')}
    </section>
  `;
}

async function loadRecommendedDoctors(symptom) {
  const specialtiesEl = document.getElementById('recommended-specialties');
  const doctorsEl = document.getElementById('recommended-doctors');
  
  // Get mappings from the joined data
  const mappings = symptom.symptom_specialty_mapping || [];
  
  if (mappings.length === 0) {
    if (specialtiesEl) specialtiesEl.innerHTML = '<span class="text-muted">কোনো বিশেষজ্ঞ ম্যাপিং পাওয়া যায়নি।</span>';
    if (doctorsEl) doctorsEl.innerHTML += renderEmptyState('এই উপসর্গের জন্য কোনো ডাক্তার পাওয়া যায়নি।');
    return;
  }

  // 1. Render Specialty Chips
  const uniqueSpecialties = [...new Map(mappings.map(m => [m.specialty, m])).values()]
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  if (specialtiesEl) {
    specialtiesEl.innerHTML = uniqueSpecialties.map((m, index) => `      <button class="chip ${index === 0 ? 'chip--active' : ''}" data-specialty="${m.specialty}">
        ${escapeHTML(m.categories?.name_bn || m.specialty)}
      </button>
    `).join('');
  }

  // 2. Fetch Doctors for the top priority specialty
  const topSpecialty = uniqueSpecialties[0].specialty;
  await fetchDoctorsForSymptom(topSpecialty);

  // 3. Chip Click Logic
  if (specialtiesEl) {
    specialtiesEl.addEventListener('click', async (e) => {
      const chip = e.target.closest('.chip');
      if (!chip || chip.classList.contains('chip--active')) return;

      specialtiesEl.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');

      await fetchDoctorsForSymptom(chip.dataset.specialty);
    });
  }
}

async function fetchDoctorsForSymptom(specialty) {
  const doctorsEl = document.getElementById('recommended-doctors');
  if (!doctorsEl) return;

  // Keep the title, replace the rest with skeleton
  const titleHtml = '<h3 class="section-title">সম্পর্কিত বিশেষজ্ঞ ডাক্তার</h3>';
  doctorsEl.innerHTML = titleHtml + renderSkeleton(2, 'doctor');

  try {
    const doctors = await api.getDoctors({ 
      specialty, 
      city: state.get('userCity'),
      limit: 5 
    });

    if (doctors.length === 0) {
      doctorsEl.innerHTML = titleHtml + renderEmptyState('এই বিভাগে কোনো ডাক্তার পাওয়া যায়নি।');
    } else {
      doctorsEl.innerHTML = titleHtml + doctors.map(d => renderDoctorCard(d)).join('');
    }
  } catch (error) {
    console.error('Fetch Symptom Doctors Error:', error);
    doctorsEl.innerHTML = titleHtml + `<div class="error-state">ডাক্তারদের তথ্য লোড করতে ব্যর্থ।</div>`;
  }
}
