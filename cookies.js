/* ============================================================
   OLYMPUS — cookies.js 
   ============================================================ */

(function () {
  'use strict';

  var CONSENT_KEY = 'olympus_cookie_consent';
  var CONSENT_VERSION = 1;
  var CONSENT_DAYS = 365;

  var banner, modal, chkAnalytics, chkMarketing, lastFocusedEl;

  function storageGet(key) {
    try { return window.localStorage.getItem(key); }
    catch (e) { console.warn('Olympus cookies: localStorage no disponible', e); return null; }
  }
  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); return true; }
    catch (e) { console.warn('Olympus cookies: no se pudo guardar en localStorage', e); return false; }
  }
  function storageRemove(key) {
    try { window.localStorage.removeItem(key); } catch (e) {}
  }

  function readConsent() {
    var raw = storageGet(CONSENT_KEY);
    if (!raw) return null;
    try {
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return null;
      if (data.version !== CONSENT_VERSION) return null;
      if (!data.expiresAt || Date.now() > data.expiresAt) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function writeConsent(analytics, marketing) {
    var data = {
      version: CONSENT_VERSION,
      essential: true,
      analytics: !!analytics,
      marketing: !!marketing,
      grantedAt: Date.now(),
      expiresAt: Date.now() + CONSENT_DAYS * 24 * 60 * 60 * 1000
    };
    storageSet(CONSENT_KEY, JSON.stringify(data));
    applyConsent(data);
    return data;
  }

  function applyConsent(data) {
    document.dispatchEvent(new CustomEvent('olympus:cookie-consent', { detail: data }));
    if (data.analytics) { /* activar analítica real aquí */ }
    if (data.marketing) { /* activar marketing real aquí */ }
  }

  function showBanner() { if (banner) banner.classList.add('show'); }
  function hideBanner() { if (banner) banner.classList.remove('show'); }

  function openModal() {
    if (!modal) return;
    lastFocusedEl = document.activeElement;
    var current = readConsent();
    if (chkAnalytics) chkAnalytics.checked = current ? !!current.analytics : false;
    if (chkMarketing) chkMarketing.checked = current ? !!current.marketing : false;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.addEventListener('keydown', onModalKeydown);
    var closeBtn = modal.querySelector('.cookie-config-close');
    if (closeBtn) closeBtn.focus();
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', onModalKeydown);
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') lastFocusedEl.focus();
  }
  function onModalKeydown(e) {
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key === 'Tab') {
      var focusables = modal.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  window.acceptAllCookies = function () { writeConsent(true, true); hideBanner(); };
  window.rejectNonEssential = function () { writeConsent(false, false); hideBanner(); };
  window.openCookieConfig = function () { openModal(); };
  window.closeCookieConfig = function () { closeModal(); };
  window.saveCookiePreferences = function () {
    var analytics = chkAnalytics ? chkAnalytics.checked : false;
    var marketing = chkMarketing ? chkMarketing.checked : false;
    writeConsent(analytics, marketing);
    closeModal();
    hideBanner();
  };
  window.configureCookies = function () { openModal(); };
  window.closeCookieBanner = function () { hideBanner(); };
  window.clearOlympusCookieConsent = function () {
    storageRemove(CONSENT_KEY);
    location.reload();
  };

  function init() {
    banner = document.getElementById('cookie-banner');
    modal = document.getElementById('cookie-config-modal');
    chkAnalytics = document.getElementById('cookie-analytics');
    chkMarketing = document.getElementById('cookie-marketing');

    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
      });
    }
    var footerLink = document.getElementById('footer-cookie-settings');
    if (footerLink) {
      footerLink.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
      });
    }

    var consent = readConsent();
    if (consent) {
      applyConsent(consent);
      return;
    }
    showBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('load', function () {
    if (!readConsent()) showBanner();
  });
})();