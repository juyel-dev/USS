// src/js/state.js
// ==========================================
// GLOBAL STATE & CACHE MANAGER
// ==========================================

class StateManager {
  constructor() {
    this.store = {
      // Core Data
      categories: [],
      cities: [],
      doctors: [],
      hospitals: [],
      symptoms: [],
      
      // UI State
      currentRoute: { path: '/', params: {} },
      userCity: localStorage.getItem('user_city') || 'cooch_behar', // Default
      isLoading: false,
      
      // Cache Flags
      isInitialized: false,
    };
    this.listeners = new Map();
  }

  /**
   * Get state value
   * @param {string} key 
   */
  get(key) {
    return this.store[key];
  }

  /**
   * Set state value and notify listeners
   * @param {string} key 
   * @param {any} value 
   */
  set(key, value) {
    const oldValue = this.store[key];
    this.store[key] = value;
    
    // Simple change detection
    if (oldValue !== value) {
      this.notify(key, value);
    }
  }

  /**
   * Subscribe to state changes
   * @param {string} key 
   * @param {function} callback 
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);
    
    // Return unsubscribe function
    return () => {
      const subs = this.listeners.get(key);
      const index = subs.indexOf(callback);
      if (index > -1) subs.splice(index, 1);
    };
  }

  /**
   * Notify subscribers
   */
  notify(key, value) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(cb => cb(value));
    }
  }

  /**
   * Helper: Update User City (Persists to LocalStorage)
   */
  setCity(citySlug) {
    localStorage.setItem('user_city', citySlug);
    this.set('userCity', citySlug);
    // Trigger reload of location-dependent data if needed
    window.dispatchEvent(new CustomEvent('city:changed', { detail: citySlug }));
  }
}

export const state = new StateManager();
