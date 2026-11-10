/* Sandika login flow: shared client-side gate */
(function () {
  'use strict';
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
