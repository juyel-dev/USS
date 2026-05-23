// src/pages/hospital-profile.js
// ==========================================
// HOSPITAL DETAIL PAGE
// ==========================================

import * as api from '../js/api.js';
import { renderSkeleton, renderEmptyState } from '../js/components.js';
import { resolveImageUrl, escapeHTML, generateStars } from '../js/utils.js';

export default async function renderHospitalProfilePage(params) {
  const { slug } = params;
  if (!slug) return renderEmptyState('হাসপাতালের তথ্য পাওয়া যায়নি।');

  setTimeout(() => loadHospitalData(slug), 50);

  return `
    <div id="hospital-profile-content">
      ${renderSkeleton(1, 'doctor')}
      <div class="skeleton-line w-80 animate-pulse mt-4" style="height:200px;border-radius:12px;"></div>
    </div>
  `;
}

async function loadHospitalData(slug) {
  const container = document.getElementById('hospital-profile-content');
  if (!container) return;

  try {
    const hospital = await api.getHospitalBySlug(slug);

    if (!hospital) {
      container.innerHTML = renderEmptyState('এই হাসপাতালের কোনো প্রোফাইল পাওয়া যায়নি।');
      return;
    }

    // Update SEO
    document.title = `${hospital.name_en} - ${hospital.city || 'উত্তরবঙ্গ'} | স্বাস্থ্য সেতু`;

    container.innerHTML = renderHospitalUI(hospital);

  } catch (error) {
    console.error('Hospital Profile Error:', error);
    container.innerHTML = `<div class="error-state">তথ্য লোড করতে সমস্যা হয়েছে।</div>`;
  }
}

function renderHospitalUI(h) {
  const imgSrc = resolveImageUrl('hospital-images', h.cover_image_url);
  const imgHtml = imgSrc 
    ? `<img src="${imgSrc}" alt="${escapeHTML(h.name_en)}" class="hospital-hero__img">`    : `<div class="hospital-hero__img placeholder">🏥</div>`;

  const emergencyBadge = h.has_emergency ? `<span class="badge badge--emergency">🚑 ২৪/৭ জরুরি</span>` : '';
  
  return `
    <section class="hospital-hero card">
      ${imgHtml}
      <div class="hospital-hero__info mt-3">
        <h1 class="hospital__name">${escapeHTML(h.name_en)}</h1>
        <p class="hospital__address">📍 ${escapeHTML(h.address || '')}, ${escapeHTML(h.city || '')}</p>
        
        <div class="hospital__badges mt-2">
          ${emergencyBadge}
          ${h.has_icu ? '<span class="badge">ICU</span>' : ''}
          ${h.has_ambulance ? '<span class="badge">🚑 অ্যাম্বুলেন্স</span>' : ''}
          ${h.has_blood_bank ? '<span class="badge">🩸 ব্লাড ব্যাংক</span>' : ''}
        </div>

        <div class="hospital__rating mt-2">
          ${generateStars(h.rating_avg || 0)} <span class="num">${h.rating_avg || '0.0'}</span> <span class="text-muted">(${h.rating_count || 0} রিভিউ)</span>
        </div>
      </div>

      <div class="hospital__actions mt-4">
        ${h.phone_primary ? `<a href="tel:${h.phone_primary}" class="btn btn--primary flex-1">📞 কল করুন</a>` : ''}
        ${h.whatsapp ? `<a href="https://wa.me/91${h.whatsapp}" target="_blank" class="btn btn--success flex-1">💬 WhatsApp</a>` : ''}
        ${h.map_link ? `<a href="${h.map_link}" target="_blank" class="btn btn--secondary flex-1">🗺️ ম্যাপ</a>` : ''}
      </div>
    </section>

    <section class="info-section card mt-4">
      <h3 class="info-title">🏥 সেবাসমূহ ও পরীক্ষা-নিরীক্ষা</h3>
      <div class="tags-wrap">
        ${(h.services && h.services.length > 0) 
          ? h.services.map(s => `<span class="tag">${escapeHTML(s)}</span>`).join('') 
          : '<span class="text-muted">সেবার তালিকা পাওয়া যায়নি।</span>'}
      </div>
    </section>

    <section class="info-section card mt-4">
      <h3 class="info-title">⏰ খোলার সময়সূচি</h3>
      <div class="schedule-list">
        ${formatOpenHours(h.open_hours)}
      </div>
    </section>

    ${h.hotline ? `
    <section class="info-section card mt-4 emergency-card">
      <h3 class="info-title text-emergency">🚨 জরুরি হটলাইন</h3>
      <a href="tel:${h.hotline}" class="hotline-number num">${escapeHTML(h.hotline)}</a>    </section>` : ''}
  `;
}

function formatOpenHours(hours) {
  if (!hours || !Array.isArray(hours) || hours.length === 0) {
    return '<p class="text-muted">সময়সূচি পাওয়া যায়নি। যোগাযোগ করুন।</p>';
  }

  // Group by days or just list them
  return `
    <table class="schedule-table">
      <tbody>
        ${hours.map(h => `
          <tr>
            <td class="schedule-day">${escapeHTML(h.day_bn || h.day || '')}</td>
            <td class="schedule-time num">${escapeHTML(h.open || '')} - ${escapeHTML(h.close || '')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
