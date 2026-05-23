// src/pages/doctor-profile.js
// ==========================================
// DOCTOR PROFILE PAGE
// ==========================================

import { state } from '../js/state.js';
import * as api from '../js/api.js';
import { renderSkeleton, renderEmptyState } from '../js/components.js';
import { resolveImageUrl, escapeHTML, formatFee, generateStars, showToast, modalManager } from '../js/utils.js';

export default async function renderDoctorProfilePage(params) {
  const { slug } = params;
  if (!slug) return renderEmptyState('ডাক্তারের তথ্য পাওয়া যায়নি।');

  // Show Skeleton
  setTimeout(() => loadProfileData(slug), 50);

  return `
    <div id="profile-content">
      ${renderSkeleton(1, 'doctor')}
      <div class="skeleton-line w-80 animate-pulse mt-4" style="height:200px;border-radius:12px;"></div>
    </div>
  `;
}

async function loadProfileData(slug) {
  const container = document.getElementById('profile-content');
  if (!container) return;

  try {
    // Fetch Doctor, Chambers, Reviews in parallel
    const [doctor, chambers, reviews] = await Promise.all([
      api.getDoctorBySlug(slug),
      api.getDoctorBySlug(slug).then(doc => doc ? api.getChambersByDoctor(doc.id) : []),
      api.getDoctorBySlug(slug).then(doc => doc ? api.getReviewsByDoctor(doc.id) : [])
    ]);

    if (!doctor) {
      container.innerHTML = renderEmptyState('এই ডাক্তারের কোনো প্রোফাইল পাওয়া যায়নি।');
      return;
    }

    // Log Analytics
    api.logEvent('doctor_view', 'doctor', doctor.id);

    // Update SEO
    updateProfileSEO(doctor);

    // Render UI
    container.innerHTML = renderProfileUI(doctor, chambers, reviews);    
    // Init Tabs
    initTabs();

  } catch (error) {
    console.error('Profile Load Error:', error);
    container.innerHTML = `<div class="error-state">প্রোফাইল লোড করতে সমস্যা হয়েছে।</div>`;
  }
}

function updateProfileSEO(doctor) {
  const specialty = doctor.categories?.name_bn || doctor.specialty;
  document.title = `${doctor.name_en} - ${specialty} | স্বাস্থ্য সেতু`;
  
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', `${doctor.name_en} হলেন একজন ${specialty}। চেম্বার: ${doctor.chambers?.[0]?.address || 'উত্তরবঙ্গ'}। ফি: ${formatFee(doctor.consultation_fee_min, doctor.consultation_fee_max)}`);
}

function renderProfileUI(doctor, chambers, reviews) {
  const imgSrc = resolveImageUrl('doctor-photos', doctor.photo_url);
  const imgHtml = imgSrc 
    ? `<img src="${imgSrc}" alt="${escapeHTML(doctor.name_en)}" class="profile__img">`
    : `<div class="profile__img placeholder">👨‍⚕️</div>`;

  const verifiedBadge = doctor.verification_status === 'verified' ? `<span class="badge badge--verified">✓ Verified</span>` : '';
  const specialtyBn = doctor.categories?.name_bn || doctor.specialty;

  return `
    <section class="profile-hero card">
      <div class="profile-hero__top">
        ${imgHtml}
        <div class="profile-hero__info">
          <h1 class="profile__name">${escapeHTML(doctor.name_en)} ${verifiedBadge}</h1>
          <p class="profile__degree">${escapeHTML((doctor.degree || []).join(', '))}</p>
          <span class="profile__specialty">${escapeHTML(specialtyBn)}</span>
          
          <div class="profile__meta mt-2">
            <span class="rating-stars">${generateStars(doctor.rating_avg || 0)} <span class="num">${doctor.rating_avg || '0.0'}</span></span>
            <span class="text-muted">(${doctor.rating_count || 0} রিভিউ)</span>
          </div>
        </div>
      </div>

      <div class="profile__actions">
        ${doctor.phone ? `<a href="tel:${doctor.phone}" class="btn btn--primary flex-1" onclick="logAction('call', '${doctor.id}')">📞 কল</a>` : ''}
        ${doctor.whatsapp ? `<a href="https://wa.me/91${doctor.whatsapp}" target="_blank" class="btn btn--success flex-1" onclick="logAction('whatsapp', '${doctor.id}')">💬 WhatsApp</a>` : ''}
      </div>
    </section>

    <nav class="profile-tabs" id="profile-tabs">      <button class="tab-btn active" data-tab="info">তথ্য</button>
      <button class="tab-btn" data-tab="chambers">চেম্বার (${chambers.length})</button>
      <button class="tab-btn" data-tab="reviews">রিভিউ (${reviews.length})</button>
    </nav>

    <div class="tab-content" id="tab-content">
      ${renderInfoTab(doctor)}
    </div>

    <div class="sticky-bottom-bar">
      <span class="fee-display">💰 ${formatFee(doctor.consultation_fee_min, doctor.consultation_fee_max)}</span>
      ${doctor.phone ? `<a href="tel:${doctor.phone}" class="btn btn--primary">📞 সিরিয়াল নিন</a>` : '<button class="btn btn--primary disabled">যোগাযোগ নেই</button>'}
    </div>
  `;
}

function renderInfoTab(doctor) {
  return `
    <div class="info-section">
      <h3 class="info-title">🎓 শিক্ষাগত যোগ্যতা</h3>
      <ul class="info-list">
        ${(doctor.degree || []).map(d => `<li>${escapeHTML(d)}</li>`).join('') || '<li class="text-muted">তথ্য পাওয়া যায়নি</li>'}
      </ul>
    </div>
    
    <div class="info-section">
      <h3 class="info-title">🏆 বিশেষজ্ঞতা</h3>
      <p class="text-md">${escapeHTML(doctor.bio_bn || 'সাধারণ চিকিৎসা ও পরামর্শ।')}</p>
    </div>

    ${doctor.bmdc_reg_no ? `
    <div class="info-section">
      <h3 class="info-title">🏛️ রেজিস্ট্রেশন</h3>
      <p class="text-md num">BMDC/MCI: ${escapeHTML(doctor.bmdc_reg_no)}</p>
    </div>` : ''}
  `;
}

function renderChambersTab(chambers) {
  if (!chambers || chambers.length === 0) return renderEmptyState('কোনো চেম্বারের তথ্য পাওয়া যায়নি।');
  
  return chambers.map(ch => `
    <div class="card chamber-card">
      <h3 class="chamber__name">🏥 ${escapeHTML(ch.chamber_name)}</h3>
      <p class="chamber__address">📍 ${escapeHTML(ch.address)}, ${escapeHTML(ch.cities?.name_bn || ch.city)}</p>
      
      <div class="chamber__details">
        <p>⏰ <strong>সময়:</strong> ${formatSchedule(ch.schedule)}</p>
        <p>💰 <strong>ফি:</strong> <span class="num">₹${ch.fees || 0}</span></p>
      </div>
      <div class="chamber__actions">
        ${ch.phone ? `<a href="tel:${ch.phone}" class="btn btn--secondary">📞 কল</a>` : ''}
        ${ch.map_link ? `<a href="${ch.map_link}" target="_blank" class="btn btn--primary">🗺️ ম্যাপ</a>` : ''}
      </div>
    </div>
  `).join('');
}

function renderReviewsTab(reviews, doctorId) {
  const reviewsHtml = reviews.length > 0 
    ? reviews.map(r => `
        <div class="card review-card">
          <div class="review__header">
            <div class="review__avatar">${r.reviewer_name.charAt(0)}</div>
            <div>
              <h4 class="review__name">${escapeHTML(r.reviewer_name)}</h4>
              <div class="rating-stars small">${generateStars(r.rating)}</div>
            </div>
            <span class="review__date">${new Date(r.created_at).toLocaleDateString('bn-BD')}</span>
          </div>
          <p class="review__text">${escapeHTML(r.review_text)}</p>
        </div>
      `).join('')
    : renderEmptyState('এখনো কোনো রিভিউ নেই।');

  return `
    <div class="reviews-summary card mb-4">
      <div class="summary__score num">${doctor.rating_avg || '0.0'}</div>
      <div class="summary__stars">${generateStars(doctor.rating_avg || 0)}</div>
      <div class="summary__count">${doctor.rating_count || 0} টি রিভিউ</div>
    </div>
    
    <button class="btn btn--primary w-100 mb-4" id="btn-add-review">+ রিভিউ দিন</button>
    
    <div id="reviews-list">${reviewsHtml}</div>
  `;
}

function formatSchedule(schedule) {
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) return 'যোগাযোগ করুন';
  // Simple format: "শনি-বৃহঃ: ১০টা-২টা"
  return schedule.map(s => `${s.day_bn || s.day}: ${s.open}-${s.close}`).join(', ');
}

// Tab Switching Logic
function initTabs() {
  const tabsNav = document.getElementById('profile-tabs');
  const tabContent = document.getElementById('tab-content');
  if (!tabsNav || !tabContent) return;
  tabsNav.addEventListener('click', async (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn || btn.classList.contains('active')) return;

    const tab = btn.dataset.tab;
    
    // Update Active State
    tabsNav.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Show Skeleton
    tabContent.innerHTML = renderSkeleton(2, 'doctor');

    // Fetch Data if needed (Reviews/Chambers might already be in memory, but for demo we simulate)
    // In production, pass data via state or closure to avoid re-fetching
    const doctor = state.get('currentDoctor'); // Assuming we cache it
    const chambers = state.get('currentChambers');
    const reviews = state.get('currentReviews');

    setTimeout(() => {
      if (tab === 'info') tabContent.innerHTML = renderInfoTab(doctor);
      else if (tab === 'chambers') tabContent.innerHTML = renderChambersTab(chambers);
      else if (tab === 'reviews') {
        tabContent.innerHTML = renderReviewsTab(reviews, doctor.id);
        // Attach review modal listener
        const addBtn = document.getElementById('btn-add-review');
        if (addBtn) addBtn.addEventListener('click', () => openReviewModal(doctor.id));
      }
    }, 300);
  });
}

function openReviewModal(doctorId) {
  const html = `
    <h2 class="modal__title">আপনার রিভিউ দিন</h2>
    <form id="review-form" class="form">
      <div class="form-group">
        <label>আপনার নাম</label>
        <input type="text" name="name" required class="input" placeholder="নাম লিখুন">
      </div>
      <div class="form-group">
        <label>রেটিং</label>
        <div class="star-rating" id="star-rating">
          ${[1,2,3,4,5].map(i => `<span class="star" data-value="${i}">★</span>`).join('')}
        </div>
        <input type="hidden" name="rating" id="rating-value" required>
      </div>
      <div class="form-group">
        <label>আপনার অভিজ্ঞতা</label>        <textarea name="text" required class="input textarea" rows="4" placeholder="কমপক্ষে ২০ অক্ষর লিখুন..."></textarea>
      </div>
      <button type="submit" class="btn btn--primary w-100">সাবমিট করুন</button>
    </form>
  `;
  
  modalManager.open(html);

  // Star rating logic
  const stars = document.querySelectorAll('#star-rating .star');
  const ratingInput = document.getElementById('rating-value');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = star.dataset.value;
      ratingInput.value = val;
      stars.forEach(s => s.classList.toggle('active', s.dataset.value <= val));
    });
  });

  // Form submit
  document.getElementById('review-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (formData.get('text').length < 20) {
      showToast('অনুগ্রহ করে কমপক্ষে ২০ অক্ষর লিখুন।', 'error');
      return;
    }

    try {
      await api.submitReview({
        doctor_id: doctorId,
        reviewer_name: formData.get('name'),
        rating: parseInt(formData.get('rating')),
        review_text: formData.get('text')
      });
      
      modalManager.close();
      showToast('রিভিউ সফলভাবে সাবমিট হয়েছে! অ্যাডমিন অনুমোদনের পর দেখা যাবে।', 'success');
    } catch (err) {
      showToast('রিভিউ সাবমিট করতে ব্যর্থ।', 'error');
    }
  });
}

// Global Analytics Logger
window.logAction = (type, doctorId) => {
  api.logEvent(`${type}_click`, 'doctor', doctorId);
};
