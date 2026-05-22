router.register('attendance', async function(el) {
  let selectedClass = null;

  const statusConfig = {
    present: { label:'Present', color:'var(--success)',   bg:'var(--success-lt)',  icon:'✓' },
    absent:  { label:'Absent',  color:'var(--danger)',    bg:'var(--danger-lt)',   icon:'✕' },
    late:    { label:'Late',    color:'var(--warning)',   bg:'var(--warning-lt)',  icon:'◷' },
  };

  const renderClassList = async () => {
    try {
      const today = new Date().toISOString().slice(0,10);
      const r = await api.get('/classes?limit=30&status=scheduled');
      const classes = r.data || [];
      el.innerHTML =
        '<div class="page-header"><div class="page-header-text"><h2>Attendance</h2>' +
        '<p>Select a class to mark attendance.</p></div></div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">' +
        classes.map(c => {
          const dt = new Date(c.scheduledAt);
          const isToday = dt.toISOString().slice(0,10) === today;
          return '<div class="card att-class-card" data-id="'+c._id+'" style="cursor:pointer;padding:18px;transition:all .15s">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
              '<span class="badge '+(isToday?'badge-success':'badge-info')+'">'+( isToday?'Today':dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) )+'</span>' +
              '<span class="badge badge-gold">'+(c.studentIds&&c.studentIds.length||0)+' students</span>' +
            '</div>' +
            '<div style="font-family:\'Playfair Display\',serif;font-size:16px;font-weight:600;margin-bottom:4px">'+c.title+'</div>' +
            '<div style="font-size:12px;color:var(--text-3)">'+dt.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})+ ' · '+(c.type==='group'?'Group':'1-to-1')+'</div>' +
            '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">' +
              '<span style="font-size:12px;color:var(--text-3)">'+(c.teacherId&&c.teacherId.name||'No teacher assigned')+'</span>' +
              '<span class="btn btn-primary btn-sm">Mark Attendance →</span>' +
            '</div>' +
          '</div>';
        }).join('') +
        (classes.length===0?'<div class="empty-state"><div class="empty-icon">📅</div><h3>No upcoming classes</h3><p>Schedule classes first.</p></div>':'') +
        '</div>';

      el.querySelectorAll('.att-class-card').forEach(card => {
        card.onmouseenter = () => { card.style.transform='translateY(-2px)'; card.style.boxShadow='var(--shadow)'; };
        card.onmouseleave = () => { card.style.transform=''; card.style.boxShadow=''; };
        card.onclick = () => renderRoster(card.dataset.id);
      });
    } catch(e) {
      el.innerHTML = '<div class="card" style="border-color:var(--danger)"><p style="color:var(--danger)">'+e.message+'</p></div>';
    }
  };

  const renderRoster = async (classId) => {
    try {
      const r = await api.get('/attendance/class/'+classId+'/roster');
      const { class: cls, roster } = r.data;
      const dt = new Date(cls.scheduledAt);

      // Local state — track changes before saving
      const state = {};
      roster.forEach(s => { state[s._id] = s.status; });

      const renderStudentCards = () => {
        const container = el.querySelector('#student-cards');
        if (!container) return;
        container.innerHTML = roster.map(s => {
          const st = state[s._id] || 'absent';
          const cfg = statusConfig[st];
          return '<div class="att-student-card" data-student="'+s._id+'" style="background:var(--white);border:2px solid '+cfg.color+';border-radius:12px;padding:16px;transition:all .2s">' +
            '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">' +
              '<div class="avatar" style="background:'+cfg.bg+';color:'+cfg.color+'">'+s.name[0].toUpperCase()+'</div>' +
              '<div style="flex:1"><div style="font-weight:600;font-size:14px">'+s.name+'</div>' +
              '<div style="font-size:11px;color:var(--text-3)">'+s.email+'</div></div>' +
              '<span class="badge" style="background:'+cfg.bg+';color:'+cfg.color+'">'+cfg.icon+' '+cfg.label+'</span>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">' +
              ['present','absent','late'].map(status => {
                const sc = statusConfig[status];
                const active = state[s._id] === status;
                return '<button class="att-status-btn" data-student="'+s._id+'" data-status="'+status+'" ' +
                  'style="padding:7px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid '+(active?sc.color:' var(--border)')+';background:'+(active?sc.bg:'var(--cream)')+';color:'+(active?sc.color:'var(--text-3)')+'">'+sc.icon+' '+sc.label+'</button>';
              }).join('') +
            '</div>' +
          '</div>';
        }).join('');

        // Attach status button handlers
        container.querySelectorAll('.att-status-btn').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            const sid = btn.dataset.student;
            state[sid] = btn.dataset.status;
            renderStudentCards();
            updateSummary();
          };
        });
      };

      const updateSummary = () => {
        const counts = { present:0, absent:0, late:0 };
        Object.values(state).forEach(s => { if(counts[s]!==undefined) counts[s]++; });
        const total = roster.length;
        el.querySelector('#att-summary-present').textContent = counts.present;
        el.querySelector('#att-summary-absent').textContent  = counts.absent;
        el.querySelector('#att-summary-late').textContent    = counts.late;
        el.querySelector('#att-pct').textContent = total ? Math.round((counts.present+counts.late)/total*100)+'%' : '0%';
      };

      // Mark all shortcuts
      const markAll = (status) => {
        roster.forEach(s => { state[s._id] = status; });
        renderStudentCards();
        updateSummary();
      };

      el.innerHTML =
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:22px">' +
          '<button class="btn btn-secondary btn-sm" id="back-btn">← Back</button>' +
          '<div><h2 style="font-family:\'Playfair Display\',serif;font-size:20px">'+cls.title+'</h2>' +
          '<p style="font-size:12px;color:var(--text-3)">'+dt.toLocaleDateString('en-IN',{weekday:'long',day:'2-digit',month:'long'})+' · '+dt.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})+'</p></div>' +
        '</div>' +

        // Summary strip
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">' +
          '<div class="stat-card" style="padding:14px;text-align:center"><div class="stat-label">Total</div><div class="stat-value" style="font-size:22px">'+roster.length+'</div></div>' +
          '<div class="stat-card" style="padding:14px;text-align:center;border-color:var(--success)"><div class="stat-label" style="color:var(--success)">Present</div><div class="stat-value" style="font-size:22px;color:var(--success)" id="att-summary-present">0</div></div>' +
          '<div class="stat-card" style="padding:14px;text-align:center;border-color:var(--danger)"><div class="stat-label" style="color:var(--danger)">Absent</div><div class="stat-value" style="font-size:22px;color:var(--danger)" id="att-summary-absent">0</div></div>' +
          '<div class="stat-card" style="padding:14px;text-align:center;border-color:var(--warning)"><div class="stat-label" style="color:var(--warning)">Late</div><div class="stat-value" style="font-size:22px;color:var(--warning)" id="att-summary-late">0</div></div>' +
        '</div>' +

        // Quick actions
        '<div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;align-items:center">' +
          '<span style="font-size:13px;color:var(--text-3);margin-right:4px">Mark all:</span>' +
          '<button class="btn btn-sm" id="mark-all-present" style="background:var(--success-lt);color:var(--success);border:1px solid var(--success)">✓ All Present</button>' +
          '<button class="btn btn-sm" id="mark-all-absent"  style="background:var(--danger-lt);color:var(--danger);border:1px solid var(--danger)">✕ All Absent</button>' +
          '<div style="flex:1"></div>' +
          '<span style="font-size:13px;font-weight:600;color:var(--text-2)">Attendance: <span id="att-pct" style="color:var(--gold-dk)">0%</span></span>' +
        '</div>' +

        // Student cards grid
        '<div id="student-cards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-bottom:24px"></div>' +

        // Save button
        '<div style="position:sticky;bottom:0;background:linear-gradient(transparent,var(--cream) 30%);padding:20px 0 8px;display:flex;gap:10px;justify-content:flex-end">' +
          '<button class="btn btn-secondary" id="back-btn-2">Cancel</button>' +
          '<button class="btn btn-primary" id="save-att" style="min-width:160px">💾 Save Attendance</button>' +
        '</div>';

      renderStudentCards();
      updateSummary();

      el.querySelector('#back-btn').onclick    = renderClassList;
      el.querySelector('#back-btn-2').onclick  = renderClassList;
      el.querySelector('#mark-all-present').onclick = () => markAll('present');
      el.querySelector('#mark-all-absent').onclick  = () => markAll('absent');

      el.querySelector('#save-att').onclick = async () => {
        const btn = el.querySelector('#save-att');
        btn.textContent = 'Saving…'; btn.disabled = true;
        try {
          const records = Object.entries(state).map(([studentId, status]) => ({ studentId, status }));
          const saved = await api.post('/attendance/bulk', { classId: cls._id, records });
          const created = saved.data && saved.data.payments ? saved.data.payments.length : 0;
          toast.success(created ? 'Attendance saved and '+created+' pending fee(s) created!' : 'Attendance saved for '+records.length+' students!');
          renderClassList();
        } catch(e) {
          toast.error(e.message);
          btn.textContent = '💾 Save Attendance'; btn.disabled = false;
        }
      };

    } catch(e) {
      el.innerHTML = '<div class="card" style="border-color:var(--danger)"><p style="color:var(--danger)">'+e.message+'</p></div>';
    }
  };

  renderClassList();
});
