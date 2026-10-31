/* Sandika login flow: shared client-side gate */
(function () {
  'use strict';
  var THEME_KEY = 'sandika_theme';
  function readTheme() {
    try { return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'; } catch (e) { return 'dark'; }
  }
  function applyTheme(theme) {
    theme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    var button = document.querySelector('[data-theme-toggle]');
    if (button) {
      var icon = button.querySelector('.theme-toggle-icon');
      var label = button.querySelector('.theme-toggle-label');
      if (icon) icon.textContent = theme === 'light' ? '🌙' : '☀️';
      if (label) label.textContent = theme === 'light' ? 'تیره' : 'روشن';
      button.setAttribute('aria-label', theme === 'light' ? 'فعال‌کردن پوستهٔ تیره' : 'فعال‌کردن پوستهٔ روشن');
      button.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
      button.title = theme === 'light' ? 'تغییر به پوستهٔ تیره' : 'تغییر به پوستهٔ روشن';
    }
  }
  applyTheme(readTheme());
  var KEY = 'sandika_user';
  var LOGIN = 'login.html';
  var INTRO = 'intro.html';
  function readUser() {
    var raw = null;
    try { raw = sessionStorage.getItem(KEY) || localStorage.getItem(KEY); } catch (e) {}
    if (!raw) return null;
    try {
      var user = JSON.parse(raw);
      return user && typeof user.username === 'string' && user.username.trim() ? user : null;
    } catch (e) { return null; }
  }
  function clearUser() {
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    try { localStorage.removeItem(KEY); } catch (e) {}
  }
  function saveUser(user) {
    var raw = JSON.stringify(user);
    try { sessionStorage.setItem(KEY, raw); } catch (e) {}
    try { localStorage.setItem(KEY, raw); } catch (e) {}
  }
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var user = readUser();
  window.SandikaAuth = { read: readUser, save: saveUser, clear: clearUser, isLoggedIn: function(){ return !!readUser(); } };
  if (page !== LOGIN && page !== INTRO && !user) {
    var target = location.pathname.split('/').pop() || 'index.html';
    if (location.search) target += location.search;
    location.replace(LOGIN + '?return=' + encodeURIComponent(target));
    return;
  }
  if (page === LOGIN && user && new URLSearchParams(location.search).get('force') !== '1') {
    location.replace('index.html');
    return;
  }
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(readTheme());
    var themeButton = document.querySelector('[data-theme-toggle]');
    if (themeButton) themeButton.addEventListener('click', function () {
      applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    });
    var action = document.querySelector('.login-btn-white');
    if (!action) return;
    var current = readUser();
    if (current) {
      action.textContent = 'خروج کاربران';
      action.href = '#logout';
      action.onclick = function (event) {
        event.preventDefault();
        clearUser();
        location.replace(LOGIN);
      };
    } else {
      action.textContent = 'ورود کاربران';
      action.href = LOGIN;
      action.onclick = null;
    }
  });
})();
