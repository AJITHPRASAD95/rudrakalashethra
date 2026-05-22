/* eslint-disable */
router.register('learn-theory', async function(el) {
  let search = '', activeCategory = 'all', page = 1;
  const escapeHtml = (s='') => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function render() {
    try {
      let url = '/theory?page='+page+'&limit=20';
      if (search) url += '&search='+encodeURIComponent(search);
      if (activeCategory !== 'all') url += '&category='+encodeURIComponent(activeCategory);
      const [r, pr] = await Promise.all([
        api.get(url),
        api.get('/learn/progress?itemType=theory').catch(() => ({ data: { map: {} } })),
      ]);
      const items = r.data || [];
      const pg = r.pagination || { total:0,page:1,pages:1 };
      const prog = pr.data.map || {};
      const cats = [...new Set(items.map(a => a.category).filter(Boolean))];

      el.innerHTML =
        '<div class="page-header"><div class="page-header-text">'+
          '<h2>Theory</h2><p>Read articles to understand the foundations of dance.</p></div></div>'+

        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">'+
          '<button class="cat-pill '+(activeCategory==='all'?'active':'')+'" data-cat="all">All ('+pg.total+')</button>'+
          cats.map(c => '<button class="cat-pill '+(activeCategory===c?'active':'')+'" data-cat="'+c+'">'+c+'</button>').join('')+
        '</div>'+

        '<div class="toolbar"><div class="search-wrap"><span class="search-icon">🔍</span>'+
          '<input class="search-input" id="t-search" value="'+escapeHtml(search)+'" placeholder="Search articles..."/></div></div>'+

        (items.length === 0 ?
          '<div class="empty-state"><div class="empty-icon">📚</div><h3>No articles yet</h3></div>' :
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">'+
            items.map(a => {
              const p = prog[a._id];
              const done = p && p.status === 'completed';
              return '<div class="card art-card" data-id="'+a._id+'" style="padding:0;overflow:hidden;cursor:pointer">'+
                (a.coverImage ? '<img src="'+a.coverImage+'" style="width:100%;height:140px;object-fit:cover"/>' : '<div style="height:80px;background:linear-gradient(135deg,var(--cream-2),var(--cream-3))"></div>')+
                '<div style="padding:16px">'+
                  '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'+
                    '<div style="font-size:11px;color:var(--gold-dk);font-weight:600;letter-spacing:.5px;text-transform:uppercase">'+escapeHtml(a.category||'General')+(a.readMinutes?' · '+a.readMinutes+' min':'')+'</div>'+
                    (done ? '<span style="color:var(--success);font-size:14px">✓</span>' : '')+
                  '</div>'+
                  '<div style="font-weight:600;font-size:16px;line-height:1.3;margin-bottom:4px">'+escapeHtml(a.title)+'</div>'+
                  (a.subtitle ? '<div style="font-size:13px;color:var(--text-2)">'+escapeHtml(a.subtitle)+'</div>' : '')+
                '</div>'+
              '</div>';
            }).join('')+
          '</div>')+

        (pg.pages > 1 ? '<div class="pagination" style="margin-top:18px"><span>'+pg.total+' articles</span>'+
          '<div class="pagination-btns"><button class="pagination-btn" id="prev" '+(page<=1?'disabled':'')+'>← Prev</button>'+
          '<span style="padding:0 8px;font-size:13px">'+page+' / '+pg.pages+'</span>'+
          '<button class="pagination-btn" id="next" '+(page>=pg.pages?'disabled':'')+'>Next →</button></div></div>' : '');

      if (!document.getElementById('pill-styles')) {
        const st = document.createElement('style'); st.id = 'pill-styles';
        st.textContent = `.cat-pill{padding:6px 14px;border-radius:20px;font-size:12.5px;font-weight:500;cursor:pointer;border:1.5px solid var(--border);background:var(--white);color:var(--text-2);transition:all .15s}.cat-pill:hover{border-color:var(--gold);color:var(--gold-dk)}.cat-pill.active{background:var(--gold);border-color:var(--gold);color:#fff}`;
        document.head.appendChild(st);
      }

      el.querySelectorAll('.cat-pill').forEach(b => b.onclick = () => { activeCategory = b.dataset.cat; page=1; render(); });
      el.querySelector('#t-search').oninput = e => { search = e.target.value; page=1; render(); };
      const prev = el.querySelector('#prev'); if (prev) prev.onclick = () => { if(page>1){page--; render();} };
      const next = el.querySelector('#next'); if (next) next.onclick = () => { if(page<pg.pages){page++; render();} };

      el.querySelectorAll('.art-card').forEach(c => c.onclick = async () => {
        const r2 = await api.get('/theory/'+c.dataset.id);
        showRead(r2.data);
      });
    } catch (e) {
      el.innerHTML = '<div class="card" style="border-color:var(--danger)"><p style="color:var(--danger)">'+e.message+'</p></div>';
    }
  }

  function showRead(a) {
    api.post('/learn/track', { itemType:'theory', itemId: a._id, status: 'viewed' }).catch(()=>{});
    const ov = modal.show(a.title,
      (a.coverImage ? '<img src="'+a.coverImage+'" style="width:100%;max-height:260px;object-fit:cover;border-radius:8px;margin-bottom:14px"/>' : '')+
      (a.subtitle ? '<p style="color:var(--text-2);font-size:15px;margin-bottom:14px">'+escapeHtml(a.subtitle)+'</p>' : '')+
      '<div class="theory-body" style="line-height:1.75;font-size:14.5px">'+ a.body +'</div>',
      '<button class="btn btn-secondary modal-cancel">Close</button>'+
      '<button class="btn btn-primary" id="done">✓ Mark as read</button>'
    );
    ov.querySelector('.modal-cancel').onclick = () => ov.remove();
    ov.querySelector('#done').onclick = async () => {
      await api.post('/learn/track', { itemType:'theory', itemId: a._id, status: 'completed' });
      toast.success('Marked as read'); ov.remove(); render();
    };
  }

  render();
});
