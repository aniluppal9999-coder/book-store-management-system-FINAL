/* Bookstore Management System
 * Single-page app (no build step, no backend). Data is stored in the browser (localStorage).
 * Data model mirrors the report: Books, Sales, Sale_Details (stored inside each sale as items).
 */
(function () {
  'use strict';

  /* ===================== Constants ===================== */
  var KEY = 'bsms.v1';
  var GST_RATE = 0.18;
  var LOW_STOCK = 5;
  var CATEGORIES = ['Programming', 'Computer Science', 'Fiction', 'Self Help', 'Business', 'Science', 'History', 'Biography', 'Education', 'Children', 'Other'];
  var DEMO_USER = 'admin';
  var DEMO_PASS = 'admin123';

  /* ===================== Tiny helpers ===================== */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDate(d) { d = new Date(d); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function fmtTime(d) { d = new Date(d); var h = d.getHours(), ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return pad(h) + ':' + pad(d.getMinutes()) + ' ' + ap; }
  function fmtDT(d) { return fmtDate(d) + ' ' + fmtTime(d); }
  function longDate(d) {
    var m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    d = new Date(d); return pad(d.getDate()) + ' ' + m[d.getMonth()] + ' ' + d.getFullYear();
  }
  function money(n) {
    return '₹ ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function cents(n) { return Math.round(Number(n) * 100); }
  function isSameDay(a, b) { a = new Date(a); b = new Date(b); return a.toDateString() === b.toDateString(); }

  var ICONS = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    package: '<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
    printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>'
  };
  function icon(name, size) {
    size = size || 18;
    return '<svg class="ic" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  /* ===================== Storage + data ===================== */
  var memStore = {};
  var storage = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return memStore.hasOwnProperty(k) ? memStore[k] : null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { memStore[k] = v; } }
  };

  function seedData() {
    var now = Date.now(), day = 86400000;
    function iso(daysAgo) { return new Date(now - daysAgo * day).toISOString(); }
    return {
      v: 1,
      session: false,
      nextBookId: 6,
      nextSaleId: 1,
      books: [
        { id: 1, title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', category: 'Programming', price: 599, quantity: 10, createdAt: iso(5) },
        { id: 2, title: 'Data Structures and Algorithms', author: 'S. B. Malhotra', isbn: '9780589216489', category: 'Computer Science', price: 450, quantity: 15, createdAt: iso(5) },
        { id: 3, title: 'Atomic Habits', author: 'James Clear', isbn: '9780735211292', category: 'Self Help', price: 399, quantity: 5, createdAt: iso(4) },
        { id: 4, title: 'The Alchemist', author: 'Paulo Coelho', isbn: '9780061122415', category: 'Fiction', price: 299, quantity: 12, createdAt: iso(3) },
        { id: 5, title: 'Python Programming', author: 'Allen B. Downey', isbn: '9781491939536', category: 'Programming', price: 520, quantity: 7, createdAt: iso(2) }
      ],
      sales: []
    };
  }

  function validShape(d) {
    return d && typeof d === 'object' && Array.isArray(d.books) && Array.isArray(d.sales) &&
      typeof d.nextBookId === 'number' && typeof d.nextSaleId === 'number';
  }
  function load() {
    try {
      var raw = storage.get(KEY);
      if (raw) { var d = JSON.parse(raw); if (validShape(d)) return d; }
    } catch (e) { /* fall through to seed */ }
    var s = seedData(); storage.set(KEY, JSON.stringify(s)); return s;
  }
  var db = load();
  function save() { storage.set(KEY, JSON.stringify(db)); }

  function findBook(id) {
    id = Number(id);
    for (var i = 0; i < db.books.length; i++) if (db.books[i].id === id) return db.books[i];
    return null;
  }
  function categoryList() {
    var list = CATEGORIES.slice();
    db.books.forEach(function (b) { if (b.category && list.indexOf(b.category) === -1) list.push(b.category); });
    return list;
  }
  function categoryOptions(selected, withAll) {
    var out = withAll ? '<option value="">All Categories</option>' : '';
    categoryList().forEach(function (c) {
      out += '<option value="' + esc(c) + '"' + (c === selected ? ' selected' : '') + '>' + esc(c) + '</option>';
    });
    return out;
  }
  function stockBadge(q) {
    if (q <= 0) return '<span class="badge out">Out of stock</span>';
    if (q <= LOW_STOCK) return '<span class="badge low">Low: ' + q + '</span>';
    return '<span class="badge ok">' + q + '</span>';
  }
  function normIsbn(v) { return String(v || '').replace(/[\s-]/g, '').toUpperCase(); }
  function invoiceNo(n) { var s = String(n); while (s.length < 4) s = '0' + s; return 'INV-' + s; }

  function calcTotals(items, discPct) {
    var sub = 0;
    items.forEach(function (i) { sub += cents(i.unitPrice) * i.qty; });
    var pct = Math.min(100, Math.max(0, Number(discPct) || 0));
    var disc = Math.round(sub * pct / 100);
    var taxable = sub - disc;
    var tax = Math.round(taxable * GST_RATE);
    return { subtotal: sub / 100, discountPct: pct, discount: disc / 100, tax: tax / 100, total: (taxable + tax) / 100 };
  }

  /* ===================== UI plumbing ===================== */
  function toast(msg, type) {
    var root = $('#toasts'); if (!root) return;
    var el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.innerHTML = (type === 'error' ? '' : (type === 'success' ? icon('check', 16) : '')) + '<span>' + esc(msg) + '</span>';
    root.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, type === 'error' ? 4200 : 2800);
  }
  function openModal(html, cls) {
    var root = $('#modal-root');
    root.innerHTML = '<div class="modal-backdrop"><div class="modal ' + (cls || '') + '" role="dialog" aria-modal="true">' + html + '</div></div>';
    var bd = root.firstChild;
    bd.addEventListener('mousedown', function (e) { if (e.target === bd) closeModal(); });
    return bd.firstChild;
  }
  function closeModal() { var r = $('#modal-root'); if (r) r.innerHTML = ''; }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  function confirmDialog(title, msg, onYes, yesLabel, danger) {
    var m = openModal('<h2>' + esc(title) + '</h2><p class="muted" style="margin:6px 0 0">' + esc(msg) + '</p>' +
      '<div class="m-actions"><button class="btn" data-no>Cancel</button><button class="btn ' + (danger === false ? 'primary' : 'danger') + '" data-yes>' + esc(yesLabel || 'Delete') + '</button></div>');
    $('[data-no]', m).onclick = closeModal;
    $('[data-yes]', m).onclick = function () { closeModal(); onYes(); };
    $('[data-yes]', m).focus();
  }

  function go(path) {
    var h = '#/' + path;
    if (location.hash === h) render(); else location.hash = h;
  }

  /* ===================== Shell ===================== */
  var NAV = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'add', label: 'Add Book', icon: 'plus' },
    { id: 'search', label: 'Search Book', icon: 'search' },
    { id: 'stock', label: 'Update Stock', icon: 'package' },
    { id: 'sale', label: 'Process Sale', icon: 'cart' },
    { id: 'history', label: 'Sales History', icon: 'clock' }
  ];

  function shell(active, page) {
    var nav = NAV.map(function (n) {
      return '<a href="#/' + n.id + '" class="' + (n.id === active ? 'active' : '') + '">' + icon(n.icon) + '<span>' + n.label + '</span></a>';
    }).join('');
    return '<div class="shell">' +
      '<aside class="sidebar" id="sidebar">' +
      '<div class="brand"><span class="logo">' + icon('book', 20) + '</span><span>Bookstore System</span></div>' +
      '<nav class="nav">' + nav + '<button type="button" id="nav-logout">' + icon('logout') + '<span>Logout</span></button></nav>' +
      '<div class="side-foot">Bookstore Management System<br>BBD University · TCS iON</div>' +
      '</aside>' +
      '<main class="main">' +
      '<div class="topbar">' +
      '<div class="page-head"><button class="menu-btn" id="menu-btn" aria-label="Open menu">' + icon('menu', 20) + '</button>' +
      '<div class="page-icon">' + icon(page.icon, 24) + '</div>' +
      '<div><h1>' + esc(page.title) + '</h1><p>' + esc(page.sub) + '</p></div></div>' +
      '<div class="operator"><span class="avatar">' + icon('user', 18) + '</span><div><b>Operator</b><span>Bookstore Staff</span></div></div>' +
      '</div>' +
      '<div id="page">' + page.body + '</div>' +
      '</main></div>';
  }

  function doLogout() {
    confirmDialog('Log out?', 'You will be returned to the sign-in screen. Your data stays saved in this browser.', function () {
      db.session = false; save(); location.hash = ''; render();
    }, 'Log out', false);
  }

  function renderLogin() {
    $('#app').innerHTML =
      '<div class="login-wrap"><form class="login-card" id="login-form" autocomplete="on">' +
      '<div class="l-logo">' + icon('book', 32) + '</div>' +
      '<h1>Bookstore System</h1><p class="sub">Sign in to manage books, sales and inventory.</p>' +
      '<div class="field"><label for="lu">Username</label><input id="lu" type="text" value="' + DEMO_USER + '" autocomplete="username"></div>' +
      '<div class="field"><label for="lp">Password</label><input id="lp" type="password" value="' + DEMO_PASS + '" autocomplete="current-password"></div>' +
      '<div class="form-error" id="lerr"></div>' +
      '<button class="btn primary" type="submit">Sign In</button>' +
      '<p class="hint">Demo login: <b>' + DEMO_USER + '</b> / <b>' + DEMO_PASS + '</b></p>' +
      '</form></div>';
    $('#login-form').onsubmit = function (e) {
      e.preventDefault();
      var u = $('#lu').value.trim().toLowerCase(), p = $('#lp').value;
      if (u === DEMO_USER && p === DEMO_PASS) {
        db.session = true; save(); location.hash = '#/home'; render();
      } else {
        $('#lerr').textContent = 'Incorrect username or password.';
      }
    };
  }

  /* ===================== Pages ===================== */
  var PAGES = {};

  /* ---------- Home ---------- */
  PAGES.home = function () {
    var units = db.books.reduce(function (s, b) { return s + b.quantity; }, 0);
    var low = db.books.filter(function (b) { return b.quantity <= LOW_STOCK; }).length;
    var today = new Date();
    var todayTotal = db.sales.filter(function (s) { return isSameDay(s.date, today); }).reduce(function (s, x) { return s + cents(x.total); }, 0) / 100;
    var tiles = [
      { go: 'add', cls: 'blue', ic: 'book', t: 'Add Book', d: 'Add new books to the catalogue.' },
      { go: 'search', cls: 'green', ic: 'search', t: 'Search Book', d: 'Find books in the catalogue.' },
      { go: 'stock', cls: 'yellow', ic: 'package', t: 'Update Stock', d: 'Modify book details or quantity.' },
      { go: 'sale', cls: 'pink', ic: 'cart', t: 'Process Sale', d: 'Create a new sale and record transaction.' },
      { go: 'history', cls: 'purple', ic: 'clock', t: 'Sales History', d: 'View previous transactions.' },
      { go: 'logout', cls: 'cyan', ic: 'logout', t: 'Logout', d: 'Exit from the system.' }
    ].map(function (t) {
      return '<button class="tile ' + t.cls + '" data-go="' + t.go + '"><span class="t-icon">' + icon(t.ic, 42) + '</span><h3>' + t.t + '</h3><p>' + t.d + '</p></button>';
    }).join('');
    return {
      title: 'Bookstore Management System', sub: 'Manage your books, sales and inventory with ease.', icon: 'book',
      body:
        '<div class="stats">' +
        '<div class="stat"><div class="label">Book titles</div><div class="value">' + db.books.length + '</div></div>' +
        '<div class="stat"><div class="label">Units in stock</div><div class="value">' + units + '</div></div>' +
        '<div class="stat"><div class="label">Low / out of stock</div><div class="value ' + (low ? 'warn' : '') + '">' + low + '</div></div>' +
        '<div class="stat"><div class="label">Today\'s sales</div><div class="value">' + money(todayTotal) + '</div></div>' +
        '</div>' +
        '<div class="tiles">' + tiles + '</div>' +
        '<div class="home-foot"><span>Today: ' + longDate(today) + ' &nbsp;|&nbsp; Available Books: ' + db.books.length + '</span>' +
        '<span><a href="#" id="reset-demo" class="muted">Reset demo data</a></span></div>',
      mount: function (root) {
        $$('[data-go]', root).forEach(function (b) {
          b.onclick = function () { var g = b.getAttribute('data-go'); if (g === 'logout') doLogout(); else go(g); };
        });
        $('#reset-demo', root).onclick = function (e) {
          e.preventDefault();
          confirmDialog('Reset demo data?', 'All books and sales will be replaced with the original sample data.', function () {
            db = seedData(); db.session = true; save(); cart = []; custName = 'Walk-in Customer'; discountPct = 0;
            toast('Demo data restored', 'success'); render();
          }, 'Reset');
        };
      }
    };
  };

  /* ---------- Add Book ---------- */
  PAGES.add = function (params) {
    var editId = params.get('edit') ? Number(params.get('edit')) : null;
    var book = editId ? findBook(editId) : null;
    return {
      title: book ? 'Edit Book' : 'Add Book',
      sub: book ? 'Change the details below and save.' : 'Enter book details to add a new book to the catalogue.',
      icon: 'book',
      body:
        '<div class="card"><form id="book-form" novalidate>' +
        '<div class="form-cols">' +
        '<div class="col">' +
        '<div class="field"><label for="f-title">Title <span class="req">*</span></label><input id="f-title" type="text" maxlength="200" placeholder="e.g. Clean Code"></div>' +
        '<div class="field"><label for="f-author">Author <span class="req">*</span></label><input id="f-author" type="text" maxlength="150" placeholder="e.g. Robert C. Martin"></div>' +
        '<div class="field"><label for="f-isbn">ISBN <span class="req">*</span></label><input id="f-isbn" type="text" maxlength="20" placeholder="10 or 13 digits"></div>' +
        '<div class="field"><label for="f-cat">Category</label><select id="f-cat">' + categoryOptions('Programming') + '</select></div>' +
        '</div>' +
        '<div class="col">' +
        '<div class="field"><label for="f-price">Price (₹) <span class="req">*</span></label><input id="f-price" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00"></div>' +
        '<div class="field"><label for="f-qty">Quantity <span class="req">*</span></label><input id="f-qty" type="number" min="0" step="1" inputmode="numeric" placeholder="0"></div>' +
        '<div class="field"><label for="f-created">Created At</label><input id="f-created" type="text" readonly></div>' +
        '<div class="btn-row" style="margin-top:4px"><button class="btn primary" type="submit" id="btn-save">' + icon('save', 16) + '<span id="save-label">Save</span></button>' +
        '<button class="btn" type="button" id="btn-clear">' + icon('refresh', 16) + 'Clear</button></div>' +
        '</div></div>' +
        '<div class="form-error" id="f-err"></div></form></div>' +
        '<div class="card"><div class="card-head"><h2>Book Catalogue</h2>' +
        '<div class="search-box">' + icon('search', 16) + '<input id="cat-q" type="search" placeholder="Search by title, author or ISBN..."></div></div>' +
        '<div class="table-wrap"><table><thead><tr><th>ID</th><th>Title</th><th>Author</th><th>ISBN</th><th>Category</th><th class="num">Price (₹)</th><th class="num">Stock</th><th>Actions</th></tr></thead><tbody id="cat-body"></tbody></table></div>' +
        '<div class="table-foot" id="cat-foot"></div></div>',
      mount: function (root) {
        var editing = book;
        var F = { title: $('#f-title'), author: $('#f-author'), isbn: $('#f-isbn'), cat: $('#f-cat'), price: $('#f-price'), qty: $('#f-qty'), created: $('#f-created') };
        var err = $('#f-err');

        function fill(b) {
          editing = b || null;
          F.title.value = b ? b.title : '';
          F.author.value = b ? b.author : '';
          F.isbn.value = b ? b.isbn : '';
          F.cat.innerHTML = categoryOptions(b ? b.category : 'Programming');
          F.price.value = b ? b.price : '';
          F.qty.value = b ? b.quantity : '';
          F.created.value = b ? fmtDT(b.createdAt) : fmtDT(new Date());
          $('#save-label').textContent = b ? 'Update' : 'Save';
          clearErrors();
        }
        function clearErrors() {
          err.textContent = '';
          Object.keys(F).forEach(function (k) { F[k].classList.remove('invalid'); });
        }
        function fail(field, msg) {
          clearErrors(); F[field].classList.add('invalid'); err.textContent = msg; F[field].focus(); return false;
        }
        function renderTable() {
          var q = $('#cat-q').value.trim().toLowerCase();
          var rows = db.books.filter(function (b) {
            return !q || (b.title + ' ' + b.author + ' ' + b.isbn).toLowerCase().indexOf(q) !== -1;
          });
          $('#cat-body').innerHTML = rows.length ? rows.map(function (b) {
            return '<tr class="' + (editing && editing.id === b.id ? 'selected' : '') + '" data-id="' + b.id + '">' +
              '<td>' + b.id + '</td><td>' + esc(b.title) + '</td><td>' + esc(b.author) + '</td><td>' + esc(b.isbn) + '</td><td>' + esc(b.category) + '</td>' +
              '<td class="num">' + money(b.price).replace('₹ ', '') + '</td><td class="num">' + stockBadge(b.quantity) + '</td>' +
              '<td><div class="row-actions"><button class="icon-btn" data-act="edit" title="Edit" aria-label="Edit">' + icon('edit', 15) + '</button>' +
              '<button class="icon-btn red" data-act="del" title="Delete" aria-label="Delete">' + icon('trash', 15) + '</button></div></td></tr>';
          }).join('') : '<tr><td colspan="8" class="empty">' + (db.books.length ? 'No books match your search.' : 'No books yet. Add your first book above.') + '</td></tr>';
          $('#cat-foot').textContent = 'Total Books: ' + db.books.length + (q ? ' (showing ' + rows.length + ')' : '');
        }

        $('#book-form').onsubmit = function (e) {
          e.preventDefault();
          var title = F.title.value.trim(), author = F.author.value.trim(), isbn = normIsbn(F.isbn.value);
          var priceStr = F.price.value.trim(), qtyStr = F.qty.value.trim();
          if (!title) return fail('title', 'Title is required.');
          if (!author) return fail('author', 'Author is required.');
          if (!isbn) return fail('isbn', 'ISBN is required.');
          if (!/^(\d{13}|\d{9}[\dX])$/.test(isbn)) return fail('isbn', 'ISBN must be 10 or 13 digits (hyphens allowed).');
          var dup = db.books.some(function (b) { return normIsbn(b.isbn) === isbn && (!editing || b.id !== editing.id); });
          if (dup) return fail('isbn', 'A book with this ISBN already exists.');
          if (priceStr === '') return fail('price', 'Price is required.');
          var price = Number(priceStr);
          if (!isFinite(price) || price < 0) return fail('price', 'Price must be a number that is not negative.');
          if (price > 10000000) return fail('price', 'Price is too large.');
          if (qtyStr === '') return fail('qty', 'Quantity is required.');
          var qty = Number(qtyStr);
          if (!isFinite(qty) || qty < 0 || Math.floor(qty) !== qty) return fail('qty', 'Quantity must be a whole number that is not negative.');
          price = Math.round(price * 100) / 100;

          if (editing) {
            editing.title = title; editing.author = author; editing.isbn = isbn;
            editing.category = F.cat.value; editing.price = price; editing.quantity = qty;
            save(); toast('Book updated', 'success');
            history.replaceState(null, '', '#/add');
            fill(null);
          } else {
            db.books.push({ id: db.nextBookId++, title: title, author: author, isbn: isbn, category: F.cat.value, price: price, quantity: qty, createdAt: new Date().toISOString() });
            save(); toast('Book saved to catalogue', 'success');
            fill(null);
          }
          renderTable();
          F.title.focus();
        };
        $('#btn-clear').onclick = function () {
          if (editing) history.replaceState(null, '', '#/add');
          fill(null); renderTable();
        };
        $('#cat-q').oninput = renderTable;
        $('#cat-body').onclick = function (e) {
          var tr = e.target.closest('tr[data-id]'); if (!tr) return;
          var id = Number(tr.getAttribute('data-id')), b = findBook(id);
          var btn = e.target.closest('[data-act]');
          if (btn && btn.getAttribute('data-act') === 'del') {
            confirmDialog('Delete this book?', '"' + b.title + '" will be removed from the catalogue. Past sales keep their records.', function () {
              db.books = db.books.filter(function (x) { return x.id !== id; });
              cart = cart.filter(function (c) { return c.bookId !== id; });
              if (editing && editing.id === id) { history.replaceState(null, '', '#/add'); fill(null); }
              save(); renderTable(); toast('Book deleted');
            });
          } else if (b) {
            history.replaceState(null, '', '#/add?edit=' + id);
            fill(b); renderTable();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        };

        fill(book);
        renderTable();
      }
    };
  };

  /* ---------- Search Book ---------- */
  function viewBookModal(b) {
    var m = openModal('<h2>' + esc(b.title) + '</h2><div class="muted">by ' + esc(b.author) + '</div>' +
      '<dl class="view-grid">' +
      '<dt>Book ID</dt><dd>' + b.id + '</dd>' +
      '<dt>ISBN</dt><dd>' + esc(b.isbn) + '</dd>' +
      '<dt>Category</dt><dd>' + esc(b.category || '-') + '</dd>' +
      '<dt>Price</dt><dd>' + money(b.price) + '</dd>' +
      '<dt>In stock</dt><dd>' + stockBadge(b.quantity) + '</dd>' +
      '<dt>Added on</dt><dd>' + fmtDT(b.createdAt) + '</dd></dl>' +
      '<div class="m-actions"><button class="btn" data-close>Close</button>' +
      '<button class="btn" data-stock>' + icon('package', 15) + 'Update Stock</button>' +
      '<button class="btn primary" data-edit>' + icon('edit', 15) + 'Edit</button></div>');
    $('[data-close]', m).onclick = closeModal;
    $('[data-edit]', m).onclick = function () { closeModal(); go('add?edit=' + b.id); };
    $('[data-stock]', m).onclick = function () { closeModal(); go('stock?id=' + b.id); };
  }

  PAGES.search = function () {
    return {
      title: 'Search Book', sub: 'Find books in the catalogue using title, author, ISBN or category.', icon: 'search',
      body:
        '<div class="card"><form id="s-form"><div class="search-grid">' +
        '<div class="field"><label for="s-title">Title</label><input id="s-title" type="text" placeholder="Search title"></div>' +
        '<div class="field"><label for="s-author">Author</label><input id="s-author" type="text" placeholder="Search author"></div>' +
        '<div class="field"><label for="s-isbn">ISBN</label><input id="s-isbn" type="text" placeholder="Search ISBN"></div>' +
        '<div class="field"><label for="s-cat">Category</label><select id="s-cat">' + categoryOptions('', true) + '</select></div>' +
        '<div class="btn-row"><button class="btn primary" type="submit">' + icon('search', 16) + 'Search</button><button class="btn" type="button" id="s-reset">Reset</button></div>' +
        '</div></form></div>' +
        '<div class="card"><div class="card-head"><h2>Search Results</h2><span class="muted" id="s-count"></span></div>' +
        '<div class="table-wrap"><table><thead><tr><th>ID</th><th>Title</th><th>Author</th><th>ISBN</th><th>Category</th><th class="num">Price (₹)</th><th class="num">Quantity</th><th>Action</th></tr></thead><tbody id="s-body"></tbody></table></div></div>',
      mount: function () {
        function run() {
          var t = $('#s-title').value.trim().toLowerCase(), a = $('#s-author').value.trim().toLowerCase();
          var i = normIsbn($('#s-isbn').value).toLowerCase(), c = $('#s-cat').value;
          var rows = db.books.filter(function (b) {
            return (!t || b.title.toLowerCase().indexOf(t) !== -1) &&
              (!a || b.author.toLowerCase().indexOf(a) !== -1) &&
              (!i || normIsbn(b.isbn).toLowerCase().indexOf(i) !== -1) &&
              (!c || b.category === c);
          });
          $('#s-count').textContent = rows.length ? 'Showing 1 - ' + rows.length + ' of ' + rows.length + ' book' + (rows.length === 1 ? '' : 's') : '';
          $('#s-body').innerHTML = rows.length ? rows.map(function (b) {
            return '<tr data-id="' + b.id + '"><td>' + b.id + '</td><td>' + esc(b.title) + '</td><td>' + esc(b.author) + '</td><td>' + esc(b.isbn) + '</td><td>' + esc(b.category) + '</td>' +
              '<td class="num">' + money(b.price).replace('₹ ', '') + '</td><td class="num">' + stockBadge(b.quantity) + '</td>' +
              '<td><div class="row-actions"><button class="btn small" data-act="view">' + icon('eye', 14) + 'View</button>' +
              '<button class="btn small success" data-act="edit">' + icon('edit', 14) + 'Edit</button></div></td></tr>';
          }).join('') : '<tr><td colspan="8" class="empty">No books found. Try different search terms.</td></tr>';
        }
        $('#s-form').onsubmit = function (e) { e.preventDefault(); run(); };
        ['#s-title', '#s-author', '#s-isbn'].forEach(function (s) { $(s).oninput = run; });
        $('#s-cat').onchange = run;
        $('#s-reset').onclick = function () {
          $('#s-title').value = ''; $('#s-author').value = ''; $('#s-isbn').value = ''; $('#s-cat').value = ''; run();
        };
        $('#s-body').onclick = function (e) {
          var btn = e.target.closest('[data-act]'); if (!btn) return;
          var b = findBook(btn.closest('tr').getAttribute('data-id')); if (!b) return;
          if (btn.getAttribute('data-act') === 'view') viewBookModal(b); else go('add?edit=' + b.id);
        };
        run();
      }
    };
  };

  /* ---------- Update Stock ---------- */
  PAGES.stock = function (params) {
    var pre = params.get('id') ? Number(params.get('id')) : null;
    return {
      title: 'Update Stock', sub: 'Adjust the quantity or price of an existing book.', icon: 'package',
      body:
        '<div class="two-cols">' +
        '<div class="card"><h2>Adjust Stock</h2>' +
        '<div class="field"><label for="u-book">Select book</label><select id="u-book"></select></div>' +
        '<div class="detail-box" id="u-detail"></div>' +
        '<div class="field"><label>Action</label><div class="radio-row" id="u-mode">' +
        '<label><input type="radio" name="u-mode" value="add" checked> Add stock</label>' +
        '<label><input type="radio" name="u-mode" value="remove"> Remove stock</label>' +
        '<label><input type="radio" name="u-mode" value="set"> Set quantity</label></div></div>' +
        '<div class="form-cols" style="gap:12px">' +
        '<div class="field"><label for="u-amt" id="u-amt-label">Quantity to add</label><input id="u-amt" type="number" min="0" step="1" inputmode="numeric" placeholder="0"></div>' +
        '<div class="field"><label for="u-price">Price (₹)</label><input id="u-price" type="number" min="0" step="0.01" inputmode="decimal"></div></div>' +
        '<div class="preview-line" id="u-preview"></div>' +
        '<div class="form-error" id="u-err"></div>' +
        '<div class="btn-row"><button class="btn primary" id="u-apply">' + icon('check', 16) + 'Update</button><button class="btn" id="u-edit">' + icon('edit', 16) + 'Edit all details</button></div></div>' +
        '<div class="card"><div class="card-head"><h2>Stock Overview</h2><span class="muted">Lowest stock first</span></div>' +
        '<div class="table-wrap"><table><thead><tr><th>ID</th><th>Title</th><th class="num">Price (₹)</th><th>Stock level</th></tr></thead><tbody id="u-body"></tbody></table></div></div>' +
        '</div>',
      mount: function () {
        var selId = null;
        var sel = $('#u-book'), amt = $('#u-amt'), price = $('#u-price'), err = $('#u-err');

        function mode() { return $('input[name="u-mode"]:checked').value; }
        function buildSelect() {
          if (!db.books.length) { sel.innerHTML = '<option value="">No books available</option>'; return; }
          sel.innerHTML = db.books.map(function (b) {
            return '<option value="' + b.id + '">' + esc(b.title) + ' — ' + esc(b.author) + '</option>';
          }).join('');
        }
        function select(id) {
          var b = findBook(id) || db.books[0] || null;
          selId = b ? b.id : null;
          if (b) { sel.value = String(b.id); price.value = b.price; }
          amt.value = ''; err.textContent = '';
          detail(); preview(); overview();
        }
        function detail() {
          var b = findBook(selId);
          $('#u-detail').innerHTML = b ?
            '<div class="row"><span>ISBN</span><b>' + esc(b.isbn) + '</b></div><div class="row"><span>Category</span><b>' + esc(b.category) + '</b></div>' +
            '<div class="row"><span>Current price</span><b>' + money(b.price) + '</b></div><div class="row"><span>Current stock</span><b>' + b.quantity + '</b></div>' :
            '<div class="muted">No book selected.</div>';
        }
        function newQty() {
          var b = findBook(selId); if (!b) return null;
          var v = amt.value.trim(); if (v === '') return b.quantity;
          var n = Number(v); if (!isFinite(n)) return null;
          var m = mode();
          return m === 'add' ? b.quantity + n : (m === 'remove' ? b.quantity - n : n);
        }
        function preview() {
          var b = findBook(selId);
          var lbl = { add: 'Quantity to add', remove: 'Quantity to remove', set: 'New quantity' }[mode()];
          $('#u-amt-label').textContent = lbl;
          var q = newQty();
          $('#u-preview').innerHTML = b ? 'New stock will be <b>' + (q == null || q < 0 ? '—' : q) + '</b> (currently ' + b.quantity + ')' : '';
        }
        function overview() {
          var rows = db.books.slice().sort(function (a, b) { return a.quantity - b.quantity || a.id - b.id; });
          var max = Math.max.apply(null, [20].concat(rows.map(function (b) { return b.quantity; })));
          $('#u-body').innerHTML = rows.length ? rows.map(function (b) {
            var cls = b.quantity <= 0 ? 'out' : (b.quantity <= LOW_STOCK ? 'low' : '');
            return '<tr data-id="' + b.id + '" class="' + (b.id === selId ? 'selected' : '') + '" style="cursor:pointer"><td>' + b.id + '</td><td>' + esc(b.title) + '</td><td class="num">' + money(b.price).replace('₹ ', '') + '</td>' +
              '<td><span class="bar"><i class="' + cls + '" style="width:' + Math.min(100, Math.round(b.quantity / max * 100)) + '%"></i></span>' + stockBadge(b.quantity) + '</td></tr>';
          }).join('') : '<tr><td colspan="4" class="empty">No books yet.</td></tr>';
        }

        sel.onchange = function () { select(sel.value); };
        amt.oninput = preview;
        $$('input[name="u-mode"]').forEach(function (r) { r.onchange = function () { err.textContent = ''; preview(); }; });
        $('#u-body').onclick = function (e) { var tr = e.target.closest('tr[data-id]'); if (tr) select(tr.getAttribute('data-id')); };
        $('#u-edit').onclick = function () { if (selId) go('add?edit=' + selId); };
        $('#u-apply').onclick = function () {
          var b = findBook(selId);
          if (!b) { err.textContent = 'Please select a book.'; return; }
          var v = amt.value.trim(), p = price.value.trim();
          var newPrice = Number(p);
          if (p === '' || !isFinite(newPrice) || newPrice < 0) { err.textContent = 'Price must be a number that is not negative.'; price.focus(); return; }
          var q = b.quantity;
          if (v !== '') {
            var n = Number(v);
            if (!isFinite(n) || n < 0 || Math.floor(n) !== n) { err.textContent = 'Quantity must be a whole number that is not negative.'; amt.focus(); return; }
            var m = mode();
            if (m === 'add') q = b.quantity + n;
            else if (m === 'remove') {
              if (n > b.quantity) { err.textContent = 'Cannot remove ' + n + ' - only ' + b.quantity + ' in stock.'; amt.focus(); return; }
              q = b.quantity - n;
            } else q = n;
          }
          newPrice = Math.round(newPrice * 100) / 100;
          if (q === b.quantity && newPrice === b.price) { err.textContent = 'Nothing to update - change the quantity or price first.'; return; }
          b.quantity = q; b.price = newPrice; save();
          toast('Updated "' + b.title + '" - stock ' + q, 'success');
          select(b.id);
        };

        buildSelect();
        select(pre);
      }
    };
  };

  /* ---------- Process Sale ---------- */
  var cart = [];                       // [{bookId, qty}]
  var custName = 'Walk-in Customer';
  var discountPct = 0;

  function cartItems() {
    var items = [];
    cart.forEach(function (c) {
      var b = findBook(c.bookId);
      if (b) items.push({ bookId: b.id, title: b.title, author: b.author, isbn: b.isbn, category: b.category, unitPrice: b.price, qty: c.qty, lineTotal: cents(b.price) * c.qty / 100 });
    });
    return items;
  }

  function receiptHtml(sale, draft) {
    var rows = sale.items.map(function (i, n) {
      return '<tr><td>' + (n + 1) + '</td><td>' + esc(i.title) + '<div class="muted" style="font-size:11px">' + esc(i.author) + '</div></td><td class="num">' + i.qty + '</td><td class="num">' + money(i.unitPrice).replace('₹ ', '') + '</td><td class="num">' + money(i.lineTotal).replace('₹ ', '') + '</td></tr>';
    }).join('');
    return '<div class="receipt">' +
      '<div class="r-head"><h2>Bookstore Management System</h2><div class="muted">' + (draft ? 'DRAFT BILL (not yet saved)' : 'Sales Receipt') + '</div></div>' +
      '<div class="r-meta"><span><b>Invoice:</b> ' + esc(sale.invoice) + '</span><span><b>Date:</b> ' + fmtDT(sale.date) + '</span><span><b>Customer:</b> ' + esc(sale.customer) + '</span></div>' +
      '<div class="table-wrap"><table><thead><tr><th>#</th><th>Book</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Total</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="r-sum"><div class="line"><span>Subtotal</span><span>' + money(sale.subtotal) + '</span></div>' +
      '<div class="line"><span>Discount (' + sale.discountPct + '%)</span><span>- ' + money(sale.discount) + '</span></div>' +
      '<div class="line"><span>Tax (GST ' + Math.round(GST_RATE * 100) + '%)</span><span>' + money(sale.tax) + '</span></div>' +
      '<div class="line total"><span>Total Amount</span><span>' + money(sale.total) + '</span></div></div>' +
      '<div class="thanks">Thank you for shopping with us!</div></div>';
  }
  function showReceipt(sale, draft, title) {
    var m = openModal((title ? '<h2 class="no-print" style="color:#168a4f">' + icon('check', 20) + ' ' + esc(title) + '</h2>' : '') + receiptHtml(sale, draft) +
      '<div class="m-actions no-print"><button class="btn" data-close>Close</button><button class="btn primary" data-print>' + icon('printer', 16) + 'Print</button></div>', 'wide');
    $('[data-close]', m).onclick = closeModal;
    $('[data-print]', m).onclick = function () {
      document.body.classList.add('print-receipt');
      try { window.print(); } catch (e) { toast('Printing is not available in this browser', 'error'); }
      setTimeout(function () { document.body.classList.remove('print-receipt'); }, 500);
    };
  }

  PAGES.sale = function () {
    return {
      title: 'Process Sale', sub: 'Add books to the cart and generate a bill.', icon: 'cart',
      body:
        '<div class="card">' +
        '<div class="sale-top">' +
        '<div class="field"><label for="c-name">Customer Name</label><input id="c-name" type="text" maxlength="100"></div>' +
        '<div class="field"><label>Date</label><input type="text" readonly value="' + fmtDate(new Date()) + '"></div>' +
        '<div class="field"><label>Invoice No.</label><input type="text" readonly id="c-inv"></div></div>' +
        '<div class="add-row"><div class="suggest-wrap"><div class="search-box" style="width:100%">' + icon('search', 16) + '<input id="b-q" type="text" autocomplete="off" placeholder="Search by title, author or ISBN..."></div><div class="suggest" id="b-sug" hidden></div></div>' +
        '<button class="btn primary" id="b-add">' + icon('plus', 16) + 'Add to Bill</button></div>' +
        '<div class="sale-body"><div class="table-wrap"><table class="cart-table"><thead><tr><th>ID</th><th>Title</th><th>Author</th><th class="c-wide">ISBN</th><th class="c-wide">Category</th><th class="num">Price (₹)</th><th class="center">Quantity</th><th class="num">Total (₹)</th><th>Action</th></tr></thead><tbody id="cart-body"></tbody></table></div>' +
        '<div class="summary"><div class="line"><span>Subtotal</span><b id="t-sub"></b></div>' +
        '<div class="line"><span>Discount</span><span class="disc-input"><input id="t-pct" type="number" min="0" max="100" step="1" inputmode="decimal"> %</span></div>' +
        '<div class="line"><span>Discount amount</span><span id="t-disc"></span></div>' +
        '<div class="line"><span>Tax (GST ' + Math.round(GST_RATE * 100) + '%)</span><span id="t-tax"></span></div>' +
        '<div class="line total"><span>Total Amount</span><span id="t-total"></span></div></div></div>' +
        '<div class="form-error" id="c-err"></div>' +
        '<div class="sale-actions"><button class="btn" id="b-clear">' + icon('refresh', 16) + 'Clear Cart</button>' +
        '<div class="btn-row"><button class="btn primary" id="b-print">' + icon('printer', 16) + 'Print Receipt</button><button class="btn success" id="b-done">' + icon('check', 16) + 'Complete Sale</button></div></div>' +
        '</div>',
      mount: function () {
        var q = $('#b-q'), sug = $('#b-sug'), err = $('#c-err'), hl = -1, matches = [];
        $('#c-name').value = custName;
        $('#c-inv').value = invoiceNo(db.nextSaleId);
        $('#t-pct').value = discountPct;

        function draftSale() {
          var items = cartItems(), t = calcTotals(items, discountPct);
          return { invoice: invoiceNo(db.nextSaleId), date: new Date().toISOString(), customer: (custName || '').trim() || 'Walk-in Customer', items: items, subtotal: t.subtotal, discountPct: t.discountPct, discount: t.discount, tax: t.tax, total: t.total };
        }
        function renderCart() {
          var items = cartItems();
          $('#cart-body').innerHTML = items.length ? items.map(function (i) {
            var b = findBook(i.bookId);
            return '<tr data-id="' + i.bookId + '"><td>' + i.bookId + '</td><td>' + esc(i.title) + '</td><td>' + esc(i.author) + '</td><td class="c-wide">' + esc(i.isbn) + '</td><td class="c-wide">' + esc(i.category) + '</td>' +
              '<td class="num">' + money(i.unitPrice).replace('₹ ', '') + '</td>' +
              '<td class="center"><input class="qty-input" type="number" min="1" max="' + b.quantity + '" step="1" value="' + i.qty + '" title="In stock: ' + b.quantity + '"></td>' +
              '<td class="num">' + money(i.lineTotal).replace('₹ ', '') + '</td>' +
              '<td><button class="icon-btn red" data-act="rm" title="Remove" aria-label="Remove">' + icon('trash', 15) + '</button></td></tr>';
          }).join('') : '<tr><td colspan="9" class="empty">Cart is empty. Search for a book above and click "Add to Bill".</td></tr>';
          totals();
        }
        function totals() {
          var t = calcTotals(cartItems(), discountPct);
          $('#t-sub').textContent = money(t.subtotal);
          $('#t-disc').textContent = '- ' + money(t.discount);
          $('#t-tax').textContent = money(t.tax);
          $('#t-total').textContent = money(t.total);
        }
        function addBook(id) {
          var b = findBook(id); if (!b) return;
          err.textContent = '';
          if (b.quantity <= 0) { toast('"' + b.title + '" is out of stock', 'error'); return; }
          var line = cart.filter(function (c) { return c.bookId === b.id; })[0];
          if (line) {
            if (line.qty + 1 > b.quantity) { toast('Only ' + b.quantity + ' of "' + b.title + '" in stock', 'error'); return; }
            line.qty++;
          } else cart.push({ bookId: b.id, qty: 1 });
          q.value = ''; hideSug(); renderCart(); q.focus();
        }
        function search(text) {
          text = text.trim().toLowerCase(); if (!text) return [];
          var n = normIsbn(text).toLowerCase();
          return db.books.filter(function (b) {
            return (b.title + ' ' + b.author).toLowerCase().indexOf(text) !== -1 || (n && normIsbn(b.isbn).toLowerCase().indexOf(n) !== -1);
          }).slice(0, 8);
        }
        function hideSug() { sug.hidden = true; sug.innerHTML = ''; hl = -1; matches = []; }
        function showSug() {
          matches = search(q.value); hl = -1;
          if (!q.value.trim()) { hideSug(); return; }
          sug.hidden = false;
          sug.innerHTML = matches.length ? matches.map(function (b, i) {
            return '<button type="button" data-id="' + b.id + '" data-i="' + i + '"' + (b.quantity <= 0 ? ' disabled' : '') + '><span>' + esc(b.title) + '<small>' + esc(b.author) + ' · ' + esc(b.isbn) + '</small></span><span>' + money(b.price) + '<small>' + (b.quantity <= 0 ? 'Out of stock' : b.quantity + ' in stock') + '</small></span></button>';
          }).join('') : '<div class="empty">No matching books.</div>';
        }
        function setHl(n) {
          var btns = $$('button:not(:disabled)', sug); if (!btns.length) return;
          hl = (n + btns.length) % btns.length;
          btns.forEach(function (b, i) { b.classList.toggle('hl', i === hl); });
        }

        q.oninput = showSug;
        q.onfocus = function () { if (q.value.trim()) showSug(); };
        q.onkeydown = function (e) {
          if (e.key === 'ArrowDown') { e.preventDefault(); setHl(hl + 1); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setHl(hl - 1); }
          else if (e.key === 'Enter') { e.preventDefault(); addFromInput(); }
          else if (e.key === 'Escape') hideSug();
        };
        function addFromInput() {
          var btns = $$('button:not(:disabled)', sug);
          if (hl >= 0 && btns[hl]) { addBook(btns[hl].getAttribute('data-id')); return; }
          var ms = search(q.value);
          if (!q.value.trim()) { toast('Type a title, author or ISBN first', 'error'); return; }
          if (!ms.length) { toast('No matching book found', 'error'); return; }
          var avail = ms.filter(function (b) { return b.quantity > 0; });
          // exact ISBN match wins, otherwise the first book that is in stock
          var exact = ms.filter(function (b) { return normIsbn(b.isbn) === normIsbn(q.value); })[0];
          addBook((exact || avail[0] || ms[0]).id);
        }
        sug.onmousedown = function (e) { e.preventDefault(); };
        sug.onclick = function (e) { var b = e.target.closest('button[data-id]'); if (b && !b.disabled) addBook(b.getAttribute('data-id')); };
        document.addEventListener('click', function onDoc(e) {
          if (!document.body.contains(sug)) { document.removeEventListener('click', onDoc); return; }
          if (!e.target.closest('.suggest-wrap')) hideSug();
        });
        $('#b-add').onclick = addFromInput;

        $('#c-name').oninput = function () { custName = this.value; };
        $('#t-pct').oninput = function () {
          var v = Number(this.value);
          discountPct = (isFinite(v) && v > 0) ? Math.min(100, v) : 0;
          totals();
        };
        $('#t-pct').onblur = function () { this.value = discountPct; };

        $('#cart-body').onchange = function (e) {
          var inp = e.target.closest('.qty-input'); if (!inp) return;
          var id = Number(inp.closest('tr').getAttribute('data-id')), b = findBook(id), line = cart.filter(function (c) { return c.bookId === id; })[0];
          if (!b || !line) return;
          var n = Number(inp.value);
          if (!isFinite(n) || n < 1 || Math.floor(n) !== n) { toast('Quantity must be a whole number of 1 or more', 'error'); n = line.qty; }
          else if (n > b.quantity) { toast('Only ' + b.quantity + ' in stock', 'error'); n = b.quantity; }
          line.qty = n; renderCart();
        };
        $('#cart-body').onclick = function (e) {
          var btn = e.target.closest('[data-act="rm"]'); if (!btn) return;
          var id = Number(btn.closest('tr').getAttribute('data-id'));
          cart = cart.filter(function (c) { return c.bookId !== id; }); renderCart();
        };
        $('#b-clear').onclick = function () {
          if (!cart.length) { toast('Cart is already empty'); return; }
          cart = []; discountPct = 0; $('#t-pct').value = 0; err.textContent = ''; renderCart(); toast('Cart cleared');
        };
        $('#b-print').onclick = function () {
          if (!cart.length) { err.textContent = 'Add at least one book before printing a receipt.'; return; }
          err.textContent = ''; showReceipt(draftSale(), true);
        };
        $('#b-done').onclick = function () {
          err.textContent = '';
          if (!cart.length) { err.textContent = 'Cart is empty. Add at least one book to complete a sale.'; return; }
          // "Transaction": validate every line against live stock first, apply only if all pass.
          for (var i = 0; i < cart.length; i++) {
            var c = cart[i], b = findBook(c.bookId);
            if (!b) { err.textContent = 'A book in the cart no longer exists. Remove it and try again.'; return; }
            if (!(c.qty > 0) || Math.floor(c.qty) !== c.qty) { err.textContent = 'Quantity for "' + b.title + '" must be a positive whole number.'; return; }
            if (c.qty > b.quantity) { err.textContent = 'Not enough stock for "' + b.title + '" (requested ' + c.qty + ', available ' + b.quantity + ').'; return; }
          }
          var sale = draftSale();
          sale.id = db.nextSaleId;
          cart.forEach(function (c) { findBook(c.bookId).quantity -= c.qty; });
          db.sales.push(sale); db.nextSaleId++; save();
          cart = []; discountPct = 0; custName = 'Walk-in Customer';
          showReceipt(sale, false, 'Sale completed');
          toast('Sale ' + sale.invoice + ' recorded', 'success');
          $('#c-name').value = custName; $('#t-pct').value = 0; $('#c-inv').value = invoiceNo(db.nextSaleId);
          renderCart();
        };

        renderCart();
      }
    };
  };

  /* ---------- Sales History ---------- */
  function csvCell(v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function exportCsv(rows) {
    var lines = [['Invoice', 'Date', 'Customer', 'Items', 'Units', 'Subtotal', 'Discount', 'Tax', 'Total'].join(',')];
    rows.forEach(function (s) {
      var units = s.items.reduce(function (a, i) { return a + i.qty; }, 0);
      lines.push([s.invoice, fmtDT(s.date), s.customer, s.items.map(function (i) { return i.title + ' x' + i.qty; }).join('; '), units, s.subtotal.toFixed(2), s.discount.toFixed(2), s.tax.toFixed(2), s.total.toFixed(2)].map(csvCell).join(','));
    });
    var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'sales-history.csv'; document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
  }

  PAGES.history = function () {
    var sales = db.sales;
    var revenue = sales.reduce(function (s, x) { return s + cents(x.total); }, 0) / 100;
    var sold = sales.reduce(function (s, x) { return s + x.items.reduce(function (a, i) { return a + i.qty; }, 0); }, 0);
    var today = sales.filter(function (s) { return isSameDay(s.date, new Date()); }).reduce(function (s, x) { return s + cents(x.total); }, 0) / 100;
    return {
      title: 'Sales History', sub: 'View previous transactions.', icon: 'clock',
      body:
        '<div class="stats">' +
        '<div class="stat"><div class="label">Transactions</div><div class="value">' + sales.length + '</div></div>' +
        '<div class="stat"><div class="label">Books sold</div><div class="value">' + sold + '</div></div>' +
        '<div class="stat"><div class="label">Total revenue</div><div class="value">' + money(revenue) + '</div></div>' +
        '<div class="stat"><div class="label">Today\'s sales</div><div class="value">' + money(today) + '</div></div></div>' +
        '<div class="card"><div class="card-head"><h2>Transactions</h2><div class="btn-row">' +
        '<div class="search-box">' + icon('search', 16) + '<input id="h-q" type="search" placeholder="Invoice, customer or book..."></div>' +
        '<button class="btn" id="h-export">' + icon('download', 16) + 'Export CSV</button></div></div>' +
        '<div class="table-wrap"><table><thead><tr><th>Invoice</th><th>Date &amp; time</th><th>Customer</th><th>Books</th><th class="num">Units</th><th class="num">Total (₹)</th><th>Action</th></tr></thead><tbody id="h-body"></tbody></table></div>' +
        '<div class="table-foot" id="h-foot"></div></div>',
      mount: function () {
        function filtered() {
          var q = $('#h-q').value.trim().toLowerCase();
          return db.sales.filter(function (s) {
            if (!q) return true;
            return (s.invoice + ' ' + s.customer + ' ' + s.items.map(function (i) { return i.title; }).join(' ')).toLowerCase().indexOf(q) !== -1;
          }).slice().reverse();
        }
        function run() {
          var rows = filtered();
          $('#h-body').innerHTML = rows.length ? rows.map(function (s) {
            var units = s.items.reduce(function (a, i) { return a + i.qty; }, 0);
            var names = s.items.map(function (i) { return i.title; }).join(', ');
            return '<tr data-id="' + s.id + '"><td><b>' + esc(s.invoice) + '</b></td><td>' + fmtDT(s.date) + '</td><td>' + esc(s.customer) + '</td>' +
              '<td style="max-width:280px;overflow:hidden;text-overflow:ellipsis" title="' + esc(names) + '">' + esc(names) + '</td><td class="num">' + units + '</td><td class="num">' + money(s.total).replace('₹ ', '') + '</td>' +
              '<td><button class="btn small" data-act="view">' + icon('eye', 14) + 'View</button></td></tr>';
          }).join('') : '<tr><td colspan="7" class="empty">' + (db.sales.length ? 'No transactions match your search.' : 'No sales yet. Complete a sale from the Process Sale screen and it will appear here.') + '</td></tr>';
          $('#h-foot').textContent = db.sales.length ? 'Showing ' + rows.length + ' of ' + db.sales.length + ' transaction' + (db.sales.length === 1 ? '' : 's') : '';
        }
        $('#h-q').oninput = run;
        $('#h-export').onclick = function () {
          var rows = filtered().reverse();
          if (!rows.length) { toast('Nothing to export yet', 'error'); return; }
          exportCsv(rows); toast('Exported ' + rows.length + ' transaction' + (rows.length === 1 ? '' : 's'), 'success');
        };
        $('#h-body').onclick = function (e) {
          var btn = e.target.closest('[data-act="view"]'); if (!btn) return;
          var id = Number(btn.closest('tr').getAttribute('data-id'));
          var s = db.sales.filter(function (x) { return x.id === id; })[0];
          if (s) showReceipt(s, false);
        };
        run();
      }
    };
  };

  /* ===================== Router ===================== */
  function render() {
    var app = $('#app');
    try {
      if (!db.session) { renderLogin(); return; }
      var hash = location.hash.replace(/^#\/?/, '');
      var parts = hash.split('?');
      var name = PAGES.hasOwnProperty(parts[0]) ? parts[0] : 'home';
      var params = new URLSearchParams(parts[1] || '');
      var page = PAGES[name](params);
      app.innerHTML = shell(name, page);
      closeModal();
      var sb = $('#sidebar');
      $('#menu-btn').onclick = function () { sb.classList.toggle('open'); };
      $$('.nav a', sb).forEach(function (a) { a.addEventListener('click', function () { sb.classList.remove('open'); }); });
      $('#nav-logout').onclick = function () { sb.classList.remove('open'); doLogout(); };
      if (page.mount) page.mount($('#page'), params);
      window.scrollTo(0, 0);
      document.title = page.title + ' | Bookstore';
    } catch (e) {
      if (window.console) console.error(e);
      app.innerHTML = '<div style="padding:40px;text-align:center;font-family:sans-serif"><h2>Something went wrong</h2><p>Click the button to reset the saved data and reload the app.</p><button class="btn primary" id="hard-reset">Reset and reload</button></div>';
      var hr = $('#hard-reset');
      if (hr) hr.onclick = function () { try { window.localStorage.removeItem(KEY); } catch (x) { /* ignore */ } location.hash = ''; location.reload(); };
    }
  }

  window.addEventListener('hashchange', render);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();
