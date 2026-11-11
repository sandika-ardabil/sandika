/* Private-area client-side login gate. Public pages never require authentication. */
(function () {
  'use strict';
  var KEY = 'sandika_user';
  var LOGIN = 'login.html';
  var PRIVATE_PAGES = ['cartable.html', 'external-letter.html', 'clearance.html'];
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
  if (PRIVATE_PAGES.indexOf(page) !== -1 && !user) {
    var target = location.pathname.split('/').pop() || page;
    if (location.search) target += location.search;
    location.replace(LOGIN + '?return=' + encodeURIComponent(target));
    return;
  }
  if (page === LOGIN && user && new URLSearchParams(location.search).get('force') !== '1') {
    location.replace('index.html');
    return;
  }
  document.addEventListener('DOMContentLoaded', function () {
    var action = document.querySelector('.login-btn-white');
    if (!action) return;
    if (readUser()) {
      action.textContent = 'خروج کاربران';
      action.href = '#logout';
      action.onclick = function (event) { event.preventDefault(); clearUser(); location.replace(LOGIN); };
    } else {
      action.textContent = 'ورود کاربران'; action.href = LOGIN; action.onclick = null;
    }
  });
})();
