// src/js/router.js
// ==========================================
// VANILLA JS SPA ROUTER
// ==========================================

import { state } from './state.js';

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.outlet = document.getElementById('main-content');
    this.topbarTitle = document.getElementById('topbar-title');
    this.backBtn = document.getElementById('topbar-back');
    this.searchBtn = document.getElementById('topbar-search');
    this.navbar = document.getElementById('bottom-navbar');
    
    // Bind events
    window.addEventListener('hashchange', () => this.resolve());
    window.addEventListener('load', () => this.resolve());
    
    // Back button logic
    if (this.backBtn) {
      this.backBtn.addEventListener('click', () => window.history.back());
    }
  }

  /**
   * Register a route
   * @param {string} path - Route path (e.g., '/', '/doctor/:slug')
   * @param {function} handler - Async function returning HTML string
   * @param {object} options - { title, showBack, showNavbar }
   */
  register(path, handler, options = {}) {
    this.routes[path] = { handler, options };
  }

  /**
   * Navigate programmatically
   * @param {string} path - Target path
   */
  navigate(path) {
    window.location.hash = path;
  }

  /**
   * Resolve current URL and render view
   */
  async resolve() {
    // Get hash, remove '#', default to '/'    const hash = window.location.hash.slice(1) || '/';
    const { route, params } = this.matchRoute(hash);

    if (!route) {
      this.render404();
      return;
    }

    // Update Global State
    state.set('currentRoute', { path: hash, params });

    // UI Setup (Topbar & Navbar)
    this.updateUI(route.options, hash);

    // Show Loading Skeleton
    this.showSkeleton();

    try {
      // Scroll to top on navigation
      window.scrollTo(0, 0);

      // Render Content
      const html = await route.handler(params);
      
      // Transition Effect
      this.outlet.style.opacity = '0';
      setTimeout(() => {
        this.outlet.innerHTML = html;
        this.outlet.style.opacity = '1';
        this.attachEventListeners();
      }, 100); // Small delay for fade effect

    } catch (error) {
      console.error('Router Error:', error);
      this.renderError(error.message);
    }
  }

  /**
   * Match URL against registered routes (supports :params)
   */
  matchRoute(url) {
    // Clean query params for matching
    const [path, queryString] = url.split('?');
    const queryParams = new URLSearchParams(queryString);

    for (const routePath in this.routes) {
      // Convert "/doctor/:slug" to regex "^\/doctor\/([^\/]+)$"
      const regex = new RegExp(`^${routePath.replace(/:[^\s/]+/g, '([\\w-]+)')}$`);
      const match = path.match(regex);
      if (match) {
        // Extract param names
        const paramNames = (routePath.match(/:[^\s/]+/g) || []).map(p => p.slice(1));
        const params = {};
        
        paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        // Add query params
        for (const [key, value] of queryParams.entries()) {
          params[key] = value;
        }

        return { route: this.routes[routePath], params };
      }
    }
    return { route: null, params: {} };
  }

  /**
   * Update App Shell UI (Topbar, Navbar visibility)
   */
  updateUI(options, currentPath) {
    const { title, showBack = false, showSearch = true, showNavbar = true } = options;

    // Title
    if (this.topbarTitle) this.topbarTitle.textContent = title || 'স্বাস্থ্য সেতু';

    // Back Button
    if (this.backBtn) this.backBtn.style.display = showBack ? 'flex' : 'none';

    // Search Button
    if (this.searchBtn) {
      this.searchBtn.style.display = showSearch ? 'flex' : 'none';
      this.searchBtn.onclick = () => this.navigate('/search');
    }

    // Bottom Navbar
    if (this.navbar) {
      this.navbar.style.display = showNavbar ? 'flex' : 'none';
      
      // Active State Logic
      const navItems = this.navbar.querySelectorAll('.navbar__item');
      navItems.forEach(item => {
        const route = item.getAttribute('data-route');
        // Simple active matching (exact or starts with for nested)
        const isActive = currentPath === route || 
                        (route !== '/' && currentPath.startsWith(route));        
        item.classList.toggle('active', isActive);
      });
    }
  }

  showSkeleton() {
    this.outlet.innerHTML = `
      <div class="skeleton-container">
        <div class="skeleton-card"><div class="skeleton-image animate-pulse"></div><div class="skeleton-line w-60 animate-pulse"></div><div class="skeleton-line w-40 animate-pulse"></div></div>
        <div class="skeleton-card"><div class="skeleton-image animate-pulse"></div><div class="skeleton-line w-60 animate-pulse"></div><div class="skeleton-line w-40 animate-pulse"></div></div>
        <div class="skeleton-card"><div class="skeleton-image animate-pulse"></div><div class="skeleton-line w-60 animate-pulse"></div><div class="skeleton-line w-40 animate-pulse"></div></div>
      </div>
    `;
  }

  render404() {
    this.outlet.innerHTML = `
      <div class="empty-state">
        <h2>৪০৪ - পেজটি খুঁজে পাওয়া যায়নি</h2>
        <p>আপনি যে পেজটি খুঁজছেন তা বিদ্যমান নেই।</p>
        <button class="btn btn--primary" onclick="window.location.hash='#/'">হোম পেজে যান</button>
      </div>
    `;
  }

  renderError(msg) {
    this.outlet.innerHTML = `
      <div class="empty-state">
        <h2 class="text-emergency">⚠️ কিছু একটা ভুল হয়েছে</h2>
        <p>${msg || 'ডেটা লোড করতে সমস্যা হচ্ছে।'}</p>
        <button class="btn btn--secondary" onclick="location.reload()">আবার চেষ্টা করুন</button>
      </div>
    `;
  }

  /**
   * Hook for pages to attach event listeners after render
   */
  attachEventListeners() {
    // Dispatch custom event for pages to listen to
    window.dispatchEvent(new CustomEvent('route:changed'));
  }
}

export const router = new Router();
