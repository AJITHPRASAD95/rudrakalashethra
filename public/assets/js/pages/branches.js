router.register('branches', async function(el) {
  const render = async () => {
    try {
      const r = await api.get('/branches');
      const rows = r.data || [];
      el.innerHTML =
        '<div class="page-header"><div class="page-header-text"><h2>Branches</h2><p>Manage your school locations.</p></div>' +
        '<div class="page-header-actions"><button class="btn btn-primary" id="add-branch">' +
          '<svg viewBox="0 0 20 20" fill="none" width="15" height="15"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Add Branch</button></div></div>' +
        (rows.length === 0 ?
          '<div class="empty-state"><div class="empty-icon">🏫</div><h3>No branches yet</h3><p>Add your first branch to get started.</p></div>' :
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">' +
            rows.map(b =>
              '<div class="card" style="padding:20px">' +
                '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px">' +
                  '<div style="display:flex;align-items:center;gap:10px">' +
                    '<div style="width:42px;height:42px;border-radius:12px;background:rgba(201,169,110,.12);display:flex;align-items:center;justify-content:center;font-size:18px">🏫</div>' +
                    '<div><div style="font-weight:600;font-size:15px;font-family:\'Playfair Display\',serif">'+b.name+'</div>' +
                    '<span class="badge '+(b.isActive?'badge-success':'badge-gray')+'">'+( b.isActive?'Active':'Inactive')+'</span></div>' +
                  '</div>' +
                  '<div class="action-cell">' +
                    '<button class="btn-icon btn-edit-branch" data-id="'+b._id+'"><svg viewBox="0 0 20 20" fill="none" width="13" height="13"><path d="M3 17h3l9-9-3-3-9 9v3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>' +
                    '<button class="btn-icon btn-del-branch" data-id="'+b._id+'" style="color:var(--danger)"><svg viewBox="0 0 20 20" fill="none" width="13" height="13"><path d="M3 5h14m-8 3v6m4-6v6M5 5l1 12h8l1-12M8 5V3h4v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>' +
                  '</div>' +
                '</div>' +
                (b.address ? '<div style="font-size:12.5px;color:var(--text-3);display:flex;align-items:center;gap:5px;margin-bottom:6px">📍 '+b.address+'</div>' : '') +
                (b.phone   ? '<div style="font-size:12.5px;color:var(--text-3);display:flex;align-items:center;gap:5px">📞 '+b.phone+'</div>'   : '') +
              '</div>'
            ).join('') +
          '</div>'
        );

      el.querySelector('#add-branch').onclick = () => showBranchForm(null, render);
      el.querySelectorAll('.btn-edit-branch').forEach(btn => {
        const row = rows.find(r => r._id === btn.dataset.id);
        btn.onclick = () => showBranchForm(row, render);
      });
      el.querySelectorAll('.btn-del-branch').forEach(btn => {
        const row = rows.find(r => r._id === btn.dataset.id);
        btn.onclick = () => modal.confirm('Deactivate branch "' + row.name + '"?', async () => {
          try { await api.del('/branches/'+row._id); toast.success('Branch deactivated'); render(); }
          catch(e) { toast.error(e.message); }
        });
      });
    } catch(e) { el.innerHTML = '<div class="card" style="border-color:var(--danger)"><p style="color:var(--danger)">'+e.message+'</p></div>'; }
  };

  function showBranchForm(b, refresh) {
    const ov = modal.show(b ? 'Edit Branch' : 'New Branch',
      '<div class="form-group"><label class="form-label">Branch Name</label>' +
        '<input class="form-control" id="f-name" value="'+(b&&b.name||'')+'" placeholder="e.g. Main Campus"/></div>' +
      '<div class="form-row">' +
        '<div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="f-phone" value="'+(b&&b.phone||'')+'" placeholder="+91 9999999999"/></div>' +
        '<div class="form-group"><label class="form-label">Timezone</label><select class="form-control" id="f-tz"><option value="Asia/Kolkata" '+((!b||b.timezone==='Asia/Kolkata')?'selected':'')+'>Asia/Kolkata</option><option value="Asia/Dubai">Asia/Dubai</option><option value="UTC">UTC</option></select></div>' +
      '</div>' +
      '<div class="form-group"><label class="form-label">Address</label><textarea class="form-control" id="f-addr" rows="2" placeholder="Full address">'+(b&&b.address||'')+'</textarea></div>',
      '<button class="btn btn-secondary modal-cancel">Cancel</button><button class="btn btn-primary" id="save-branch">Save Branch</button>'
    );
    ov.querySelector('.modal-cancel').onclick = () => ov.remove();
    ov.querySelector('#save-branch').onclick = async () => {
      const body = { name: ov.querySelector('#f-name').value.trim(), phone: ov.querySelector('#f-phone').value.trim(), address: ov.querySelector('#f-addr').value.trim(), timezone: ov.querySelector('#f-tz').value };
      if (!body.name) { toast.error('Branch name is required'); return; }
      try {
        b ? await api.put('/branches/'+b._id, body) : await api.post('/branches', body);
        ov.remove(); toast.success('Branch saved!'); refresh();
      } catch(e) { toast.error(e.message); }
    };
  }
  render();
});
