/* eslint-disable */
router.register('learn-attendance', async function(el) {
  const escapeHtml = (s='') => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const attendedStatuses = ['present', 'late', 'joined'];
  const statusBadge = s => {
    const cls = s === 'late' ? 'badge-warning' : 'badge-success';
    const label = s === 'joined' ? 'Joined' : s.charAt(0).toUpperCase() + s.slice(1);
    return '<span class="badge '+cls+'">'+label+'</span>';
  };
  const fmtDate = v => v ? new Date(v).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '-';
  const fmtTime = v => v ? new Date(v).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : '';

  try {
    const r = await api.get('/attendance?limit=100');
    const attended = (r.data || []).filter(a => attendedStatuses.includes(a.status));
    const present = attended.filter(a => a.status === 'present' || a.status === 'joined').length;
    const late = attended.filter(a => a.status === 'late').length;

    el.innerHTML =
      '<div class="page-header"><div class="page-header-text">'+
        '<h2>Attendance</h2>'+
        '<p>Your attended classes only.</p>'+
      '</div></div>'+

      '<div class="stats-grid">'+
        '<div class="stat-card"><div class="stat-label">Attended</div><div class="stat-value">'+attended.length+'</div><div class="stat-sub">classes</div></div>'+
        '<div class="stat-card"><div class="stat-label">Present</div><div class="stat-value">'+present+'</div><div class="stat-sub">marked present or joined</div></div>'+
        '<div class="stat-card"><div class="stat-label">Late</div><div class="stat-value">'+late+'</div><div class="stat-sub">marked late</div></div>'+
      '</div>'+

      (attended.length === 0 ?
        '<div class="empty-state"><div class="empty-icon">✓</div><h3>No attended classes yet</h3><p>Classes marked present, late, or joined will appear here.</p></div>' :
        renderTable([
          { key:'classId', label:'Class', render: v =>
            v && v.title
              ? '<div><div class="user-cell-name">'+escapeHtml(v.title)+'</div><div class="user-cell-email">'+fmtDate(v.scheduledAt)+' · '+fmtTime(v.scheduledAt)+'</div></div>'
              : '<span class="text-muted">Class</span>'
          },
          { key:'status', label:'Attendance', render: v => statusBadge(v) },
          { key:'updatedAt', label:'Marked On', render: v => '<span class="text-muted font-mono" style="font-size:12px">'+fmtDate(v)+'</span>' },
        ], attended)
      );
  } catch (e) {
    el.innerHTML = '<div class="card" style="border-color:var(--danger)"><p style="color:var(--danger)">'+escapeHtml(e.message)+'</p></div>';
  }
});
