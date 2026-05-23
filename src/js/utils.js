// src/js/utils.js
// ==========================================
// UTILITIES & GLOBAL UI HELPERS
// ==========================================

import { getPublicUrl } from './supabase.js';

// ==========================================
// 1. TOAST NOTIFICATIONS
// ==========================================
export const showToast = (message, type = 'success', duration = 3000) => {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span class="toast__icon">${icon}</span><span class="toast__msg">${message}</span>`;
  
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

// ==========================================
// 2. MODAL MANAGER
// ==========================================
export const modalManager = {
  overlay: document.getElementById('modal-overlay'),
  container: document.getElementById('modal-container'),

  open(htmlContent) {
    if (!this.overlay || !this.container) return;
    this.container.innerHTML = htmlContent;
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
  },

  close() {
    if (!this.overlay) return;
    this.overlay.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {      if (this.container) this.container.innerHTML = '';
    }, 300);
  },

  init() {
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });
    }
  }
};

// ==========================================
// 3. FORMATTERS & HELPERS
// ==========================================

export const formatFee = (min, max) => {
  if (!min && !max) return 'ফি জানতে কল করুন';
  if (min === max) return `₹${min}`;
  return `₹${min} - ₹${max}`;
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export const generateStars = (rating) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  let html = '';
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      html += `<svg class="star-icon star-full" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
    } else if (i === fullStars && hasHalf) {
      html += `<svg class="star-icon star-half" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" opacity="0.3"/><path d="M12 2v15.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/></svg>`;
    } else {
      html += `<svg class="star-icon star-empty" viewBox="0 0 24 24" fill="currentColor" opacity="0.2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
    }
  }
  return html;
};

export const resolveImageUrl = (bucket, path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return getPublicUrl(bucket, path);
};
export const truncateText = (text, maxLength = 60) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Basic XSS prevention for user-generated content
export const escapeHTML = (str) => {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};
