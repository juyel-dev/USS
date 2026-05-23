// src/js/components.js
// ==========================================
// REUSABLE UI COMPONENTS (Template Literals)
// ==========================================

import { formatFee, generateStars, getInitials, resolveImageUrl, escapeHTML } from './utils.js';

// ==========================================
// 1. DOCTOR CARD
// ==========================================
export const renderDoctorCard = (doctor, variant = 'compact') => {
  const imgSrc = resolveImageUrl('doctor-photos', doctor.photo_url);
  const imgHtml = imgSrc 
    ? `<img src="${imgSrc}" alt="${escapeHTML(doctor.name_en)}" class="doctor-card__img" loading="lazy">`
    : `<div class="doctor-card__img placeholder">${getInitials(doctor.name_en)}</div>`;

  const specialtyBn = doctor.categories?.name_bn || doctor.specialty;
  const verifiedBadge = doctor.verification_status === 'verified' ? `<span class="badge-verified" title="Verified">✓</span>` : '';
  
  return `
    <article class="card doctor-card" data-slug="${doctor.slug}">
      ${imgHtml}
      <div class="doctor-card__info">
        <h3 class="doctor-card__name">
          ${escapeHTML(doctor.name_en)} ${verifiedBadge}
        </h3>
        <p class="doctor-card__degree">${escapeHTML((doctor.degree || []).join(', '))}</p>
        <span class="doctor-card__specialty">${escapeHTML(specialtyBn)}</span>
        
        <div class="doctor-card__meta">
          <span class="rating-stars">${generateStars(doctor.rating_avg || 0)} <span class="num">${doctor.rating_avg || '0.0'}</span></span>
          <span>(${doctor.rating_count || 0} রিভিউ)</span>
        </div>

        <div class="doctor-card__meta mt-2">
          <span>💰 ${formatFee(doctor.consultation_fee_min, doctor.consultation_fee_max)}</span>
        </div>

        <div class="doctor-card__actions">
          ${doctor.phone ? `<a href="tel:${doctor.phone}" class="btn btn--secondary">📞 কল</a>` : ''}
          ${doctor.whatsapp ? `<a href="https://wa.me/91${doctor.whatsapp}" target="_blank" class="btn btn--success">💬 WhatsApp</a>` : ''}
          <a href="#/doctor/${doctor.slug}" class="btn btn--primary">বিস্তারিত</a>
        </div>
      </div>
    </article>
  `;
};

// ==========================================
// 2. HOSPITAL CARD// ==========================================
export const renderHospitalCard = (hospital) => {
  const imgSrc = resolveImageUrl('hospital-images', hospital.cover_image_url);
  const imgHtml = imgSrc 
    ? `<img src="${imgSrc}" alt="${escapeHTML(hospital.name_en)}" class="hospital-card__img" loading="lazy">`
    : `<div class="hospital-card__img placeholder">🏥</div>`;

  const emergencyBadge = hospital.has_emergency ? `<span class="badge badge--emergency">🚑 ২৪/৭ জরুরি</span>` : '';

  return `
    <article class="card hospital-card" data-slug="${hospital.slug}">
      ${imgHtml}
      <div class="hospital-card__info">
        <h3 class="hospital-card__name">${escapeHTML(hospital.name_en)}</h3>
        <p class="hospital-card__address">📍 ${escapeHTML(hospital.address || '')}, ${escapeHTML(hospital.city || '')}</p>
        
        <div class="hospital-card__badges">
          ${emergencyBadge}
          ${hospital.has_icu ? '<span class="badge">ICU</span>' : ''}
        </div>

        <div class="hospital-card__actions">
          ${hospital.phone_primary ? `<a href="tel:${hospital.phone_primary}" class="btn btn--secondary">📞 কল</a>` : ''}
          <a href="#/hospital/${hospital.slug}" class="btn btn--primary">বিস্তারিত</a>
        </div>
      </div>
    </article>
  `;
};

// ==========================================
// 3. CATEGORY GRID ITEM
// ==========================================
export const renderCategoryCard = (category) => {
  const iconSrc = resolveImageUrl('category-icons', category.icon_url);
  const iconHtml = iconSrc 
    ? `<img src="${iconSrc}" alt="${escapeHTML(category.name_bn)}" class="category-card__icon">`
    : `<div class="category-card__icon placeholder">🩺</div>`;

  return `
    <a href="#/doctors?specialty=${category.specialty}" class="category-card">
      ${iconHtml}
      <span class="category-card__label">${escapeHTML(category.name_bn)}</span>
    </a>
  `;
};

// ==========================================
// 4. SYMPTOM CARD
// ==========================================export const renderSymptomCard = (symptom) => {
  const imgSrc = resolveImageUrl('symptom-images', symptom.image_url);
  
  return `
    <a href="#/symptoms/${symptom.slug}" class="symptom-card">
      <div class="symptom-card__img-wrap">
        ${imgSrc ? `<img src="${imgSrc}" alt="${escapeHTML(symptom.title_bn)}" loading="lazy">` : ''}
        <div class="symptom-card__overlay"></div>
      </div>
      <h3 class="symptom-card__title">${escapeHTML(symptom.title_bn)}</h3>
    </a>
  `;
};

// ==========================================
// 5. SKELETON LOADERS
// ==========================================
export const renderSkeleton = (count = 3, type = 'doctor') => {
  let html = '<div class="skeleton-container">';
  for (let i = 0; i < count; i++) {
    if (type === 'doctor') {
      html += `
        <div class="skeleton-card">
          <div class="skeleton-image animate-pulse"></div>
          <div style="flex:1">
            <div class="skeleton-line w-80 animate-pulse"></div>
            <div class="skeleton-line w-60 animate-pulse"></div>
            <div class="skeleton-line w-40 animate-pulse"></div>
          </div>
        </div>`;
    } else if (type === 'grid') {
      html += `
        <div class="skeleton-grid-item">
          <div class="skeleton-image animate-pulse" style="height:60px;width:60px;border-radius:12px;margin:0 auto;"></div>
          <div class="skeleton-line w-80 animate-pulse" style="margin:8px auto 0;"></div>
        </div>`;
    }
  }
  html += '</div>';
  return html;
};

// ==========================================
// 6. EMPTY STATE
// ==========================================
export const renderEmptyState = (message = 'কোনো তথ্য পাওয়া যায়নি') => {
  return `
    <div class="empty-state">
      <div class="empty-state__icon">🔍</div>
      <h3 class="empty-state__title">${message}</h3>      <p class="empty-state__desc">অনুগ্রহ করে অন্য কোনো কীওয়ার্ড দিয়ে চেষ্টা করুন অথবা ফিল্টার পরিবর্তন করুন।</p>
    </div>
  `;
};
