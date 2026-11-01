/* Shared Sandika authentication and one-way login gate. */
(function () {
  'use strict';
  var USER_KEY = 'sandika_user';
  var AUTH_KEY = 'sandika_authenticated';
  var LOGIN = 'login.html';

  function readFrom(storage, key) {
    try { return storage.getItem(key); } catch (e) { return null; }
  }
  function getValue(key) {
    return readFrom(window.sessionStorage, key) || readFrom(window.localStorage, key);
  }
  function readUser() {
    if (getValue(AUTH_KEY) !== '1') return null;
    var raw = getValue(USER_KEY);
    if (raw === 'admin') return { username: 'admin', role: 'manager' };
    if (!raw) return null;
    try {
      var user = JSON.parse(raw);
      return user && typeof user.username === 'string' && user.username.trim() ? user : null;
    } catch (e) { return null; }
  }
  function setBoth(key, value) {
    try { window.sessionStorage.setItem(key, value); } catch (e) {}
    try { window.localStorage.setItem(key, value); } catch (e) {}
  }
  function saveUser(user) {
    setBoth(AUTH_KEY, '1');
    setBoth(USER_KEY, (user && user.username) || 'admin');
  }
  function clearUser() {
    [window.sessionStorage, window.localStorage].forEach(function (storage) {
      try { storage.removeItem(USER_KEY); storage.removeItem(AUTH_KEY); } catch (e) {}
    });
  }

  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var user = readUser();
  window.SandikaAuth = { read: readUser, save: saveUser, clear: clearUser, isLoggedIn: function () { return !!readUser(); } };

  // login.html and intro.html are public; every other page has exactly one
  // unauthenticated destination, avoiding intro/login/index redirect cycles.
  if (page !== LOGIN && page !== 'intro.html' && !user) {
    location.replace(LOGIN);
    return;
  }
  if (page === LOGIN && user) {
    location.replace('index.html');
    return;
  }
  document.addEventListener('DOMContentLoaded', function () {
    var action = document.querySelector('.login-btn-white');
    if (!action) return;
    if (readUser()) {
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
