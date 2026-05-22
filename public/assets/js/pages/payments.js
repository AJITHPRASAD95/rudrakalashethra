router.register('payments', async function(el) {
  let page=1, status='';

  const statusBadge = s => {
    const m = { paid:'badge-success', pending:'badge-warning', failed:'badge-danger', refunded:'badge-gray' };
    return '<span class="badge '+(m[s]||'badge-gray')+'">'+s+'</span>';
  };
  const fmtRs = n => '₹'+Number(n||0).toLocaleString('en-IN');

  const render = async () => {
    try {
      let url = '/payments?page='+page+'&limit=12';
      if (status) url += '&status='+status;
      const r = await api.get(url);
      const rows = r.data || []; const pg = r.pagination || {total:0,page:1,pages:1};

      // Summary cards
      const dues = await api.get('/payments/dues').catch(()=>({data:[]}));
      const dueTotal = (dues.data||[]).reduce((s,p)=>s+(p.amount||0),0);

      el.innerHTML =
        '<div class="page-header"><div class="page-header-text"><h2>Payments</h2><p>Track fees and payment history.</p></div>' +
        '<div class="page-header-actions"><button class="btn btn-primary" id="add-payment">' +
          '<svg viewBox="0 0 20 20" fill="none" width="15" height="15"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Record Payment</button></div></div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-bottom:22px">' +
          '<div class="stat-card" style="padding:18px"><div class="stat-label">Total Records</div><div class="stat-value" style="font-size:22px">'+pg.total+'</div></div>' +
          '<div class="stat-card" style="padding:18px"><div class="stat-label">Outstanding Dues</div><div class="stat-value" style="font-size:22px;color:var(--warning)">'+fmtRs(dueTotal)+'</div></div>' +
        '</div>' +
        '<div class="toolbar">' +
          '<select class="form-control" id="status-filter" style="width:165px">' +
            '<option value="">All Statuses</option>' +
            ['paid','pending','failed','refunded'].map(s=>'<option value="'+s+'" '+(status===s?'selected':'')+'>'+s.charAt(0).toUpperCase()+s.slice(1)+'</option>').join('') +
          '</select>' +
        '</div>' +
        (rows.length === 0 ?
          '<div class="empty-state"><div class="empty-icon">💰</div><h3>No payments found</h3><p>Record a payment to get started.</p></div>' :
          renderTable([
            { key:'studentId', label:'Student', render:(v) =>
              v&&v.name ?
                '<div class="user-cell"><div class="avatar avatar-sm">'+v.name[0]+'</div><div class="user-cell-info"><div class="user-cell-name">'+v.name+'</div><div class="user-cell-email">'+v.email+'</div></div></div>' :
                '<span class="text-muted">Unknown</span>'
            },
            { key:'amount', label:'Amount', render: v =>
              '<span class="font-mono" style="font-weight:600;font-size:14px">'+fmtRs(v)+'</span>'
            },
            { key:'description', label:'Description' },
            { key:'month', label:'Month', render: v => v ? '<span class="badge badge-gold">'+v+'</span>' : '<span class="text-muted">—</span>' },
            { key:'status', label:'Status', render: v => statusBadge(v) },
            { key:'paidAt', label:'Paid At', render: v => v ? '<span class="font-mono" style="font-size:12px;color:var(--text-3)">'+new Date(v).toLocaleDateString('en-IN')+'</span>' : '<span class="text-muted">—</span>' },
            { key:'dueDate', label:'Due Date', render: v => v ? '<span class="font-mono" style="font-size:12px;color:var(--warning)">'+new Date(v).toLocaleDateString('en-IN')+'</span>' : '<span class="text-muted">—</span>' },
          ], rows, [
            { key:'mark-paid', label:'Mark Paid', cls:'btn-primary btn-sm' },
          ]) +
          '<div class="pagination">' +
            '<span>'+pg.total+' total &bull; Page '+pg.page+' of '+pg.pages+'</span>' +
            '<div class="pagination-btns">' +
              '<button class="pagination-btn" id="prev-pg" '+(page<=1?'disabled':'')+'>← Prev</button>' +
              '<button class="pagination-btn" id="next-pg" '+(page>=pg.pages?'disabled':'')+'>Next →</button>' +
            '</div>' +
          '</div></div>'
        );

      el.querySelector('#status-filter').onchange = e => { status=e.target.value; page=1; render(); };
      el.querySelector('#add-payment').onclick = () => showPaymentForm();
      el.querySelectorAll('[data-action="mark-paid"]').forEach(btn => {
        const payment = rows.find(r => r._id === btn.dataset.id);
        if (!payment || payment.status === 'paid') {
          btn.disabled = true;
          btn.textContent = payment && payment.status === 'paid' ? 'Paid' : 'Mark Paid';
          return;
        }
        btn.onclick = () => modal.confirm('Mark this pending fee as paid?', async () => {
          try {
            await api.put('/payments/'+payment._id+'/mark-paid', {});
            toast.success('Payment marked paid');
            render();
          } catch(e) { toast.error(e.message); }
        }, false);
      });
      if(el.querySelector('#prev-pg')) el.querySelector('#prev-pg').onclick = ()=>{ if(page>1){page--;render();} };
      if(el.querySelector('#next-pg')) el.querySelector('#next-pg').onclick = ()=>{ if(page<pg.pages){page++;render();} };
    } catch(e) { el.innerHTML = '<div class="card" style="border-color:var(--danger)"><p style="color:var(--danger)">'+e.message+'</p></div>'; }
  };

  function showPaymentForm() {
    const today = new Date().toISOString().slice(0,7);
    const ov = modal.show('Record Manual Payment',
      '<div class="form-group"><label class="form-label">Student Email</label>' +
        '<input class="form-control" id="f-email" type="email" placeholder="student@nritya.com"/>' +
        '<div class="form-hint">We\'ll look up the student by email.</div></div>' +
      '<div class="form-row">' +
        '<div class="form-group"><label class="form-label">Amount (₹)</label><input class="form-control" id="f-amt" type="number" placeholder="2500" min="1"/></div>' +
        '<div class="form-group"><label class="form-label">Month</label><input class="form-control" id="f-month" type="month" value="'+today+'"/></div>' +
      '</div>' +
      '<div class="form-group"><label class="form-label">Description</label><input class="form-control" id="f-desc" placeholder="Monthly tuition fees"/></div>',
      '<button class="btn btn-secondary modal-cancel">Cancel</button><button class="btn btn-primary" id="save-payment">Record Payment</button>'
    );
    ov.querySelector('.modal-cancel').onclick = () => ov.remove();
    ov.querySelector('#save-payment').onclick = async () => {
      const email = ov.querySelector('#f-email').value.trim();
      const amount = +ov.querySelector('#f-amt').value;
      if (!email || !amount) { toast.error('Email and amount are required'); return; }
      try {
        const users = await api.get('/users?role=student&search='+encodeURIComponent(email));
        const student = (users.data||[]).find(u=>u.email===email);
        if (!student) { toast.error('Student not found with that email'); return; }
        await api.post('/payments/manual', { studentId: student._id, amount, month: ov.querySelector('#f-month').value, description: ov.querySelector('#f-desc').value.trim() });
        ov.remove(); toast.success('Payment recorded!'); render();
      } catch(e) { toast.error(e.message); }
    };
  }
  render();
});
