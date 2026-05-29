/* eslint-disable */
router.register('learn-videos', async function(el) {
  let activeCategory = 'all', search = '', page = 1;
  const escapeHtml = (s='') => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const escapeAttr = escapeHtml;

  function parseEmbed(url) {
    if (!url) return null;
    let m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|m\.youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    if (m) return { source:'youtube', embedId:m[1] };
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return { source:'vimeo', embedId:m[1] };
    return null;
  }

  function embedHtml(item) {
    const parsed = item.embedId ? { source:item.source, embedId:item.embedId } : parseEmbed(item.url);
    if (parsed && parsed.source === 'youtube' && parsed.embedId) {
      const origin = encodeURIComponent(window.location.origin);
      const src = 'https://www.youtube.com/embed/'+encodeURIComponent(parsed.embedId)+'?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin='+origin;
      return '<div class="video-frame-wrap" id="video-frame-wrap" style="width:100%;aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden">'+
        '<iframe title="'+escapeAttr(item.title || 'YouTube video')+'" style="width:100%;height:100%;border:0" src="'+src+'" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen webkitallowfullscreen mozallowfullscreen></iframe>'+
      '</div>';
    }
    if (parsed && parsed.source === 'vimeo' && parsed.embedId) {
      return '<div class="video-frame-wrap" id="video-frame-wrap" style="width:100%;aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden">'+
        '<iframe title="'+escapeAttr(item.title || 'Vimeo video')+'" style="width:100%;height:100%;border:0" src="https://player.vimeo.com/video/'+encodeURIComponent(parsed.embedId)+'" allow="autoplay; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen webkitallowfullscreen mozallowfullscreen></iframe>'+
      '</div>';
    }
    return '<video controls playsinline style="width:100%;border-radius:8px;background:#000" src="'+escapeAttr(item.url)+'"></video>';
  }

  async function render() {
    try {
      let url = '/content?type=video&page='+page+'&limit=20';
      if (activeCategory !== 'all') url += '&category='+encodeURIComponent(activeCategory);
      if (search) url += '&search='+encodeURIComponent(search);
      const [r, catR, pr] = await Promise.all([
        api.get(url),
        api.get('/content/categories').catch(() => ({ data: [] })),
        api.get('/learn/progress?itemType=video').catch(() => ({ data: { map: {} } })),
      ]);
      const items = r.data || [];
      const pg    = r.pagination || { total:0,page:1,pages:1 };
      const cats  = catR.data || [];
      const prog  = pr.data.map || {};

      el.innerHTML =
        '<div class="page-header"><div class="page-header-text">'+
          '<h2>Video Lessons</h2><p>Watch demonstrations and along-with practice videos.</p></div></div>'+

        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">'+
          '<button class="cat-pill '+(activeCategory==='all'?'active':'')+'" data-cat="all">All ('+pg.total+')</button>'+
          cats.filter(c => c.count > 0).map(c => '<button class="cat-pill '+(activeCategory===c.name?'active':'')+'" data-cat="'+c.name+'">'+c.name+'</button>').join('')+
        '</div>'+

        '<div class="toolbar"><div class="search-wrap"><span class="search-icon">🔍</span>'+
          '<input class="search-input" id="v-search" value="'+escapeHtml(search)+'" placeholder="Search videos..."/></div></div>'+

        (items.length === 0 ?
          '<div class="empty-state"><div class="empty-icon">🎬</div><h3>No videos yet</h3></div>' :
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px">'+
            items.map(v => {
              const p = prog[v._id];
              const done = p && p.status === 'completed';
              return '<div class="card vid-card" data-id="'+v._id+'" style="padding:0;overflow:hidden;cursor:pointer">'+
                '<div style="height:150px;background:#000;position:relative;overflow:hidden">'+
                  (v.thumbnail ? '<img src="'+v.thumbnail+'" style="width:100%;height:100%;object-fit:cover"/>' : '')+
                  '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);color:#fff;font-size:38px">▶</div>'+
                  (done ? '<span class="badge" style="position:absolute;top:8px;left:8px;background:var(--success);color:#fff">✓ Watched</span>' : '')+
                '</div>'+
                '<div style="padding:14px">'+
                  '<div style="font-weight:600;font-size:14px;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+escapeHtml(v.title)+'</div>'+
                  '<div style="font-size:11.5px;color:var(--text-3)">'+escapeHtml(v.category)+'</div>'+
                '</div>'+
              '</div>';
            }).join('')+
          '</div>')+

        (pg.pages > 1 ? '<div class="pagination" style="margin-top:18px"><span>'+pg.total+' videos</span>'+
          '<div class="pagination-btns"><button class="pagination-btn" id="prev" '+(page<=1?'disabled':'')+'>← Prev</button>'+
          '<span style="padding:0 8px;font-size:13px">'+page+' / '+pg.pages+'</span>'+
          '<button class="pagination-btn" id="next" '+(page>=pg.pages?'disabled':'')+'>Next →</button></div></div>' : '');

      if (!document.getElementById('pill-styles')) {
        const st = document.createElement('style'); st.id = 'pill-styles';
        st.textContent = `.cat-pill{padding:6px 14px;border-radius:20px;font-size:12.5px;font-weight:500;cursor:pointer;border:1.5px solid var(--border);background:var(--white);color:var(--text-2);transition:all .15s}.cat-pill:hover{border-color:var(--gold);color:var(--gold-dk)}.cat-pill.active{background:var(--gold);border-color:var(--gold);color:#fff}`;
        document.head.appendChild(st);
      }

      el.querySelectorAll('.cat-pill').forEach(b => b.onclick = () => { activeCategory = b.dataset.cat; page=1; render(); });
      el.querySelector('#v-search').oninput = e => { search = e.target.value; page=1; render(); };
      const prev = el.querySelector('#prev'); if (prev) prev.onclick = () => { if(page>1){page--; render();} };
      const next = el.querySelector('#next'); if (next) next.onclick = () => { if(page<pg.pages){page++; render();} };

      el.querySelectorAll('.vid-card').forEach(c => c.onclick = () => {
        const v = items.find(x => x._id === c.dataset.id);
        showPlay(v);
      });
    } catch (e) {
      el.innerHTML = '<div class="card" style="border-color:var(--danger)"><p style="color:var(--danger)">'+e.message+'</p></div>';
    }
  }

  function showPlay(v) {
    api.post('/learn/track', { itemType:'video', itemId: v._id, status: 'viewed' }).catch(()=>{});
    const ov = modal.show(v.title,
      embedHtml(v) +
      (v.description ? '<p style="margin-top:14px;line-height:1.6">'+escapeHtml(v.description)+'</p>' : ''),
      '<button class="btn btn-secondary modal-cancel">Close</button>'+
      '<button class="btn btn-secondary" id="fullscreen-video">Fullscreen</button>'+
      '<button class="btn btn-primary" id="done">✓ Mark as watched</button>'
    );
    ov.querySelector('.modal-cancel').onclick = () => ov.remove();
    ov.querySelector('#fullscreen-video').onclick = async () => {
      const target = ov.querySelector('#video-frame-wrap') || ov.querySelector('video') || ov.querySelector('iframe');
      if (!target) return;
      try {
        if (target.requestFullscreen) await target.requestFullscreen();
        else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
        else if (target.mozRequestFullScreen) target.mozRequestFullScreen();
        else toast.info('Fullscreen is not available in this browser');
      } catch (_) {
        toast.info('Use the fullscreen button inside the video player');
      }
    };
    ov.querySelector('#done').onclick = async () => {
      await api.post('/learn/track', { itemType:'video', itemId: v._id, status: 'completed' });
      toast.success('Marked as watched'); ov.remove(); render();
    };
  }

  render();
});
