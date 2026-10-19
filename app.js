// انجمن صنفی شرکت‌های پخش دارو استان اردبیل — app.js
(function () {
  'use strict';

  // 1) Mobile menu toggle
  var menuBtn = document.getElementById('menuBtn');
  var mainNav = document.getElementById('mainNav');
  if (menuBtn && mainNav) {
    menuBtn.addEventListener('click', function () {
      mainNav.classList.toggle('open');
    });
  }

  // 2) Active nav highlighting based on current page filename
  var links = document.querySelectorAll('#mainNav a');
  var current = (location.pathname.split('/').pop() || 'index.html');
  links.forEach(function (a) {
    if (a.getAttribute('href') === current) a.classList.add('active');
  });

  // 3) Live search on members page
  var searchBox = document.getElementById('memberSearch');
  var memberList = document.getElementById('memberList');
  if (searchBox && memberList) {
    searchBox.addEventListener('input', function () {
      var q = searchBox.value.trim().toLowerCase();
      var rows = memberList.querySelectorAll('.member-row');
      rows.forEach(function (row) {
        var name = (row.querySelector('.pname') || {}).textContent || '';
        var show = name.trim().toLowerCase().indexOf(q) !== -1;
        row.classList.toggle('hidden', !show);
      });
    });
  }
})();
