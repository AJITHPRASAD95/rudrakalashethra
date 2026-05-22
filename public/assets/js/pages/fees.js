router.register('fees', async function(el) {
  const COLORS = ['#c9a96e','#4ecdc4','#6ea8fe','#a78bfa','#2d9e6e','#e07070','#c97b20','#7c5cfc'];
  let branches = [];
  let branchId = '';

  try {
    branches = (await api.get('/branches')).data || [];
  } catch(_) {
    branches = [];
  }

  const render = async () => {
    try {
      const r = await api.get('/fees' + (branchId ? '?branchId='+encodeURIComponent(branchId) : ''));
      const fees = r.data || [];

      el.innerHTML =
        '<div class="page-header"><div class="page-header-text">' +
          '<h2>Fee Structures</h2>' +
          '<p>Configure class packages and pricing. These appear when recording payments.</p>' +
        '</div>' +
        '<div class="page-header-actions">' +
          '<button class="btn btn-primary" id="add-fee">' +
            '<svg viewBox="0 0 20 20" fill="none" width="15" height="15"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Add Package</button>' +
        '</div></div>' +
        '<div class="toolbar">' +
          '<select class="form-control" id="branch-filter" style="max-width:240px"><option value="">All / default branch</option>' +
            branches.map(b => '<option value="'+b._id+'" '+(branchId===String(b._id)?'selected':'')+'>'+b.name+'</option>').join('') +
          '</select>' +
          '<span class="text-muted" style="font-size:13px">Attendance billing uses the active package for the student branch.</span>' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-bottom:32px">' +
        fees.filter(f=>f.isActive).map((f,i) => {
          const col = f.color || COLORS[i % COLORS.length];
          const br = branches.find(b => String(b._id) === String(f.branchId));
          return '<div class="card" style="padding:0;overflow:hidden;border-top:4px solid '+col+'">' +
            '<div style="padding:20px 20px 16px">' +
              '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px">' +
                '<div style="width:44px;height:44px;border-radius:12px;background:'+col+'22;display:flex;align-items:center;justify-content:center;font-size:20px">🎓</div>' +
                '<div class="action-cell">' +
                  '<button class="btn-icon btn-edit-fee" data-id="'+f._id+'" title="Edit">'+
                    '<svg viewBox="0 0 20 20" fill="none" width="13" height="13"><path d="M3 17h3l9-9-3-3-9 9v3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>' +
                  '<button class="btn-icon btn-del-fee" data-id="'+f._id+'" title="Delete" style="color:var(--danger)">'+
                    '<svg viewBox="0 0 20 20" fill="none" width="13" height="13"><path d="M3 5h14m-8 3v6m4-6v6M5 5l1 12h8l1-12M8 5V3h4v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>' +
                '</div>' +
              '</div>' +
              '<div style="font-family:\'Playfair Display\',serif;font-size:18px;font-weight:600;margin-bottom:6px">'+f.name+'</div>' +
              '<div style="font-size:12px;color:var(--text-3);margin-bottom:8px">'+(br ? br.name : 'Default branch package')+'</div>' +
              (f.description?'<div style="font-size:12.5px;color:var(--text-3);margin-bottom:14px">'+f.description+'</div>':'') +
              '<div style="display:flex;align-items:baseline;gap:4px;margin-bottom:10px">' +
                '<span style="font-size:28px;font-weight:700;color:'+col+'">₹'+Number(f.amount).toLocaleString('en-IN')+'</span>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:6px;padding:8px 12px;background:'+col+'15;border-radius:8px">' +
                '<span style="font-size:18px">📅</span>' +
                '<span style="font-size:13px;font-weight:600;color:var(--text-2)">'+f.classCount+' Classes</span>' +
                '<span style="font-size:12px;color:var(--text-3);margin-left:auto">₹'+Math.round(f.amount/f.classCount)+'/class</span>' +
              '</div>' +
            '</div>' +
            '<div style="padding:12px 20px;border-top:1px solid var(--border);background:var(--cream)">' +
              '<button class="btn btn-primary btn-sm btn-apply-fee" data-id="'+f._id+'" data-name="'+f.name+'" data-amount="'+f.amount+'" data-classes="'+f.classCount+'" style="width:100%;justify-content:center">Apply to Student</button>' +
            '</div>' +
          '</div>';
        }).join('') +
        (fees.filter(f=>f.isActive).length===0?'<div class="card" style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-3)"><div style="font-size:40px;margin-bottom:12px">💰</div><div style="font-size:16px;font-weight:600">No fee packages yet</div><p style="margin-top:6px">Add your first package above.</p></div>':'') +
        '</div>';

      el.querySelector('#add-fee').onclick = () => showFeeForm();
      el.querySelector('#branch-filter').onchange = e => { branchId = e.target.value; render(); };
      el.querySelectorAll('.btn-edit-fee').forEach(btn => {
        const fee = fees.find(f=>f._id===btn.dataset.id);
        btn.onclick = () => showFeeForm(fee);
      });
      el.querySelectorAll('.btn-del-fee').forEach(btn => {
        const fee = fees.find(f=>f._id===btn.dataset.id);
        btn.onclick = () => modal.confirm('Delete "'+fee.name+'" package?', async () => {
          await api.del('/fees/'+fee._id);
          toast.success('Package deleted'); render();
        });
      });
      el.querySelectorAll('.btn-apply-fee').forEach(btn => {
        btn.onclick = () => showApplyForm(btn.dataset.id, btn.dataset.name, btn.dataset.amount, btn.dataset.classes);
      });

    } catch(e) { el.innerHTML = '<div class="card" style="border-color:var(--danger)"><p style="color:var(--danger)">'+e.message+'</p></div>'; }
  };

  function showFeeForm(fee=null) {
    const colorOptions = COLORS.map((c,i) =>
      '<button type="button" class="color-dot" data-color="'+c+'" style="width:26px;height:26px;border-radius:50%;background:'+c+';border:3px solid '+(fee&&fee.color===c?'var(--text)':'transparent')+';cursor:pointer" onclick="this.parentElement.querySelectorAll(\'.color-dot\').forEach(b=>b.style.borderColor=\'transparent\');this.style.borderColor=\'var(--text)\';document.getElementById(\'f-color\').value=\''+c+'\'"></button>'
    ).join('');

    const ov = modal.show(fee ? 'Edit Package' : 'New Fee Package',
      '<div class="form-group"><label class="form-label">Package Name</label>' +
        '<input class="form-control" id="f-name" value="'+(fee&&fee.name||'')+'" placeholder="e.g. Basic Pack — 4 Classes"/></div>' +
      '<div class="form-group"><label class="form-label">Branch</label>' +
        '<select class="form-control" id="f-branch"><option value="">Default / current branch</option>'+branches.map(b => '<option value="'+b._id+'" '+(fee&&String(fee.branchId)===String(b._id)?'selected':'')+'>'+b.name+'</option>').join('')+'</select>' +
        '<div class="form-hint">Create one active 4-class package per branch for automatic attendance billing.</div></div>' +
      '<div class="form-row">' +
        '<div class="form-group"><label class="form-label">Number of Classes</label>' +
          '<input class="form-control" id="f-classes" type="number" min="1" value="'+(fee&&fee.classCount||4)+'" placeholder="4"/></div>' +
        '<div class="form-group"><label class="form-label">Fee Amount (₹)</label>' +
          '<input class="form-control" id="f-amount" type="number" min="1" value="'+(fee&&fee.amount||400)+'" placeholder="400"/></div>' +
      '</div>' +
      '<div class="form-group"><label class="form-label">Description (optional)</label>' +
        '<input class="form-control" id="f-desc" value="'+(fee&&fee.description||'')+'" placeholder="e.g. Ideal for beginners"/></div>' +
      '<div class="form-group"><label class="form-label">Accent Color</label>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">'+colorOptions+'</div>' +
        '<input type="hidden" id="f-color" value="'+(fee&&fee.color||COLORS[0])+'"/></div>',
      '<button class="btn btn-secondary modal-cancel">Cancel</button><button class="btn btn-primary" id="save-fee">Save Package</button>'
    );
    ov.querySelector('.modal-cancel').onclick = () => ov.remove();
    ov.querySelector('#save-fee').onclick = async () => {
      const body = {
        name:       ov.querySelector('#f-name').value.trim(),
        classCount: +ov.querySelector('#f-classes').value,
        amount:     +ov.querySelector('#f-amount').value,
        description:ov.querySelector('#f-desc').value.trim(),
        color:      ov.querySelector('#f-color').value,
        branchId:   ov.querySelector('#f-branch').value || undefined,
      };
      if (!body.name || !body.classCount || !body.amount) { toast.error('Name, classes and amount required'); return; }
      try {
        fee ? await api.put('/fees/'+fee._id, body) : await api.post('/fees', body);
        ov.remove(); toast.success('Package saved!'); render();
      } catch(e) { toast.error(e.message); }
    };
  }

  function showApplyForm(feeId, feeName, amount, classCount) {
    const today = new Date().toISOString().slice(0,7);
    const due = new Date(); due.setDate(due.getDate()+7);
    const ov = modal.show('Apply "'+feeName+'" to Student',
      '<div style="background:var(--cream-2);border-radius:10px;padding:14px;margin-bottom:18px;display:flex;justify-content:space-between">' +
        '<div><div style="font-weight:600">'+feeName+'</div><div style="font-size:12px;color:var(--text-3)">'+classCount+' classes</div></div>' +
        '<div style="font-size:22px;font-weight:700;color:var(--gold-dk)">₹'+Number(amount).toLocaleString('en-IN')+'</div>' +
      '</div>' +
      '<div class="form-group"><label class="form-label">Student Email</label>' +
        '<input class="form-control" id="f-email" type="email" placeholder="student@nritya.com"/></div>' +
      '<div class="form-row">' +
        '<div class="form-group"><label class="form-label">Month</label>' +
          '<input class="form-control" id="f-month" type="month" value="'+today+'"/></div>' +
        '<div class="form-group"><label class="form-label">Due Date</label>' +
          '<input class="form-control" id="f-due" type="date" value="'+due.toISOString().slice(0,10)+'"/></div>' +
      '</div>',
      '<button class="btn btn-secondary modal-cancel">Cancel</button><button class="btn btn-primary" id="apply-fee">Create Payment Record</button>'
    );
    ov.querySelector('.modal-cancel').onclick = () => ov.remove();
    ov.querySelector('#apply-fee').onclick = async () => {
      const email = ov.querySelector('#f-email').value.trim();
      if (!email) { toast.error('Student email required'); return; }
      try {
        const users = await api.get('/users?role=student&search='+encodeURIComponent(email));
        const student = (users.data||[]).find(u=>u.email===email);
        if (!student) { toast.error('Student not found with that email'); return; }
        await api.post('/fees/'+feeId+'/apply', {
          studentId: student._id,
          month:     ov.querySelector('#f-month').value,
          dueDate:   ov.querySelector('#f-due').value,
        });
        ov.remove();
        toast.success('Payment record created for '+student.name+'!');
      } catch(e) { toast.error(e.message); }
    };
  }

  render();
});
