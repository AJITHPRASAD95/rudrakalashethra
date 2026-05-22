/* eslint-disable */
router.register('learn-mudras', async function(el) {
  let activeCategory = 'all', search = '', page = 1;
  const CATS = ['Asamyukta','Samyukta','Other'];
  const escapeHtml = (s='') => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function videoEmbedHtml(m) {
    if (!m.videoUrl) return '';
    if (m.videoSource === 'youtube') {
      const id = (m.videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]+)/)||[])[1];
      return id ? '<iframe style="width:100%;aspect-ratio:16/9;border:0;border-radius:8px;margin-bottom:12px" src="https://www.youtube.com/embed/'+id+'" allowfullscreen></iframe>' : '';
    }
    if (m.videoSource === 'vimeo') {
      const id = (m.videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/)||[])[1];
      return id ? '<iframe style="width:100%;aspect-ratio:16/9;border:0;border-radius:8px;margin-bottom:12px" src="https://player.vimeo.com/video/'+id+'" allowfullscreen></iframe>' : '';
    }
    return '<video controls style="width:100%;border-radius:8px;background:#000;margin-bottom:12px" src="'+m.videoUrl+'"></video>';
  }

  async function render() {
    try {
      let url = '/mudras?page='+page+'&limit=24';
      if (activeCategory !== 'all') url += '&category='+encodeURIComponent(activeCategory);
      if (search) url += '&search='+encodeURIComponent(search);
      const [r, pr] = await Promise.all([
        api.get(url),
        api.get('/learn/progress?itemType=mudra').catch(() => ({ data: { map: {} } })),
      ]);
      const items = r.data || [];
      const pg = r.pagination || { total:0, page:1, pages:1 };
      const progress = pr.data.map || {};

      el.innerHTML =
        '<div class="page-header"><div class="page-header-text">'+
          '<h2>Mudras</h2><p>Learn each gesture — tap a card for meaning, technique and demo video.</p></div>'+
        '</div>'+

        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">'+
          '<button class="cat-pill '+(activeCategory==='all'?'active':'')+'" data-cat="all">All ('+pg.total+')</button>'+
          CATS.map(c => '<button class="cat-pill '+(activeCategory===c?'active':'')+'" data-cat="'+c+'">'+c+'</button>').join('')+
        '</div>'+

        '<div class="toolbar"><div class="search-wrap"><span class="search-icon">🔍</span>'+
          '<input class="search-input" id="m-search" value="'+escapeHtml(search)+'" placeholder="Search by name, meaning..."/></div></div>'+

        (items.length === 0 ?
          '<div class="empty-state"><div class="empty-icon">🤲</div><h3>No mudras yet</h3><p>Your teacher will add some soon.</p></div>' :
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px">'+
            items.map(m => {
              const p = progress[m._id];
              const badge = p && p.status === 'completed'
                ? '<span class="badge" style="position:absolute;top:8px;left:8px;background:var(--success);color:#fff">✓ Practiced</span>'
                : p && p.status === 'viewed'
                ? '<span class="badge" style="position:absolute;top:8px;left:8px;background:var(--info-lt);color:var(--info)">Viewed</span>'
                : '';
              return '<div class="card mudra-card" data-id="'+m._id+'" style="padding:0;overflow:hidden;cursor:pointer">'+
                '<div style="height:160px;background:var(--cream-2);position:relative">'+
                  (m.image ? '<img src="'+m.image+'" style="width:100%;height:100%;object-fit:cover"/>' : '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:48px">🤲</div>')+
                  badge +
                  '<span class="badge" style="position:absolute;top:8px;right:8px;background:var(--gold);color:#fff">'+m.category+'</span>'+
                '</div>'+
                '<div style="padding:14px">'+
                  '<div style="font-weight:600;font-size:14.5px">'+escapeHtml(m.name)+'</div>'+
                  (m.sanskritName ? '<div style="font-size:12px;color:var(--text-3);font-style:italic;margin-bottom:4px">'+escapeHtml(m.sanskritName)+'</div>':'')+
                  '<div style="font-size:12.5px;color:var(--text-2);height:38px;overflow:hidden">'+escapeHtml(m.meaning||'')+'</div>'+
                '</div>'+
              '</div>';
            }).join('')+
          '</div>')+

        (pg.pages > 1 ? '<div class="pagination" style="margin-top:18px"><span>'+pg.total+' mudras</span>'+
          '<div class="pagination-btns"><button class="pagination-btn" id="prev" '+(page<=1?'disabled':'')+'>← Prev</button>'+
          '<span style="padding:0 8px;font-size:13px">'+page+' / '+pg.pages+'</span>'+
          '<button class="pagination-btn" id="next" '+(page>=pg.pages?'disabled':'')+'>Next →</button></div></div>' : '');

      if (!document.getElementById('pill-styles')) {
        const st = document.createElement('style'); st.id = 'pill-styles';
        st.textContent = `.cat-pill{padding:6px 14px;border-radius:20px;font-size:12.5px;font-weight:500;cursor:pointer;border:1.5px solid var(--border);background:var(--white);color:var(--text-2);transition:all .15s}.cat-pill:hover{border-color:var(--gold);color:var(--gold-dk)}.cat-pill.active{background:var(--gold);border-color:var(--gold);color:#fff}`;
        document.head.appendChild(st);
      }

      el.querySelectorAll('.cat-pill').forEach(b => b.onclick = () => { activeCategory = b.dataset.cat; page=1; render(); });
      el.querySelector('#m-search').oninput = e => { search = e.target.value; page=1; render(); };
      const prev = el.querySelector('#prev'); if (prev) prev.onclick = () => { if(page>1){page--; render();} };
      const next = el.querySelector('#next'); if (next) next.onclick = () => { if(page<pg.pages){page++; render();} };

      el.querySelectorAll('.mudra-card').forEach(c => c.onclick = () => {
        const m = items.find(x => x._id === c.dataset.id);
        showLearn(m);
      });
    } catch (e) {
      el.innerHTML = '<div class="card" style="border-color:var(--danger)"><p style="color:var(--danger)">'+e.message+'</p></div>';
    }
  }

  function showLearn(m) {
    // Mark as viewed
    api.post('/learn/track', { itemType:'mudra', itemId: m._id, status: 'viewed' }).catch(()=>{});

    const ov = modal.show(m.name + (m.sanskritName ? ' · '+m.sanskritName : ''),
      (m.image ? '<img src="'+m.image+'" style="width:100%;max-height:280px;object-fit:cover;border-radius:8px;margin-bottom:12px"/>' : '')+
      videoEmbedHtml(m)+
      (m.meaning     ? '<p style="margin:8px 0"><b>Meaning:</b> '+escapeHtml(m.meaning)+'</p>' : '')+
      (m.description ? '<p style="margin:10px 0;line-height:1.7;white-space:pre-wrap">'+escapeHtml(m.description)+'</p>' : '')+
      (m.usage       ? '<p style="margin:10px 0;padding:10px 12px;background:var(--cream);border-radius:8px"><b>Usage:</b> '+escapeHtml(m.usage)+'</p>' : ''),
      '<button class="btn btn-secondary modal-cancel">Close</button>'+
      '<button class="btn btn-primary" id="practiced">✓ Mark as practiced</button>'
    );
    ov.querySelector('.modal-cancel').onclick = () => ov.remove();
    ov.querySelector('#practiced').onclick = async () => {
      try {
        await api.post('/learn/track', { itemType:'mudra', itemId: m._id, status: 'completed' });
        toast.success('Marked as practiced'); ov.remove();
        render();
      } catch (e) { toast.error(e.message); }
    };
  }

  render();
});
