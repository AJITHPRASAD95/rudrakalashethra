(function(){
  // Admin / teacher navigation
  const NAV_ADMIN = [
    { page:'dashboard',   label:'Dashboard',      icon:'grid' },
    { page:'branches',    label:'Branches',        icon:'building' },
    { page:'students',    label:'Students',        icon:'users' },
    { page:'classes',     label:'Classes',         icon:'calendar' },
    { page:'attendance',  label:'Attendance',      icon:'attendance' },
    { page:'fees',        label:'Fee Structures',  icon:'money' },
    { page:'payments',    label:'Payments',        icon:'payments' },
    { page:'content',     label:'Media Library',   icon:'content' },
    { page:'mudras',      label:'Mudras',          icon:'mudras' },
    { page:'theory',      label:'Theory',          icon:'book' },
    { page:'quizzes',     label:'Quizzes',         icon:'quiz' },
  ];

  // Student-facing navigation
  const NAV_STUDENT = [
    { page:'learn-dashboard', label:'My Learning',   icon:'grid' },
    { page:'learn-attendance', label:'Attendance',   icon:'attendance' },
    { page:'learn-mudras',    label:'Mudras',        icon:'mudras' },
    { page:'learn-theory',    label:'Theory',        icon:'book' },
    { page:'learn-videos',    label:'Videos',        icon:'content' },
    { page:'learn-quizzes',   label:'Quizzes',       icon:'quiz' },
  ];

  const ICONS = {
    grid:     '<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/></svg>',
    building: '<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M3 18V5a1 1 0 011-1h12a1 1 0 011 1v13M1 18h18M8 8h1m3 0h1M8 12h1m3 0h1M8 16h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    users:    '<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><circle cx="7" cy="7" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M1 17c0-3.314 2.686-5 6-5s6 1.686 6 5M14 9a3 3 0 000-6M19 17c0-2.761-2-4.5-5-4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    calendar: '<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 9h16M7 2v4m6-4v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    money:    '<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><rect x="1" y="4" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>',
    payments: '<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><rect x="1" y="4" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M1 9h18" stroke="currentColor" stroke-width="1.5"/></svg>',
    attendance:'<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M9 11l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/></svg>',
    content:  '<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M4 4h12M4 8h12M4 12h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="15" cy="15" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M14 15l1 1 2-2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    mudras:   '<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M6 17V8a1.5 1.5 0 013 0v3m0-3V5a1.5 1.5 0 013 0v6m0-3V6a1.5 1.5 0 013 0v8a4 4 0 01-4 4H8a3 3 0 01-2.83-2L4 13a1 1 0 011.41-1.18L7 13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    book:     '<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M3 4a1 1 0 011-1h5a2 2 0 012 2v12a2 2 0 00-2-2H3V4zM17 4a1 1 0 00-1-1h-5a2 2 0 00-2 2v12a2 2 0 012-2h6V4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    quiz:     '<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 8a3 3 0 013-3M10 12v.01M10 11a2 2 0 00.5-3.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  };

  function navFor(user) {
    if (user.role === 'student' || user.role === 'parent') return NAV_STUDENT;
    return NAV_ADMIN;
  }

  function defaultPage(user) {
    return (user.role === 'student' || user.role === 'parent') ? 'learn-dashboard' : 'dashboard';
  }

  function buildNav(user) {
    const NAV = navFor(user);
    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = NAV.map(n =>
      '<div class="nav-item" data-page="'+n.page+'">' +
        '<div class="nav-icon">'+(ICONS[n.icon]||'')+'</div>' +
        '<span class="nav-label">'+n.label+'</span>' +
      '</div>'
    ).join('');
    nav.querySelectorAll('.nav-item').forEach(el => {
      el.onclick = () => {
        router.go(el.dataset.page);
        closeSidebar();
      };
    });
  }

  function setUserInfo(user) {
    document.getElementById('sidebar-avatar').textContent   = user.name[0].toUpperCase();
    document.getElementById('sidebar-user-name').textContent = user.name;
    document.getElementById('sidebar-user-email').textContent = user.email;
    document.getElementById('sidebar-role-tag').textContent  = user.role.replace(/_/g,' ');
    document.getElementById('topbar-role-badge').textContent = user.role.replace(/_/g,' ');

    // Switch the page title between Admin and Student
    const isStudent = user.role === 'student' || user.role === 'parent';
    document.title = isStudent ? 'Nritya Academy — Learn' : 'Nritya Academy — Admin';
    const brandSub = document.querySelector('.brand-sub');
    if (brandSub) brandSub.textContent = isStudent ? 'Student Portal' : 'Administration Portal';
  }

  function showApp(user) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-shell').style.display   = 'flex';
    buildNav(user);
    setUserInfo(user);
    router.go(defaultPage(user));
  }

  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('show');
  }
  function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('show');
  }

  // ── Login ──────────────────────────────────────────────────────────────
  document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn  = document.getElementById('login-btn');
    const txt  = document.getElementById('login-btn-text');
    const spin = document.getElementById('login-spinner');
    const err  = document.getElementById('login-error');
    txt.textContent = 'Signing in…'; spin.style.display='inline'; btn.disabled=true; err.style.display='none';
    try {
      const r = await api.post('/auth/login', {
        email:    document.getElementById('login-email').value,
        password: document.getElementById('login-password').value,
      });
      localStorage.setItem('ds_token', r.data.token);
      store.set('token', r.data.token);
      store.set('user',  r.data.user);
      showApp(r.data.user);
    } catch(e) {
      err.textContent = e.message; err.style.display='block';
    } finally {
      txt.textContent='Sign in'; spin.style.display='none'; btn.disabled=false;
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────
  document.getElementById('btn-logout').onclick = async () => {
    try { await api.post('/auth/logout', {}); } catch(_){}
    localStorage.removeItem('ds_token');
    store.set('token', null); store.set('user', null);
    document.getElementById('main-shell').style.display  = 'none';
    document.getElementById('login-screen').style.display = 'flex';
  };

  // ── Mobile sidebar ─────────────────────────────────────────────────────
  document.getElementById('btn-menu').onclick = openSidebar;
  document.getElementById('sidebar-close').onclick = closeSidebar;
  document.getElementById('sidebar-overlay').onclick = closeSidebar;

  // ── Auto-login ─────────────────────────────────────────────────────────
  const token = localStorage.getItem('ds_token');
  if (token) {
    api.get('/auth/me').then(r => { store.set('user', r.data); showApp(r.data); }).catch(() => {
      localStorage.removeItem('ds_token');
    });
  }
})();
