// src/js/app.js
// ==========================================
// MAIN APPLICATION ENTRY POINT
// ==========================================

import { router } from './router.js';
import { state } from './state.js';
import { getSupabase } from './supabase.js';
import { modalManager, showToast } from './utils.js';
import * as api from './api.js';

// Page Renderers
import renderHomePage from '../pages/home.js';
import renderDoctorsPage from '../pages/doctors.js';
import renderDoctorProfilePage from '../pages/doctor-profile.js';
import renderHospitalsPage from '../pages/hospitals.js';
import renderHospitalProfilePage from '../pages/hospital-profile.js';
import { renderSymptomsListPage, renderSymptomDetailPage } from '../pages/symptoms.js';
import { 
  renderMorePage, 
  renderAboutPage, 
  renderSupportPage, 
  renderPrivacyPage,
  renderSearchPage 
} from '../pages/more.js';

// ==========================================
// 1. REGISTER ALL ROUTES
// ==========================================
const registerRoutes = () => {
  // Core Pages
  router.register('/', renderHomePage, { 
    title: 'স্বাস্থ্য সেতু', 
    showBack: false 
  });
  
  router.register('/doctors', renderDoctorsPage, { 
    title: 'ডাক্তার খুঁজুন', 
    showBack: true 
  });
  
  router.register('/doctor/:slug', renderDoctorProfilePage, { 
    title: 'ডাক্তারের প্রোফাইল', 
    showBack: true 
  });
  
  router.register('/hospitals', renderHospitalsPage, { 
    title: 'হাসপাতাল ও ডায়াগনস্টিক', 
    showBack: true 
  });  
  router.register('/hospital/:slug', renderHospitalProfilePage, { 
    title: 'হাসপাতালের বিস্তারিত', 
    showBack: true 
  });
  
  router.register('/symptoms', renderSymptomsListPage, { 
    title: 'উপসর্গ অনুযায়ী ডাক্তার', 
    showBack: true 
  });
  
  router.register('/symptoms/:slug', renderSymptomDetailPage, { 
    title: 'উপসর্গের বিস্তারিত', 
    showBack: true 
  });

  // Secondary Pages
  router.register('/more', renderMorePage, { 
    title: 'আরো সেবা', 
    showBack: false 
  });
  
  router.register('/about', renderAboutPage, { 
    title: 'আমাদের সম্পর্কে', 
    showBack: true 
  });
  
  router.register('/support', renderSupportPage, { 
    title: 'যোগাযোগ ও সাপোর্ট', 
    showBack: true 
  });
  
  router.register('/privacy', renderPrivacyPage, { 
    title: 'প্রাইভেসি পলিসি', 
    showBack: true 
  });
  
  router.register('/search', renderSearchPage, { 
    title: 'খুঁজুন', 
    showBack: true,
    showSearch: false 
  });
};

// ==========================================
// 2. PREFETCH CORE DATA
// ==========================================
const prefetchCoreData = async () => {
  try {
    // Run in parallel for speed    const [categories, cities] = await Promise.all([
      api.getCategories(),
      api.getCities()
    ]);
    
    state.set('categories', categories || []);
    state.set('cities', cities || []);
    state.set('isInitialized', true);
    
  } catch (error) {
    console.error('Prefetch failed:', error);
    // App can still function, just with delayed data
    state.set('isInitialized', true);
  }
};

// ==========================================
// 3. SERVICE WORKER REGISTRATION
// ==========================================
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('✅ SW registered:', registration.scope);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showToast('নতুন আপডেট এসেছে! পেজ রিলোড করুন।', 'info', 5000);
          }
        });
      });
    } catch (error) {
      console.warn('SW registration failed:', error);
    }
  }
};

// ==========================================
// 4. GLOBAL ERROR HANDLER
// ==========================================
const setupErrorHandlers = () => {
  // Uncaught JS errors
  window.addEventListener('error', (e) => {
    console.error('Global Error:', e.message);
    showToast('একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।', 'error');  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise:', e.reason);
    showToast('ডেটা লোড করতে সমস্যা হচ্ছে।', 'error');
  });

  // Offline/Online detection
  window.addEventListener('online', () => {
    showToast('ইন্টারনেট সংযোগ ফিরে এসেছে।', 'success');
    // Optionally trigger data refresh
  });

  window.addEventListener('offline', () => {
    showToast('ইন্টারনেট সংযোগ বিচ্ছিন্ন। সংরক্ষিত তথ্য দেখানো হচ্ছে।', 'error', 5000);
  });
};

// ==========================================
// 5. EMERGENCY FAB SETUP
// ==========================================
const setupEmergencyFAB = () => {
  const fabTrigger = document.querySelector('.fab__trigger');
  const fabMenu = document.getElementById('fab-menu');
  
  if (!fabTrigger || !fabMenu) return;

  fabTrigger.addEventListener('click', async () => {
    const isOpen = fabMenu.classList.contains('active');
    
    if (isOpen) {
      fabMenu.classList.remove('active');
      fabTrigger.setAttribute('aria-expanded', 'false');
    } else {
      // Load emergency contacts on first open
      if (fabMenu.children.length === 0) {
        fabMenu.innerHTML = '<div class="loading">লোড হচ্ছে...</div>';
        try {
          const contacts = await api.getEmergencyContacts(state.get('userCity'));
          fabMenu.innerHTML = contacts.slice(0, 5).map(c => `
            <a href="tel:${c.phone}" class="fab__item">
              <span class="fab__item-icon">${getEmergencyIcon(c.category)}</span>
              <span class="fab__item-label">${c.title_bn || c.title}</span>
            </a>
          `).join('');
        } catch (e) {
          fabMenu.innerHTML = `
            <a href="tel:102" class="fab__item">
              <span class="fab__item-icon">🚑</span>              <span class="fab__item-label">অ্যাম্বুলেন্স (102)</span>
            </a>
            <a href="tel:104" class="fab__item">
              <span class="fab__item-icon">📞</span>
              <span class="fab__item-label">হেল্থ হেল্পলাইন (104)</span>
            </a>
          `;
        }
      }
      fabMenu.classList.add('active');
      fabTrigger.setAttribute('aria-expanded', 'true');
    }
  });

  // Close FAB on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.fab')) {
      fabMenu.classList.remove('active');
      fabTrigger.setAttribute('aria-expanded', 'false');
    }
  });
};

const getEmergencyIcon = (category) => {
  const icons = {
    ambulance: '🚑',
    blood_bank: '🩸',
    police: '🚓',
    fire: '🚒',
    helpline: '📞',
    hospital_emergency: '🏥'
  };
  return icons[category] || '📞';
};

// ==========================================
// 6. APP INITIALIZATION
// ==========================================
const initApp = async () => {
  console.log('🚀 Initializing Uttarbanga Swasthya Setu...');
  
  // Initialize Supabase
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('⚠️ Supabase not initialized. Check credentials.');
  }

  // Initialize Modal Manager
  modalManager.init();
  // Setup Global Error Handlers
  setupErrorHandlers();

  // Register Routes
  registerRoutes();

  // Prefetch Core Data (non-blocking)
  prefetchCoreData();

  // Register Service Worker (for PWA)
  registerServiceWorker();

  // Setup Emergency FAB
  setupEmergencyFAB();

  // Trigger Initial Route Resolution
  if (!window.location.hash) {
    window.location.hash = '#/';
  }

  // Track App Load
  console.log('✅ App Ready');
};

// Run on DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
