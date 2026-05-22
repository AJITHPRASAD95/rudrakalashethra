/* eslint-disable */
router.register('mudras', async function(el) {
  let activeCategory = 'all', search = '', page = 1;
  const CATS = ['Asamyukta','Samyukta','Other'];

  const escapeHtml = (s='') => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function videoEmbedHtml(m) {
    if (!m.videoUrl) return '';
    if (m.videoSource === 'youtube') {
      const id = (m.videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]+)/)||[])[1];
      return id ? `<iframe style="width:100%;aspect-ratio:16/9;border:0;border-radius:8px" src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>` : '';
    }
    if (m.videoSource === 'vimeo') {
      const id = (m.videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/)||[])[1];
      return id ? `<iframe style="width:100%;aspect-ratio:16/9;border:0;border-radius:8px" src="https://player.vimeo.com/video/${id}" allowfullscreen></iframe>` : '';
    }
    return `<video controls style="width:100%;border-radius:8px;background:#000" src="${m.videoUrl}"></video>`;
  }

  const render = async () => {
    try {
      let url = '/mudras?page='+page+'&limit=24';
      if (activeCategory !== 'all') url += '&category='+encodeURIComponent(activeCategory);
      if (search) url += '&search='+encodeURIComponent(search);
      const r = await api.get(url);
      const items = r.data || [];
      const pg = r.pagination || { total: 0, page: 1, pages: 1 };

      el.innerHTML =
        '<div class="page-header"><div class="page-header-text">'+
          '<h2>Mudras</h2><p>Hand gestures with meaning, technique and demo video.</p>'+
        '</div>'+
        '<div class="page-header-actions">'+
          '<button class="btn btn-primary" id="add-mudra">+ Add Mudra</button>'+
        '</div></div>'+

        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">'+
          '<button class="cat-pill '+(activeCategory==='all'?'active':'')+'" data-cat="all">All ('+pg.total+')</button>'+
          CATS.map(c => '<button class="cat-pill '+(activeCategory===c?'active':'')+'" data-cat="'+c+'">'+c+'</button>').join('')+
        '</div>'+

        '<div class="toolbar">'+
          '<div class="search-wrap">'+
            '<span class="search-icon">🔍</span>'+
            '<input class="search-input" id="m-search" placeholder="Search mudras..." value="'+escapeHtml(search)+'"/>'+
          '</div>'+
        '</div>'+

        (items.length === 0 ?
          '<div class="empty-state"><div class="empty-icon">🤲</div><h3>No mudras yet</h3><p>Add your first mudra to get started.</p></div>' :
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px">'+
            items.map(m =>
              '<div class="card mudra-card" data-id="'+m._id+'" style="padding:0;overflow:hidden;cursor:pointer">'+
                '<div style="height:160px;background:var(--cream-2);position:relative">'+
                  (m.image ? '<img src="'+m.image+'" style="width:100%;height:100%;object-fit:cover"/>' : '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:48px">🤲</div>')+
                  (m.isPublished ? '' : '<span class="badge badge-gray" style="position:absolute;top:8px;left:8px">Draft</span>')+
                  '<span class="badge" style="position:absolute;top:8px;right:8px;background:var(--gold);color:#fff">'+m.category+'</span>'+
                '</div>'+
                '<div style="padding:14px">'+
                  '<div style="font-weight:600;font-size:14.5px;margin-bottom:2px">'+escapeHtml(m.name)+'</div>'+
                  (m.sanskritName ? '<div style="font-size:12px;color:var(--text-3);font-style:italic;margin-bottom:6px">'+escapeHtml(m.sanskritName)+'</div>':'')+
                  '<div style="font-size:12.5px;color:var(--text-2);height:38px;overflow:hidden">'+escapeHtml(m.meaning||'')+'</div>'+
                  '<div style="display:flex;gap:6px;margin-top:10px">'+
                    '<button class="btn btn-sm btn-secondary btn-edit" data-id="'+m._id+'" style="flex:1;justify-content:center">Edit</button>'+
                    '<button class="btn btn-sm btn-danger btn-del" data-id="'+m._id+'" data-title="'+escapeHtml(m.name)+'">✕</button>'+
                  '</div>'+
                '</div>'+
              '</div>'
            ).join('')+
          '</div>'
        )+

        (pg.pages > 1 ?
          '<div class="pagination" style="margin-top:18px"><span>'+pg.total+' mudras</span>'+
          '<div class="pagination-btns">'+
            '<button class="pagination-btn" id="prev" '+(page<=1?'disabled':'')+'>← Prev</button>'+
            '<span style="padding:0 8px;font-size:13px">'+page+' / '+pg.pages+'</span>'+
            '<button class="pagination-btn" id="next" '+(page>=pg.pages?'disabled':'')+'>Next →</button>'+
          '</div></div>' : '');

      // Pill styles share with content page
      if (!document.getElementById('pill-styles')) {
        const st = document.createElement('style');
        st.id = 'pill-styles';
        st.textContent = `.cat-pill{padding:6px 14px;border-radius:20px;font-size:12.5px;font-weight:500;cursor:pointer;border:1.5px solid var(--border);background:var(--white);color:var(--text-2);transition:all .15s}.cat-pill:hover{border-color:var(--gold);color:var(--gold-dk)}.cat-pill.active{background:var(--gold);border-color:var(--gold);color:#fff}`;
        document.head.appendChild(st);
      }

      el.querySelectorAll('.cat-pill').forEach(b => b.onclick = () => { activeCategory = b.dataset.cat; page=1; render(); });
      el.querySelector('#m-search').oninput = e => { search = e.target.value; page=1; render(); };
      el.querySelector('#add-mudra').onclick = () => showForm();
      const prev = el.querySelector('#prev'); if (prev) prev.onclick = () => { if(page>1){page--; render();} };
      const next = el.querySelector('#next'); if (next) next.onclick = () => { if(page<pg.pages){page++; render();} };

      el.querySelectorAll('.btn-edit').forEach(b => b.onclick = (ev) => {
        ev.stopPropagation();
        const m = items.find(x => x._id === b.dataset.id);
        showForm(m);
      });
      el.querySelectorAll('.btn-del').forEach(b => b.onclick = (ev) => {
        ev.stopPropagation();
        modal.confirm('Delete "'+b.dataset.title+'"?', async () => {
          await api.del('/mudras/'+b.dataset.id);
          toast.success('Deleted'); render();
        });
      });
      el.querySelectorAll('.mudra-card').forEach(c => c.onclick = () => {
        const m = items.find(x => x._id === c.dataset.id);
        showDetail(m);
      });
    } catch (e) {
      el.innerHTML = '<div class="card" style="border-color:var(--danger)"><p style="color:var(--danger)">'+e.message+'</p></div>';
    }
  };

  function showDetail(m) {
    modal.show(m.name,
      (m.image ? '<img src="'+m.image+'" style="width:100%;max-height:280px;object-fit:cover;border-radius:8px;margin-bottom:14px"/>' : '')+
      videoEmbedHtml(m)+
      (m.sanskritName ? '<p style="font-style:italic;color:var(--text-3);margin:10px 0 4px">'+escapeHtml(m.sanskritName)+'</p>' : '')+
      (m.meaning     ? '<p style="margin:8px 0"><b>Meaning:</b> '+escapeHtml(m.meaning)+'</p>' : '')+
      (m.description ? '<p style="margin:8px 0;white-space:pre-wrap">'+escapeHtml(m.description)+'</p>' : '')+
      (m.usage       ? '<p style="margin:8px 0"><b>Usage:</b> '+escapeHtml(m.usage)+'</p>' : ''),
      '<button class="btn btn-secondary modal-cancel">Close</button>'
    ).querySelector('.modal-cancel').onclick = function(){ this.closest('.modal-overlay').remove(); };
  }

  function showForm(existing) {
    const m = existing || {};
    const ov = modal.show(existing ? 'Edit Mudra' : 'Add Mudra',
      '<div class="form-row">'+
        '<div class="form-group"><label class="form-label">Name *</label><input id="f-name" class="form-control" value="'+escapeHtml(m.name||'')+'" placeholder="e.g. Pataka"/></div>'+
        '<div class="form-group"><label class="form-label">Sanskrit / Alt name</label><input id="f-sansk" class="form-control" value="'+escapeHtml(m.sanskritName||'')+'" placeholder="e.g. पताक"/></div>'+
      '</div>'+
      '<div class="form-row">'+
        '<div class="form-group"><label class="form-label">Category</label>'+
          '<select id="f-cat" class="form-control">'+CATS.map(c => '<option '+(m.category===c?'selected':'')+'>'+c+'</option>').join('')+'</select>'+
        '</div>'+
        '<div class="form-group"><label class="form-label">Order</label><input id="f-order" type="number" class="form-control" value="'+(m.order||0)+'"/></div>'+
      '</div>'+
      '<div class="form-group"><label class="form-label">Meaning</label><input id="f-meaning" class="form-control" value="'+escapeHtml(m.meaning||'')+'" placeholder="Short meaning / translation"/></div>'+
      '<div class="form-group"><label class="form-label">Description / how to form it</label><textarea id="f-desc" class="form-control" rows="4">'+escapeHtml(m.description||'')+'</textarea></div>'+
      '<div class="form-group"><label class="form-label">Usage in dance</label><textarea id="f-usage" class="form-control" rows="2">'+escapeHtml(m.usage||'')+'</textarea></div>'+
      '<div class="form-group"><label class="form-label">Reference image '+(m.image?'<span style="color:var(--text-3);font-size:11px">(uploading replaces existing)</span>':'')+'</label><input id="f-image" type="file" class="form-control" accept="image/*"/></div>'+
      '<div class="form-group"><label class="form-label">YouTube / Vimeo URL</label><input id="f-embed" class="form-control" value="'+escapeHtml(m.videoSource && m.videoSource!=='upload' ? (m.videoUrl||'') : '')+'" placeholder="https://youtube.com/watch?v=..."/></div>'+
      '<div class="form-group"><label class="form-label">…or upload a video file</label><input id="f-video" type="file" class="form-control" accept="video/*"/></div>'+
      '<div class="form-group"><label class="form-label">Tags (comma-separated)</label><input id="f-tags" class="form-control" value="'+escapeHtml((m.tags||[]).join(', '))+'" placeholder="basic, single-hand"/></div>'+
      (existing ? '<div class="form-group"><label style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="f-pub" '+(m.isPublished!==false?'checked':'')+'/> Published</label></div>' : ''),
      '<button class="btn btn-secondary modal-cancel">Cancel</button><button class="btn btn-primary" id="f-save">'+(existing?'Save':'Create')+'</button>'
    );
    ov.querySelector('.modal-cancel').onclick = () => ov.remove();
    ov.querySelector('#f-save').onclick = async () => {
      const name = ov.querySelector('#f-name').value.trim();
      if (!name) { toast.error('Name is required'); return; }
      const btn = ov.querySelector('#f-save'); btn.disabled = true; btn.textContent = 'Saving…';
      try {
        const fd = new FormData();
        fd.append('name', name);
        fd.append('sanskritName', ov.querySelector('#f-sansk').value.trim());
        fd.append('category', ov.querySelector('#f-cat').value);
        fd.append('order', ov.querySelector('#f-order').value || 0);
        fd.append('meaning', ov.querySelector('#f-meaning').value.trim());
        fd.append('description', ov.querySelector('#f-desc').value.trim());
        fd.append('usage', ov.querySelector('#f-usage').value.trim());
        fd.append('tags', ov.querySelector('#f-tags').value.trim());
        const img = ov.querySelector('#f-image').files[0]; if (img) fd.append('image', img);
        const vid = ov.querySelector('#f-video').files[0]; if (vid) fd.append('video', vid);
        const emb = ov.querySelector('#f-embed').value.trim(); if (emb) fd.append('videoEmbedUrl', emb);
        if (existing) fd.append('isPublished', ov.querySelector('#f-pub').checked ? 'true' : 'false');
        if (existing) await api.upload('/mudras/'+m._id, fd, 'PUT');
        else          await api.upload('/mudras', fd);
        ov.remove(); toast.success(existing ? 'Updated' : 'Mudra created'); render();
      } catch (e) {
        toast.error(e.message); btn.disabled = false; btn.textContent = existing ? 'Save' : 'Create';
      }
    };
  }

  render();
});
