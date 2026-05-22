router.register('classes', async function(el) {
  let page=1, dateFilter='', statusFilter='', branchFilter='';
  let branches = [];

  try {
    branches = (await api.get('/branches')).data || [];
  } catch(_) {
    branches = [];
  }

  const statusBadge = s => {
    const m = { scheduled:'badge-info', live:'badge-success', completed:'badge-gray', cancelled:'badge-danger' };
    return '<span class="badge '+(m[s]||'badge-gray')+'">'+s+'</span>';
  };

  const render = async () => {
    try {
      let url = '/classes?page='+page+'&limit=10';
      if (dateFilter) url += '&date='+dateFilter;
      if (statusFilter) url += '&status='+statusFilter;
      if (branchFilter) url += '&branchId='+branchFilter;

      const r = await api.get(url);
      const rows = r.data || []; const pg = r.pagination || {total:0,page:1,pages:1};

      el.innerHTML =
        '<div class="page-header"><div class="page-header-text"><h2>Live Classes</h2><p>Schedule and manage your Google Meet sessions.</p></div>' +
        '<div class="page-header-actions"><button class="btn btn-primary" id="add-class">' +
          '<svg viewBox="0 0 20 20" fill="none" width="15" height="15"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Schedule Class</button></div></div>' +
        '<div class="toolbar">' +
          '<input type="date" class="form-control" id="date-filter" style="width:175px" value="'+dateFilter+'"/>' +
          '<select class="form-control" id="status-filter" style="width:160px">' +
            '<option value="">All Statuses</option>' +
            ['scheduled','live','completed','cancelled'].map(s=>'<option value="'+s+'" '+(statusFilter===s?'selected':'')+'>'+s.charAt(0).toUpperCase()+s.slice(1)+'</option>').join('') +
          '</select>' +
          '<select class="form-control" id="branch-filter" style="width:190px">' +
            '<option value="">All Branches</option>' +
            branches.map(b=>'<option value="'+b._id+'" '+(branchFilter===String(b._id)?'selected':'')+'>'+b.name+'</option>').join('') +
          '</select>' +
        '</div>' +
        (rows.length === 0 ?
          '<div class="empty-state"><div class="empty-icon">📅</div><h3>No classes found</h3><p>Schedule your first class to get started.</p></div>' :
          renderTable([
            { key:'title',  label:'Class', render:(v,row) =>
              '<div><div style="font-weight:500">'+v+'</div><div style="font-size:12px;color:var(--text-3)">'+( row.type==='group'?'Group':'1-to-1')+' · '+(row.durationMins||60)+' min</div></div>'
            },
            { key:'teacherId', label:'Teacher', render: v => v&&v.name ?
              '<div class="user-cell"><div class="avatar avatar-sm">'+v.name[0]+'</div><span>'+v.name+'</span></div>' :
              '<span class="text-muted">—</span>'
            },
            { key:'branchId', label:'Branch', render: v => v&&v.name ? '<span class="badge badge-gold">'+v.name+'</span>' : '<span class="text-muted">Branch</span>' },
            { key:'scheduledAt', label:'Date & Time', render: v =>
              '<div style="font-family:\'JetBrains Mono\',monospace;font-size:12px">'+
                '<div style="font-weight:500;color:var(--text)">'+new Date(v).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})+'</div>'+
                '<div style="color:var(--text-3)">'+new Date(v).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})+'</div>'+
              '</div>'
            },
            { key:'status', label:'Status', render: v => statusBadge(v) },
            { key:'studentIds', label:'Students', render: v => '<span class="badge badge-gold">'+((v&&v.length)||0)+' enrolled</span>' },
            { key:'meetLink', label:'Meet', render: v => v ?
              '<a href="'+v+'" target="_blank" class="btn btn-sm btn-secondary">Join ↗</a>' :
              '<span class="text-muted" style="font-size:12px">No link yet</span>'
            },
          ], rows, [
            { key:'edit',   label:'Edit',   cls:'btn-secondary btn-sm' },
            { key:'cancel', label:'Cancel', cls:'btn-danger btn-sm' },
          ]) +
          '<div class="pagination">' +
            '<span>'+pg.total+' total &bull; Page '+pg.page+' of '+pg.pages+'</span>' +
            '<div class="pagination-btns">' +
              '<button class="pagination-btn" id="prev-pg" '+(page<=1?'disabled':'')+'>← Prev</button>' +
              '<button class="pagination-btn" id="next-pg" '+(page>=pg.pages?'disabled':'')+'>Next →</button>' +
            '</div>' +
          '</div>' +
          '</div>'
        );

      el.querySelector('#date-filter').onchange = e => { dateFilter=e.target.value; page=1; render(); };
      el.querySelector('#status-filter').onchange = e => { statusFilter=e.target.value; page=1; render(); };
      el.querySelector('#branch-filter').onchange = e => { branchFilter=e.target.value; page=1; render(); };
      el.querySelector('#add-class').onclick = () => showClassForm(null);
      if(el.querySelector('#prev-pg')) el.querySelector('#prev-pg').onclick = ()=>{ if(page>1){page--;render();} };
      if(el.querySelector('#next-pg')) el.querySelector('#next-pg').onclick = ()=>{ if(page<pg.pages){page++;render();} };
      el.querySelectorAll('[data-action="edit"]').forEach(btn => {
        const row = rows.find(r=>r._id===btn.dataset.id);
        btn.onclick = () => showClassForm(row);
      });
      el.querySelectorAll('[data-action="cancel"]').forEach(btn => {
        const row = rows.find(r=>r._id===btn.dataset.id);
        btn.onclick = () => modal.confirm('Cancel class "'+row.title+'"?', async () => {
          try { await api.put('/classes/'+row._id+'/status',{status:'cancelled'}); toast.success('Class cancelled'); render(); }
          catch(e) { toast.error(e.message); }
        });
      });
    } catch(e) { el.innerHTML = '<div class="card" style="border-color:var(--danger)"><p style="color:var(--danger)">'+e.message+'</p></div>'; }
  };

  function showClassForm(cls=null) {
    const dtVal = cls ? new Date(cls.scheduledAt).toISOString().slice(0,16) : '';
    const ov = modal.show(cls?'Edit Class':'Schedule New Class',
      '<div class="form-group"><label class="form-label">Class Title</label>' +
        '<input class="form-control" id="f-title" value="'+(cls&&cls.title||'')+'" placeholder="e.g. Bharatanatyam Basics — Batch A"/></div>' +
      '<div class="form-row">' +
        '<div class="form-group"><label class="form-label">Type</label><select class="form-control" id="f-type">' +
          '<option value="group" '+((!cls||cls.type==="group")?"selected":"")+'>Group</option>' +
          '<option value="one_to_one" '+(cls&&cls.type==="one_to_one"?"selected":"")+'>1-to-1</option>' +
        '</select></div>' +
        '<div class="form-group"><label class="form-label">Duration (min)</label><input class="form-control" id="f-dur" type="number" value="'+(cls&&cls.durationMins||60)+'" min="15" step="15"/></div>' +
      '</div>' +
      '<div class="form-group"><label class="form-label">Branch</label>' +
        '<select class="form-control" id="f-branch"><option value="">Select Branch</option>'+branches.map(b=>'<option value="'+b._id+'" '+((cls&&cls.branchId&&String(cls.branchId._id||cls.branchId)===String(b._id))||(!cls&&branches.length===1)?'selected':'')+'>'+b.name+'</option>').join('')+'</select></div>' +
        '<div class="form-hint">All active students in this branch are automatically added to the attendance roster.</div>' +
      '<div class="form-group"><label class="form-label">Date & Time</label>' +
        '<input class="form-control" id="f-date" type="datetime-local" value="'+dtVal+'"/></div>' +
      '<div class="form-group"><label class="form-label">Google Meet Link</label>' +
        '<input class="form-control" id="f-meet" value="'+(cls&&cls.meetLink||'')+'" placeholder="https://meet.google.com/xxx-xxxx-xxx"/>' +
        '<div class="form-hint">Create a Meet link at meet.google.com, then paste it here.</div></div>' +
      '<div class="form-group"><label class="form-label">Notes (optional)</label>' +
        '<textarea class="form-control" id="f-notes" rows="2" placeholder="Any notes for students...">'+(cls&&cls.notes||'')+'</textarea></div>',
      '<button class="btn btn-secondary modal-cancel">Cancel</button><button class="btn btn-primary" id="save-class">Save Class</button>'
    );
    ov.querySelector('.modal-cancel').onclick = () => ov.remove();
    ov.querySelector('#save-class').onclick = async () => {
      const title = ov.querySelector('#f-title').value.trim();
      const scheduledAt = ov.querySelector('#f-date').value;
      if (!title || !scheduledAt) { toast.error('Title and scheduled time are required'); return; }
      const selectedBranch = ov.querySelector('#f-branch').value;
      if (!selectedBranch && branches.length > 1) { toast.error('Please select a branch'); return; }
      const body = { title, type: ov.querySelector('#f-type').value, branchId: selectedBranch || undefined, durationMins: +ov.querySelector('#f-dur').value, scheduledAt, meetLink: ov.querySelector('#f-meet').value.trim(), notes: ov.querySelector('#f-notes').value.trim() };
      try {
        cls ? await api.put('/classes/'+cls._id, body) : await api.post('/classes', body);
        ov.remove(); toast.success('Class saved!'); render();
      } catch(e) { toast.error(e.message); }
    };
  }
  render();
});
