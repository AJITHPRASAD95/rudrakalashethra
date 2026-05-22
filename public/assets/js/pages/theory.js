/* eslint-disable */
router.register('theory', async function(el) {
  let search = '', activeCategory = 'all', page = 1;
  const escapeHtml = (s='') => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function render() {
    try {
      let url = '/theory?page='+page+'&limit=20';
      if (search) url += '&search='+encodeURIComponent(search);
      if (activeCategory !== 'all') url += '&category='+encodeURIComponent(activeCategory);
      const r = await api.get(url);
      const items = r.data || [];
      const pg = r.pagination || { total: 0, page: 1, pages: 1 };
      const cats = [...new Set(items.map(a => a.category).filter(Boolean))];

      el.innerHTML =
        '<div class="page-header"><div class="page-header-text">'+
          '<h2>Theory</h2><p>Articles on history, terminology, and principles.</p></div>'+
        '<div class="page-header-actions">'+
          '<button class="btn btn-primary" id="add">+ New Article</button>'+
        '</div></div>'+

        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">'+
          '<button class="cat-pill '+(activeCategory==='all'?'active':'')+'" data-cat="all">All ('+pg.total+')</button>'+
          cats.map(c => '<button class="cat-pill '+(activeCategory===c?'active':'')+'" data-cat="'+c+'">'+c+'</button>').join('')+
        '</div>'+

        '<div class="toolbar"><div class="search-wrap"><span class="search-icon">🔍</span>'+
          '<input class="search-input" id="t-search" value="'+escapeHtml(search)+'" placeholder="Search articles..."/></div></div>'+

        (items.length === 0 ?
          '<div class="empty-state"><div class="empty-icon">📚</div><h3>No articles yet</h3><p>Write the first theory article.</p></div>' :
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">'+
            items.map(a =>
              '<div class="card" data-id="'+a._id+'" style="padding:0;overflow:hidden">'+
                (a.coverImage ? '<img src="'+a.coverImage+'" style="width:100%;height:140px;object-fit:cover"/>' : '<div style="height:80px;background:linear-gradient(135deg,var(--cream-2),var(--cream-3))"></div>')+
                '<div style="padding:16px">'+
                  '<div style="font-size:11px;color:var(--gold-dk);font-weight:600;letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px">'+escapeHtml(a.category||'General')+(a.readMinutes?' · '+a.readMinutes+' min read':'')+'</div>'+
                  '<div style="font-weight:600;font-size:16px;margin-bottom:4px;line-height:1.3">'+escapeHtml(a.title)+'</div>'+
                  (a.subtitle ? '<div style="font-size:13px;color:var(--text-2);margin-bottom:10px">'+escapeHtml(a.subtitle)+'</div>' : '')+
                  '<div style="display:flex;gap:6px;margin-top:10px">'+
                    '<button class="btn btn-sm btn-secondary btn-read" data-id="'+a._id+'" style="flex:1;justify-content:center">Read</button>'+
                    '<button class="btn btn-sm btn-secondary btn-edit" data-id="'+a._id+'">Edit</button>'+
                    '<button class="btn btn-sm btn-danger btn-del" data-id="'+a._id+'" data-title="'+escapeHtml(a.title)+'">✕</button>'+
                  '</div>'+
                '</div>'+
              '</div>'
            ).join('')+
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
      el.querySelector('#add').onclick = () => showForm();
      const prev = el.querySelector('#prev'); if (prev) prev.onclick = () => { if(page>1){page--; render();} };
      const next = el.querySelector('#next'); if (next) next.onclick = () => { if(page<pg.pages){page++; render();} };

      el.querySelectorAll('.btn-read').forEach(b => b.onclick = async () => {
        const r2 = await api.get('/theory/'+b.dataset.id);
        showRead(r2.data);
      });
      el.querySelectorAll('.btn-edit').forEach(b => b.onclick = async () => {
        const r2 = await api.get('/theory/'+b.dataset.id);
        showForm(r2.data);
      });
      el.querySelectorAll('.btn-del').forEach(b => b.onclick = () =>
        modal.confirm('Delete "'+b.dataset.title+'"?', async () => {
          await api.del('/theory/'+b.dataset.id);
          toast.success('Deleted'); render();
        })
      );
    } catch (e) {
      el.innerHTML = '<div class="card" style="border-color:var(--danger)"><p style="color:var(--danger)">'+e.message+'</p></div>';
    }
  }

  function showRead(a) {
    modal.show(a.title,
      (a.coverImage ? '<img src="'+a.coverImage+'" style="width:100%;max-height:240px;object-fit:cover;border-radius:8px;margin-bottom:14px"/>' : '')+
      (a.subtitle ? '<p style="color:var(--text-2);font-size:15px;margin-bottom:14px">'+escapeHtml(a.subtitle)+'</p>' : '')+
      '<div class="theory-body" style="line-height:1.7">'+ a.body +'</div>',
      '<button class="btn btn-secondary modal-cancel">Close</button>'
    ).querySelector('.modal-cancel').onclick = function(){ this.closest('.modal-overlay').remove(); };
  }

  function showForm(existing) {
    const a = existing || {};
    const ov = modal.show(existing ? 'Edit Article' : 'New Theory Article',
      '<div class="form-row">'+
        '<div class="form-group"><label class="form-label">Title *</label><input id="f-title" class="form-control" value="'+escapeHtml(a.title||'')+'"/></div>'+
        '<div class="form-group"><label class="form-label">Category</label><input id="f-cat" class="form-control" value="'+escapeHtml(a.category||'General')+'" placeholder="e.g. History"/></div>'+
      '</div>'+
      '<div class="form-group"><label class="form-label">Subtitle (optional)</label><input id="f-sub" class="form-control" value="'+escapeHtml(a.subtitle||'')+'"/></div>'+
      '<div class="form-group"><label class="form-label">Cover image (optional)</label><input id="f-cover" type="file" class="form-control" accept="image/*"/></div>'+
      '<div class="form-group"><label class="form-label">Body * <span style="color:var(--text-3);font-size:11px">(HTML allowed — paragraphs, &lt;b&gt;, &lt;i&gt;, &lt;ul&gt;&lt;li&gt;, headings)</span></label>'+
        '<textarea id="f-body" class="form-control" rows="14" style="font-family:\'JetBrains Mono\',monospace;font-size:13px">'+escapeHtml(a.body||'')+'</textarea></div>'+
      '<div class="form-group"><label class="form-label">Tags (comma-separated)</label><input id="f-tags" class="form-control" value="'+escapeHtml((a.tags||[]).join(', '))+'"/></div>'+
      (existing ? '<div class="form-group"><label style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="f-pub" '+(a.isPublished!==false?'checked':'')+'/> Published</label></div>' : ''),
      '<button class="btn btn-secondary modal-cancel">Cancel</button><button class="btn btn-primary" id="f-save">'+(existing?'Save':'Create')+'</button>'
    );
    ov.querySelector('.modal-cancel').onclick = () => ov.remove();
    ov.querySelector('#f-save').onclick = async () => {
      const title = ov.querySelector('#f-title').value.trim();
      const body  = ov.querySelector('#f-body').value.trim();
      if (!title || !body) { toast.error('Title and body required'); return; }
      const btn = ov.querySelector('#f-save'); btn.disabled = true; btn.textContent = 'Saving…';
      try {
        const fd = new FormData();
        fd.append('title', title);
        fd.append('subtitle', ov.querySelector('#f-sub').value.trim());
        fd.append('category', ov.querySelector('#f-cat').value.trim() || 'General');
        fd.append('body',  body);
        fd.append('tags',  ov.querySelector('#f-tags').value.trim());
        const c = ov.querySelector('#f-cover').files[0]; if (c) fd.append('cover', c);
        if (existing) fd.append('isPublished', ov.querySelector('#f-pub').checked ? 'true' : 'false');
        if (existing) await api.upload('/theory/'+a._id, fd, 'PUT');
        else          await api.upload('/theory', fd);
        ov.remove(); toast.success(existing ? 'Updated' : 'Created'); render();
      } catch (e) {
        toast.error(e.message); btn.disabled = false; btn.textContent = existing ? 'Save' : 'Create';
      }
    };
  }

  render();
});
