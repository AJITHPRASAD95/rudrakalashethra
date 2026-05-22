router.register('content', async function(el) {
  let activeCategory = 'all', activeType = 'all', page = 1, search = '';

  const typeIcons = { video:'🎬', image:'🖼️', pdf:'📄', audio:'🎵' };
  const catIcons  = { Mudras:'🤲', Adavus:'🦶', Theory:'📚', Abhinaya:'💃', Footwork:'👣', Hastas:'✋', Nritta:'🎭', Natya:'🎪' };

  const render = async () => {
    try {
      // Load categories
      const catR = await api.get('/content/categories');
      const categories = catR.data || [];

      // Load content
      let url = '/content?page='+page+'&limit=16';
      if (activeCategory !== 'all') url += '&category='+encodeURIComponent(activeCategory);
      if (activeType !== 'all')     url += '&type='+activeType;
      if (search)                   url += '&search='+encodeURIComponent(search);
      const r = await api.get(url);
      const items = r.data || []; const pg = r.pagination || {total:0,page:1,pages:1};

      el.innerHTML =
        '<div class="page-header"><div class="page-header-text">' +
          '<h2>Content Library</h2>' +
          '<p>Videos, images and study materials for your students.</p>' +
        '</div>' +
        '<div class="page-header-actions">' +
          '<button class="btn btn-primary" id="upload-btn">' +
            '<svg viewBox="0 0 20 20" fill="none" width="15" height="15"><path d="M10 3v10M6 7l4-4 4 4M3 17h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>Upload Content</button>' +
        '</div></div>' +

        // Category pills
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">' +
          '<button class="cat-pill '+(activeCategory==='all'?'active':'')+'" data-cat="all">All <span style="opacity:.6">('+pg.total+')</span></button>' +
          categories.map(c =>
            '<button class="cat-pill '+(activeCategory===c.name?'active':'')+'" data-cat="'+c.name+'">'+(catIcons[c.name]||'📁')+' '+c.name+' <span style="opacity:.6">('+c.count+')</span></button>'
          ).join('') +
        '</div>' +

        // Toolbar
        '<div class="toolbar">' +
          '<div class="search-wrap">' +
            '<span class="search-icon"><svg viewBox="0 0 20 20" fill="none" width="15" height="15"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M16 16l-3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>' +
            '<input class="search-input" id="content-search" placeholder="Search content..." value="'+search+'"/>' +
          '</div>' +
          '<select class="form-control" id="type-filter" style="width:140px">' +
            '<option value="all">All Types</option>' +
            ['video','image','pdf','audio'].map(t=>'<option value="'+t+'" '+(activeType===t?'selected':'')+'>'+typeIcons[t]+' '+t.charAt(0).toUpperCase()+t.slice(1)+'</option>').join('') +
          '</select>' +
        '</div>' +

        // Content grid
        (items.length === 0 ?
          '<div class="empty-state"><div class="empty-icon">📚</div><h3>No content found</h3><p>'+(search||activeCategory!=='all'?'Try a different filter.':'Upload your first content item.')+'</p></div>' :
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px" id="content-grid">' +
            items.map(item => {
              const typeIcon = typeIcons[item.type] || '📄';
              const isVideo = item.type === 'video';
              const isImage = item.type === 'image';
              return '<div class="card content-card" data-id="'+item._id+'" style="padding:0;overflow:hidden;cursor:pointer">' +
                // Thumbnail / Preview area
                '<div style="height:140px;background:var(--cream-2);position:relative;overflow:hidden">' +
                  (isImage ? '<img src="'+item.url+'" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display=\'none\'">' : '') +
                  (item.thumbnail ? '<img src="'+item.thumbnail+'" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display=\'none\'">' : '') +
                  '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:36px;'+(isImage||item.thumbnail?'background:rgba(0,0,0,.3)':'')+'">'+typeIcon+'</div>' +
                  '<span style="position:absolute;top:8px;right:8px" class="badge badge-gray">'+item.type+'</span>' +
                  (item.duration ? '<span style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,.6);color:#fff;font-size:11px;padding:2px 6px;border-radius:4px;font-family:\'JetBrains Mono\',monospace">'+Math.floor(item.duration/60)+':'+String(item.duration%60).padStart(2,'0')+'</span>' : '') +
                '</div>' +
                // Info
                '<div style="padding:14px">' +
                  '<div style="font-weight:600;font-size:13.5px;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+item.title+'</div>' +
                  '<div style="font-size:11.5px;color:var(--text-3);margin-bottom:10px">'+item.category+(item.uploadedBy?'  ·  by '+item.uploadedBy.name:'')+'</div>' +
                  '<div style="display:flex;gap:6px">' +
                    '<a href="'+item.url+'" target="_blank" class="btn btn-sm btn-secondary" style="flex:1;justify-content:center" onclick="event.stopPropagation()">'+( isVideo?'▶ Play':isImage?'🔍 View':'↓ Open')+'</a>' +
                    '<button class="btn btn-sm btn-danger btn-del-content" data-id="'+item._id+'" data-title="'+item.title+'" onclick="event.stopPropagation()" title="Delete">✕</button>' +
                  '</div>' +
                '</div>' +
              '</div>';
            }).join('') +
          '</div>'
        ) +

        // Pagination
        (pg.pages > 1 ?
          '<div class="pagination" style="margin-top:18px">' +
            '<span>'+pg.total+' items</span>' +
            '<div class="pagination-btns">' +
              '<button class="pagination-btn" id="prev-pg" '+(page<=1?'disabled':'')+'>← Prev</button>' +
              '<span style="padding:0 8px;font-size:13px">'+page+' / '+pg.pages+'</span>' +
              '<button class="pagination-btn" id="next-pg" '+(page>=pg.pages?'disabled':'')+'>Next →</button>' +
            '</div>' +
          '</div>' : '');

      // Inject CSS for pills
      if (!document.getElementById('pill-styles')) {
        const st = document.createElement('style');
        st.id = 'pill-styles';
        st.textContent = `.cat-pill{padding:6px 14px;border-radius:20px;font-size:12.5px;font-weight:500;cursor:pointer;border:1.5px solid var(--border);background:var(--white);color:var(--text-2);transition:all .15s}.cat-pill:hover{border-color:var(--gold);color:var(--gold-dk)}.cat-pill.active{background:var(--gold);border-color:var(--gold);color:#fff}`;
        document.head.appendChild(st);
      }

      // Attach handlers
      el.querySelectorAll('.cat-pill').forEach(btn => {
        btn.onclick = () => { activeCategory = btn.dataset.cat; page = 1; render(); };
      });
      el.querySelector('#content-search').oninput = e => { search = e.target.value; page = 1; render(); };
      el.querySelector('#type-filter').onchange   = e => { activeType = e.target.value; page = 1; render(); };
      if(el.querySelector('#prev-pg')) el.querySelector('#prev-pg').onclick = ()=>{ if(page>1){page--;render();} };
      if(el.querySelector('#next-pg')) el.querySelector('#next-pg').onclick = ()=>{ if(page<pg.pages){page++;render();} };
      el.querySelector('#upload-btn').onclick = () => showUploadForm(categories.map(c=>c.name));

      el.querySelectorAll('.btn-del-content').forEach(btn => {
        btn.onclick = () => modal.confirm('Delete "'+btn.dataset.title+'"?', async () => {
          await api.del('/content/'+btn.dataset.id);
          toast.success('Content deleted'); render();
        });
      });

    } catch(e) { el.innerHTML = '<div class="card" style="border-color:var(--danger)"><p style="color:var(--danger)">'+e.message+'</p></div>'; }
  };

  function showUploadForm(existingCats) {
    const allCats = [...new Set(['Mudras','Adavus','Theory','Abhinaya','Footwork','Hastas','Nritta','Natya',...existingCats])].sort();
    const ov = modal.show('Upload Content',
      '<div class="form-row">' +
        '<div class="form-group"><label class="form-label">Category</label>' +
          '<select class="form-control" id="f-cat">' +
            allCats.map(c=>'<option value="'+c+'">'+( catIcons[c]||'📁')+' '+c+'</option>').join('') +
            '<option value="__new__">➕ New Category…</option>' +
          '</select></div>' +
        '<div class="form-group"><label class="form-label">Content Type</label>' +
          '<select class="form-control" id="f-type">' +
            ['video','image','pdf','audio'].map(t=>'<option value="'+t+'">'+typeIcons[t]+' '+t.charAt(0).toUpperCase()+t.slice(1)+'</option>').join('') +
          '</select></div>' +
      '</div>' +
      '<div id="new-cat-wrap" style="display:none" class="form-group"><label class="form-label">New Category Name</label><input class="form-control" id="f-new-cat" placeholder="e.g. Slokas"/></div>' +
      '<div class="form-group"><label class="form-label">Title</label>' +
        '<input class="form-control" id="f-title" placeholder="e.g. Pataka Mudra — Demonstration"/></div>' +
      '<div class="form-group"><label class="form-label">Description (optional)</label>' +
        '<textarea class="form-control" id="f-desc" rows="2" placeholder="Brief description…"></textarea></div>' +
      '<div class="form-group"><label class="form-label">File</label>' +
        '<input class="form-control" id="f-file" type="file" accept="video/*,image/*,.pdf,audio/*"/>' +
        '<div class="form-hint">Video, image, PDF or audio. Max 500MB.</div></div>' +
      '<div class="form-group"><label class="form-label">Thumbnail (optional, for videos)</label>' +
        '<input class="form-control" id="f-thumb" type="file" accept="image/*"/></div>' +
      '<div class="form-group"><label class="form-label">Tags (comma-separated)</label>' +
        '<input class="form-control" id="f-tags" placeholder="e.g. mudra, hand gesture, basic"/></div>',
      '<button class="btn btn-secondary modal-cancel">Cancel</button><button class="btn btn-primary" id="save-content">Upload</button>'
    );
    ov.querySelector('.modal-cancel').onclick = () => ov.remove();
    ov.querySelector('#f-cat').onchange = (e) => {
      ov.querySelector('#new-cat-wrap').style.display = e.target.value==='__new__' ? 'block' : 'none';
    };
    ov.querySelector('#save-content').onclick = async () => {
      const catVal = ov.querySelector('#f-cat').value;
      const category = catVal==='__new__' ? ov.querySelector('#f-new-cat').value.trim() : catVal;
      const title    = ov.querySelector('#f-title').value.trim();
      const type     = ov.querySelector('#f-type').value;
      const fileEl   = ov.querySelector('#f-file');
      if (!category||!title||!fileEl.files[0]) { toast.error('Category, title and file are required'); return; }

      const btn = ov.querySelector('#save-content');
      btn.textContent = 'Uploading…'; btn.disabled = true;

      try {
        const fd = new FormData();
        fd.append('category',    category);
        fd.append('title',       title);
        fd.append('type',        type);
        fd.append('description', ov.querySelector('#f-desc').value.trim());
        fd.append('tags',        ov.querySelector('#f-tags').value.trim());
        fd.append('file',        fileEl.files[0]);
        const thumbEl = ov.querySelector('#f-thumb');
        if (thumbEl.files[0]) fd.append('thumbnail', thumbEl.files[0]);

        await api.upload('/content', fd);
        ov.remove(); toast.success('Content uploaded!'); render();
      } catch(e) {
        toast.error(e.message);
        btn.textContent='Upload'; btn.disabled=false;
      }
    };
  }

  render();
});
