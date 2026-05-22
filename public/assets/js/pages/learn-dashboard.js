/* eslint-disable */
router.register('learn-dashboard', async function(el) {
  const escapeHtml = (s='') => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  try {
    const [r, pendingFees] = await Promise.all([
      api.get('/learn/overview'),
      api.get('/payments?status=pending&limit=50').catch(() => ({ data: [] })),
    ]);
    const d = r.data || {};
    const user = store.get('user') || { name: 'Student' };
    const feeRows = pendingFees.data || [];
    const pendingAmount = feeRows.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const fmtRs = n => 'INR ' + Number(n || 0).toLocaleString('en-IN');

    const card = (title, icon, total, completed, percent, page, sub='') =>
      '<div class="card learn-card" data-page="'+page+'" style="padding:20px;cursor:pointer">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">'+
          '<div style="font-size:32px">'+icon+'</div>'+
          '<div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;font-weight:600">'+percent+'%</div>'+
        '</div>'+
        '<div style="font-size:18px;font-weight:600;margin-bottom:2px">'+title+'</div>'+
        '<div style="font-size:13px;color:var(--text-2);margin-bottom:14px">'+completed+' of '+total+' completed'+(sub?' · '+sub:'')+'</div>'+
        '<div style="height:6px;background:var(--cream-2);border-radius:3px;overflow:hidden">'+
          '<div style="height:100%;width:'+percent+'%;background:linear-gradient(90deg,var(--gold-dk),var(--gold));border-radius:3px;transition:width .4s"></div>'+
        '</div>'+
      '</div>';

    el.innerHTML =
      '<div class="page-header"><div class="page-header-text">'+
        '<h2>Hello '+escapeHtml(user.name.split(' ')[0])+' 👋</h2>'+
        '<p>Continue your dance journey. Pick a topic to learn or practice.</p>'+
      '</div></div>'+

      '<div class="card" style="padding:20px;margin-bottom:18px;border-left:4px solid '+(pendingAmount ? 'var(--warning)' : 'var(--success)')+'">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap">'+
          '<div>'+
            '<div style="font-size:12px;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;font-weight:700">Pending Fee</div>'+
            '<div style="font-size:28px;font-weight:700;color:'+(pendingAmount ? 'var(--warning)' : 'var(--success)')+';margin-top:2px">'+fmtRs(pendingAmount)+'</div>'+
            '<div style="font-size:13px;color:var(--text-2);margin-top:4px">'+(feeRows.length ? feeRows.length+' pending fee record'+(feeRows.length>1?'s':'')+' with the academy' : 'No pending fees')+'</div>'+
          '</div>'+
          '<span class="badge '+(pendingAmount ? 'badge-warning' : 'badge-success')+'">'+(pendingAmount ? 'Due' : 'Clear')+'</span>'+
        '</div>'+
      '</div>'+

      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:24px">'+
        card('Mudras',  '🤲', d.mudras.total,  d.mudras.completed,  d.mudras.percent,  'learn-mudras')+
        card('Theory',  '📚', d.theory.total,  d.theory.completed,  d.theory.percent,  'learn-theory')+
        card('Videos',  '🎬', d.videos.total,  d.videos.completed,  d.videos.percent,  'learn-videos')+
        card('Quizzes', '📝', d.quizzes.total, d.quizzes.completed, d.quizzes.percent, 'learn-quizzes', d.quizzes.avgScore != null ? 'avg '+d.quizzes.avgScore+'%' : '')+
      '</div>'+

      '<div class="card" style="padding:22px">'+
        '<h3 style="font-size:15px;margin-bottom:14px">Recent activity</h3>'+
        (d.recent && d.recent.length ?
          '<div style="display:flex;flex-direction:column;gap:10px">'+
            d.recent.map(p => {
              const label = { mudra:'Mudra', theory:'Theory', video:'Video', quiz:'Quiz' }[p.itemType] || p.itemType;
              const icon  = { mudra:'🤲', theory:'📚', video:'🎬', quiz:'📝' }[p.itemType] || '•';
              const status = p.status === 'completed' ? '<span class="badge" style="background:var(--success-lt);color:var(--success)">Completed</span>'
                          : p.status === 'practiced'  ? '<span class="badge" style="background:var(--warning-lt);color:var(--warning)">Practiced</span>'
                          : '<span class="badge badge-gray">Viewed</span>';
              return '<div style="display:flex;align-items:center;gap:12px;padding:10px;border:1px solid var(--border);border-radius:8px">'+
                '<div style="font-size:22px">'+icon+'</div>'+
                '<div style="flex:1">'+
                  '<div style="font-size:13px;font-weight:500">'+label + (p.score!=null?' · '+p.score+'%':'') +'</div>'+
                  '<div style="font-size:11.5px;color:var(--text-3)">'+ new Date(p.lastAt).toLocaleString() +'</div>'+
                '</div>'+
                status +
              '</div>';
            }).join('')+
          '</div>'
          : '<p style="color:var(--text-3);font-size:13px">Nothing yet — start with a mudra or video!</p>')+
      '</div>';

    el.querySelectorAll('.learn-card').forEach(c => {
      c.onclick = () => router.go(c.dataset.page);
      c.onmouseenter = () => { c.style.transform = 'translateY(-2px)'; c.style.boxShadow = 'var(--shadow-lg)'; };
      c.onmouseleave = () => { c.style.transform = ''; c.style.boxShadow = ''; };
      c.style.transition = 'all .2s';
    });
  } catch (e) {
    el.innerHTML = '<div class="card" style="border-color:var(--danger)"><p style="color:var(--danger)">'+e.message+'</p></div>';
  }
});
