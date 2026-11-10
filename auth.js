/* Sandika client-side authentication (no backend required). */
(function () {
  'use strict';
  var USER_KEY = 'sandika_user';
  var AUTH_KEY = 'sandika_authenticated';
  var LOGIN = 'login.html';
  function get(store, key) { try { return store.getItem(key); } catch (e) { return null; } }
  function remove(store, key) { try { store.removeItem(key); } catch (e) {} }
  function parseUser(raw) {
    if (!raw) return null;
    if (raw === 'admin') return { username: 'admin', role: 'manager' };
    try {
      var value = JSON.parse(raw);
      if (typeof value === 'string' && value === 'admin') return { username: 'admin', role: 'manager' };
      return value && typeof value.username === 'string' && value.username.trim() ? value : null;
    } catch (e) { return null; }
  }
  function readUser() {
    var sessionAuth = get(window.sessionStorage, AUTH_KEY) === '1';
    var localAuth = get(window.localStorage, AUTH_KEY) === '1';
    var user = parseUser(get(window.sessionStorage, USER_KEY)) || parseUser(get(window.localStorage, USER_KEY));
    return (sessionAuth || localAuth) && user ? user : null;
  }
  function saveUser(user) {
    var name = user && user.username ? user.username : 'admin';
    [[window.sessionStorage, USER_KEY, name], [window.localStorage, USER_KEY, name],
     [window.sessionStorage, AUTH_KEY, '1'], [window.localStorage, AUTH_KEY, '1']].forEach(function (item) {
      try { item[0].setItem(item[1], item[2]); } catch (e) {}
    });
    return !!readUser();
  }
  function clearUser() {
    [window.sessionStorage, window.localStorage].forEach(function (store) {
      remove(store, USER_KEY); remove(store, AUTH_KEY);
    });
  }
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  window.SandikaAuth = { read: readUser, save: saveUser, clear: clearUser, isLoggedIn: function () { return !!readUser(); } };
  // index.html owns its unauthenticated-entry redirect; exempt it to prevent competing redirects.
  if (page !== LOGIN && page !== 'intro.html' && page !== 'index.html' && !readUser()) {
    var target = location.pathname.split('/').pop() || 'index.html';
    if (location.search) target += location.search;
    location.replace(LOGIN + '?return=' + encodeURIComponent(target));
    return;
  }
  if (page === LOGIN && readUser() && new URLSearchParams(location.search).get('force') !== '1') {
    location.replace('index.html');
    return;
  }
  document.addEventListener('DOMContentLoaded', function () {
    var action = document.querySelector('.login-btn-white');
    if (!action) return;
    if (readUser()) {
      action.textContent = 'خروج کاربران'; action.href = '#logout';
      action.onclick = function (event) { event.preventDefault(); clearUser(); location.replace(LOGIN); };
    } else { action.textContent = 'ورود کاربران'; action.href = LOGIN; action.onclick = null; }
  });
})();
