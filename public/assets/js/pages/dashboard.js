router.register('dashboard', async function(el) {
  try {
    const r = await api.get('/dashboard');
    const d = r.data;
    const fmt = n => (n||0).toLocaleString('en-IN');
    const fmtRs = n => '₹' + (n||0).toLocaleString('en-IN');

    const stats = [
      { label:'Total Students', value: fmt(d.totalStudents), sub:'Active enrollments', icon:'👥', color:'#4ecdc4', bg:'rgba(78,205,196,.12)' },
      { label:'Teachers',       value: fmt(d.totalTeachers), sub:'Active faculty', icon:'🎓', color:'#c9a96e', bg:'rgba(201,169,110,.12)' },
      { label:'Courses',        value: fmt(d.totalCourses),  sub:'Published',     icon:'📚', color:'#6ea8fe', bg:'rgba(110,168,254,.12)' },
      { label:'Upcoming Classes',value: fmt(d.upcomingClasses), sub:'Scheduled', icon:'📅', color:'#a78bfa', bg:'rgba(167,139,250,.12)' },
      { label:'Monthly Revenue', value: fmtRs(d.monthlyRevenue), sub:'This month', icon:'💰', color:'#2d9e6e', bg:'rgba(45,158,110,.12)' },
      { label:'Pending Dues',   value: fmt(d.pendingPayments), sub:'Awaiting payment', icon:'⚠️', color:'#c97b20', bg:'rgba(201,123,32,.12)' },
      { label:'Live Now',       value: fmt(d.activeClasses),  sub:'Classes in session', icon:'🔴', color:'#e07070', bg:'rgba(224,112,112,.12)' },
      { label:'Submissions',    value: fmt(d.recentSubmissions), sub:'This month', icon:'🎬', color:'#7c5cfc', bg:'rgba(124,92,252,.12)' },
    ];

    el.innerHTML =
      '<div class="page-header"><div class="page-header-text">' +
        '<h2>Good morning ✦</h2>' +
        '<p>Here\'s what\'s happening at your academy today.</p>' +
      '</div></div>' +
      '<div class="stats-grid">' +
        stats.map(s =>
          '<div class="stat-card">' +
            '<div class="stat-icon-wrap" style="background:'+s.bg+'"><span style="font-size:20px">'+s.icon+'</span></div>' +
            '<div class="stat-label">'+s.label+'</div>' +
            '<div class="stat-value">'+s.value+'</div>' +
            '<div class="stat-sub">'+s.sub+'</div>' +
          '</div>'
        ).join('') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:4px">' +
        '<div class="card"><div class="card-header"><span class="card-title">Quick Actions</span></div>' +
          '<div style="display:flex;flex-direction:column;gap:8px">' +
            [
              ['Schedule a class', 'classes'],
              ['Add a student', 'students'],
              ['Record payment', 'payments'],
              ['Manage branches', 'branches'],
            ].map(([label, page]) =>
              '<button class="btn btn-secondary" style="justify-content:space-between" onclick="router.go(\''+page+'\')">'+
                '<span>'+label+'</span>' +
                '<svg viewBox="0 0 16 16" fill="none" width="12" height="12"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
              '</button>'
            ).join('') +
          '</div>' +
        '</div>' +
        '<div class="card"><div class="card-header"><span class="card-title">System Info</span></div>' +
          '<div style="display:flex;flex-direction:column;gap:10px;font-size:13px;color:var(--text-2)">' +
            '<div style="display:flex;justify-content:space-between"><span>API Version</span><span class="font-mono" style="color:var(--gold-dk)">v1.0.0</span></div>' +
            '<div style="display:flex;justify-content:space-between"><span>School Slug</span><span class="font-mono">default</span></div>' +
            '<div style="display:flex;justify-content:space-between"><span>Storage</span><span class="badge badge-success">Online</span></div>' +
            '<div style="display:flex;justify-content:space-between"><span>Last Sync</span><span>' + new Date().toLocaleTimeString('en-IN') + '</span></div>' +
          '</div>' +
        '</div>' +
      '</div>';
  } catch(e) {
    el.innerHTML = '<div class="card" style="border-color:var(--danger);background:var(--danger-lt)"><p style="color:var(--danger)">Failed to load dashboard: '+e.message+'</p></div>';
  }
});
