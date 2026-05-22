router.register('students', function(el, params={}) {
  const role = params.role || 'student';
  const title = role === 'teacher' ? 'Teachers' : 'Students';
  let page = 1;
  let search = '';
  let branchId = '';
  let active = 'true';
  let branches = [];

  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const money = v => 'INR ' + Number(v || 0).toLocaleString('en-IN');
  const date = v => v ? new Date(v).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '<span class="text-muted">-</span>';
  const initials = name => esc((name || '?').trim()[0] || '?').toUpperCase();
  const branchOptions = current => '<option value="">Default branch</option>' + branches.map(b =>
    '<option value="'+b._id+'" '+(String(current||'')===String(b._id)?'selected':'')+'>'+esc(b.name)+'</option>'
  ).join('');

  const loadBranches = async () => {
    try {
      const r = await api.get('/branches');
      branches = r.data || [];
    } catch(_) {
      branches = [];
    }
  };

  const renderStats = rows => {
    const activeCount = rows.filter(r => r.isActive).length;
    const withBranch = rows.filter(r => r.branchId).length;
    const recent = rows.filter(r => (Date.now() - new Date(r.createdAt).getTime()) < 30*24*60*60*1000).length;
    return '<div class="stats-grid">' +
      '<div class="stat-card"><div class="stat-label">Showing</div><div class="stat-value">'+rows.length+'</div><div class="stat-sub">on this page</div></div>' +
      '<div class="stat-card"><div class="stat-label">Active</div><div class="stat-value">'+activeCount+'</div><div class="stat-sub">ready to use features</div></div>' +
      '<div class="stat-card"><div class="stat-label">Assigned</div><div class="stat-value">'+withBranch+'</div><div class="stat-sub">with branch access</div></div>' +
      '<div class="stat-card"><div class="stat-label">New</div><div class="stat-value">'+recent+'</div><div class="stat-sub">last 30 days</div></div>' +
    '</div>';
  };

  const render = async () => {
    try {
      const qs = [
        'role='+encodeURIComponent(role),
        'page='+page,
        'limit=12',
        'search='+encodeURIComponent(search),
        'isActive='+encodeURIComponent(active),
      ];
      if (branchId) qs.push('branchId='+encodeURIComponent(branchId));
      const r = await api.get('/users?'+qs.join('&'));
      const rows = r.data || [];
      const pg = r.pagination || { total:0, page:1, pages:1 };

      el.innerHTML =
        '<div class="page-header"><div class="page-header-text"><h2>'+title+'</h2><p>'+pg.total+' '+title.toLowerCase()+' ready for classes, fees, attendance and learning access.</p></div>' +
        '<div class="page-header-actions">' +
          '<button class="btn btn-primary" id="add-user">' +
            '<svg viewBox="0 0 20 20" fill="none" width="15" height="15"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Add '+title.slice(0,-1)+'</button>' +
        '</div></div>' +
        renderStats(rows) +
        '<div class="toolbar">' +
          '<div class="search-wrap">' +
            '<span class="search-icon"><svg viewBox="0 0 20 20" fill="none" width="15" height="15"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M16 16l-3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>' +
            '<input class="search-input" id="search-box" placeholder="Search name, email or phone..." value="'+esc(search)+'"/>' +
          '</div>' +
          '<select class="form-control" id="branch-filter" style="max-width:220px"><option value="">All branches</option>'+branches.map(b => '<option value="'+b._id+'" '+(branchId===String(b._id)?'selected':'')+'>'+esc(b.name)+'</option>').join('')+'</select>' +
          '<select class="form-control" id="active-filter" style="max-width:160px"><option value="true" '+(active==='true'?'selected':'')+'>Active</option><option value="false" '+(active==='false'?'selected':'')+'>Inactive</option><option value="" '+(active===''?'selected':'')+'>All status</option></select>' +
        '</div>' +
        (rows.length === 0 ? '<div class="empty-state"><div class="empty-icon">'+(role==='teacher'?'T':'S')+'</div><h3>No '+title.toLowerCase()+' found</h3><p>'+(search?'Try a different search term.':'Add your first '+role+' to get started.')+'</p></div>' :
          renderTable([
            { key:'_', label:'User', render:(_,row) =>
              '<div class="user-cell">' +
                '<div class="avatar avatar-sm">'+initials(row.name)+'</div>' +
                '<div class="user-cell-info">' +
                  '<div class="user-cell-name">'+esc(row.name)+'</div>' +
                  '<div class="user-cell-email">'+esc(row.email)+'</div>' +
                '</div></div>'
            },
            { key:'phone', label:'Phone', render: v => v ? esc(v) : '<span class="text-muted">-</span>' },
            { key:'branchId', label:'Branch', render: v => v&&v.name ? '<span class="badge badge-gold">'+esc(v.name)+'</span>' : '<span class="text-muted">Unassigned</span>' },
            { key:'parentOf', label: role === 'student' ? 'Parent' : 'Linked Students', render: (_, row) =>
              role === 'student'
                ? '<span class="text-muted">Open profile</span>'
                : ((row.parentOf||[]).length ? '<span class="badge badge-info">'+row.parentOf.length+' linked</span>' : '<span class="text-muted">-</span>')
            },
            { key:'isActive', label:'Status', render: v => v ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-gray">Inactive</span>' },
            { key:'createdAt', label:'Joined', render: v => '<span class="text-muted font-mono" style="font-size:12px">'+date(v)+'</span>' },
          ], rows, [
            ...(role === 'student' ? [{ key:'profile', label:'Profile', cls:'btn-secondary btn-sm' }] : []),
            { key:'edit', label:'Edit', cls:'btn-secondary btn-sm' },
            { key:'deactivate', label:'Remove', cls:'btn-danger btn-sm' },
          ]) +
          '<div class="pagination">' +
            '<span>'+pg.total+' total &bull; Page '+pg.page+' of '+Math.max(pg.pages,1)+'</span>' +
            '<div class="pagination-btns">' +
              '<button class="pagination-btn" id="prev-pg" '+(page<=1?'disabled':'')+'>Prev</button>' +
              '<button class="pagination-btn" id="next-pg" '+(page>=pg.pages?'disabled':'')+'>Next</button>' +
            '</div>' +
          '</div>' +
          '</div>'
        );

      el.querySelector('#add-user').onclick = () => showUserForm(null);
      el.querySelector('#search-box').oninput = e => { search = e.target.value; page = 1; render(); };
      el.querySelector('#branch-filter').onchange = e => { branchId = e.target.value; page = 1; render(); };
      el.querySelector('#active-filter').onchange = e => { active = e.target.value; page = 1; render(); };
      if (el.querySelector('#prev-pg')) el.querySelector('#prev-pg').onclick = () => { if(page>1){page--;render();} };
      if (el.querySelector('#next-pg')) el.querySelector('#next-pg').onclick = () => { if(page<pg.pages){page++;render();} };
      el.querySelectorAll('[data-action]').forEach(btn => {
        const row = rows.find(r => r._id === btn.dataset.id);
        if (!row) return;
        if (btn.dataset.action === 'profile') btn.onclick = () => showStudentProfile(row);
        if (btn.dataset.action === 'edit') btn.onclick = () => showUserForm(row);
        if (btn.dataset.action === 'deactivate') btn.onclick = () => modal.confirm('Deactivate "'+esc(row.name)+'"?', async () => {
          try { await api.del('/users/'+row._id); toast.success('User deactivated'); render(); }
          catch(e) { toast.error(e.message); }
        });
      });
    } catch(e) {
      el.innerHTML = '<div class="card" style="border-color:var(--danger)"><p style="color:var(--danger)">'+esc(e.message)+'</p></div>';
    }
  };

  function showUserForm(user=null) {
    const ov = modal.show((user?'Edit ':'New ')+title.slice(0,-1),
      '<div class="form-row">' +
        '<div class="form-group"><label class="form-label">Full Name</label><input class="form-control" id="f-name" value="'+esc(user&&user.name||'')+'" placeholder="Priya Krishnan"/></div>' +
        '<div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="f-phone" value="'+esc(user&&user.phone||'')+'" placeholder="+91 9xxxxxxxxx"/></div>' +
      '</div>' +
      '<div class="form-group"><label class="form-label">Email Address</label><input class="form-control" id="f-email" type="email" value="'+esc(user&&user.email||'')+'" placeholder="email@example.com"/></div>' +
      '<div class="form-group"><label class="form-label">Branch</label><select class="form-control" id="f-branch">'+branchOptions(user&&user.branchId&&user.branchId._id)+'</select></div>' +
      (!user ? '<div class="form-group"><label class="form-label">Password</label><input class="form-control" id="f-pass" type="password" placeholder="Minimum 6 characters"/><div class="form-hint">Login password for the portal and mobile app.</div></div>' : '') +
      (user ? '<div class="form-group"><label class="form-label">Status</label><select class="form-control" id="f-active"><option value="true" '+(user.isActive?'selected':'')+'>Active</option><option value="false" '+(!user.isActive?'selected':'')+'>Inactive</option></select></div>' : ''),
      '<button class="btn btn-secondary modal-cancel">Cancel</button><button class="btn btn-primary" id="save-user">Save</button>'
    );
    ov.querySelector('.modal-cancel').onclick = () => ov.remove();
    ov.querySelector('#save-user').onclick = async () => {
      const body = {
        name: ov.querySelector('#f-name').value.trim(),
        email: ov.querySelector('#f-email').value.trim(),
        phone: ov.querySelector('#f-phone').value.trim(),
        branchId: ov.querySelector('#f-branch').value || undefined,
        role,
      };
      if (!body.name || !body.email) { toast.error('Name and email are required'); return; }
      if (!user) {
        body.password = ov.querySelector('#f-pass').value;
        if (body.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
      } else {
        body.isActive = ov.querySelector('#f-active').value === 'true';
      }
      try {
        user ? await api.put('/users/'+user._id, body) : await api.post('/users', body);
        ov.remove(); toast.success(title.slice(0,-1)+' saved'); render();
      } catch(e) { toast.error(e.message); }
    };
  }

  async function showStudentProfile(row) {
    const ov = modal.show('Student Profile', '<div class="empty-state"><div class="empty-icon">...</div><h3>Loading profile</h3></div>');
    ov.querySelector('.modal').style.maxWidth = '760px';
    try {
      const r = await api.get('/users/'+row._id+'/student-profile');
      const p = r.data;
      const t = p.totals || {};
      ov.querySelector('.modal-title').textContent = p.student.name;
      ov.querySelector('.modal-body').innerHTML =
        '<div class="stats-grid" style="grid-template-columns:repeat(auto-fit,minmax(145px,1fr));margin-bottom:18px">' +
          '<div class="stat-card"><div class="stat-label">Upcoming</div><div class="stat-value">'+(t.upcomingClasses||0)+'</div><div class="stat-sub">classes</div></div>' +
          '<div class="stat-card"><div class="stat-label">Attendance</div><div class="stat-value">'+(t.attendancePresent||0)+'</div><div class="stat-sub">of '+(t.attendanceMarked||0)+' marked</div></div>' +
          '<div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value" style="font-size:22px">'+money(t.pendingAmount)+'</div><div class="stat-sub">fees due</div></div>' +
          '<div class="stat-card"><div class="stat-label">Progress</div><div class="stat-value">'+(t.progressCompleted||0)+'</div><div class="stat-sub">completed items</div></div>' +
        '</div>' +
        '<div class="card" style="margin-bottom:14px"><div class="card-header"><div><div class="card-title">Student Access</div><div class="card-subtitle">'+esc(p.student.email)+' &bull; '+esc(p.student.phone || 'No phone')+'</div></div><span class="badge '+(p.student.isActive?'badge-success':'badge-gray')+'">'+(p.student.isActive?'Active':'Inactive')+'</span></div>' +
          '<div class="flex gap-2" style="flex-wrap:wrap"><button class="btn btn-secondary btn-sm" id="profile-link-parent">Link parent</button><button class="btn btn-secondary btn-sm" id="profile-fee">Record paid fee</button><button class="btn btn-secondary btn-sm" id="profile-edit">Edit student</button></div></div>' +
        '<div class="form-row">' +
          '<div class="card"><div class="card-title" style="margin-bottom:10px">Parents</div>' + renderParents(p.parents) + '</div>' +
          '<div class="card"><div class="card-title" style="margin-bottom:10px">Recent Payments</div>' + renderPayments(p.payments) + '</div>' +
        '</div>' +
        '<div class="card" style="margin-top:14px"><div class="card-title" style="margin-bottom:10px">Recent Classes</div>' + renderClasses(p.classes) + '</div>';
      ov.querySelector('#profile-link-parent').onclick = () => showParentForm(p.student, ov);
      ov.querySelector('#profile-fee').onclick = () => showFeeForm(p.student, ov);
      ov.querySelector('#profile-edit').onclick = () => { ov.remove(); showUserForm(row); };
    } catch(e) {
      ov.querySelector('.modal-body').innerHTML = '<p style="color:var(--danger)">'+esc(e.message)+'</p>';
    }
  }

  function renderParents(parents) {
    if (!parents || !parents.length) return '<p class="text-muted" style="font-size:13px">No parent linked yet.</p>';
    return parents.map(p => '<div class="user-cell" style="margin-bottom:10px"><div class="avatar avatar-sm">'+initials(p.name)+'</div><div><div class="user-cell-name">'+esc(p.name)+'</div><div class="user-cell-email">'+esc(p.email)+'</div></div></div>').join('');
  }

  function renderPayments(payments) {
    if (!payments || !payments.length) return '<p class="text-muted" style="font-size:13px">No payments yet.</p>';
    return payments.slice(0,4).map(p => '<div class="flex justify-between gap-2" style="padding:8px 0;border-bottom:1px solid var(--border)"><span>'+esc(p.month || p.description || 'Fee')+'</span><span class="badge '+(p.status==='paid'?'badge-success':'badge-warning')+'">'+money(p.amount)+'</span></div>').join('');
  }

  function renderClasses(classes) {
    if (!classes || !classes.length) return '<p class="text-muted" style="font-size:13px">No classes assigned yet.</p>';
    return classes.slice(0,5).map(c => '<div class="flex justify-between gap-2" style="padding:9px 0;border-bottom:1px solid var(--border)"><div><div class="user-cell-name">'+esc(c.title)+'</div><div class="user-cell-email">'+date(c.scheduledAt)+' &bull; '+esc(c.teacherId&&c.teacherId.name || 'No teacher')+'</div></div><span class="badge badge-gray">'+esc(c.status)+'</span></div>').join('');
  }

  function showParentForm(student, parentOv) {
    const ov = modal.show('Link Parent',
      '<div class="form-group"><label class="form-label">Parent Email</label><input class="form-control" id="p-email" type="email" placeholder="parent@example.com"/></div>' +
      '<div class="form-row"><div class="form-group"><label class="form-label">Parent Name</label><input class="form-control" id="p-name" placeholder="Parent name"/></div><div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="p-phone" placeholder="+91 9xxxxxxxxx"/></div></div>' +
      '<div class="form-group"><label class="form-label">Password for new parent</label><input class="form-control" id="p-pass" type="password" placeholder="Minimum 6 characters"/><div class="form-hint">If the email already exists as a parent, this password is ignored.</div></div>',
      '<button class="btn btn-secondary modal-cancel">Cancel</button><button class="btn btn-primary" id="save-parent">Link</button>'
    );
    ov.querySelector('.modal-cancel').onclick = () => ov.remove();
    ov.querySelector('#save-parent').onclick = async () => {
      const email = ov.querySelector('#p-email').value.trim();
      const name = ov.querySelector('#p-name').value.trim();
      const phone = ov.querySelector('#p-phone').value.trim();
      const password = ov.querySelector('#p-pass').value;
      if (!email) { toast.error('Parent email is required'); return; }
      try {
        const found = await api.get('/users?role=parent&search='+encodeURIComponent(email)+'&limit=1');
        let parent = (found.data || []).find(u => u.email === email);
        if (!parent) {
          if (!name || password.length < 6) { toast.error('Name and 6 character password required for new parent'); return; }
          const created = await api.post('/users', { name, email, phone, password, role:'parent', branchId: student.branchId&&student.branchId._id });
          parent = created.data;
        }
        await api.post('/users/'+student._id+'/link-parent', { parentId: parent._id });
        ov.remove(); parentOv.remove(); toast.success('Parent linked'); render();
      } catch(e) { toast.error(e.message); }
    };
  }

  function showFeeForm(student, profileOv) {
    const ov = modal.show('Record Paid Fee',
      '<div class="form-row"><div class="form-group"><label class="form-label">Amount</label><input class="form-control" id="fee-amount" type="number" min="1" placeholder="2500"/></div><div class="form-group"><label class="form-label">Month</label><input class="form-control" id="fee-month" placeholder="May 2026"/></div></div>' +
      '<div class="form-group"><label class="form-label">Description</label><input class="form-control" id="fee-desc" placeholder="Monthly fee"/></div>',
      '<button class="btn btn-secondary modal-cancel">Cancel</button><button class="btn btn-primary" id="save-fee">Save</button>'
    );
    ov.querySelector('.modal-cancel').onclick = () => ov.remove();
    ov.querySelector('#save-fee').onclick = async () => {
      const amount = Number(ov.querySelector('#fee-amount').value);
      if (!amount) { toast.error('Amount is required'); return; }
      try {
        await api.post('/payments/manual', {
          studentId: student._id,
          branchId: student.branchId&&student.branchId._id,
          amount,
          month: ov.querySelector('#fee-month').value.trim(),
          description: ov.querySelector('#fee-desc').value.trim() || 'Fee',
        });
        ov.remove(); profileOv.remove(); toast.success('Payment recorded'); render();
      } catch(e) { toast.error(e.message); }
    };
  }

  loadBranches().then(render);
});

router.register('teachers', el => router.go('students', { role:'teacher' }));
