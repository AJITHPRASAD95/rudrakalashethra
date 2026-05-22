/* eslint-disable */
router.register('quizzes', async function(el) {
  let search = '', page = 1;
  const escapeHtml = (s='') => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function render() {
    try {
      let url = '/quizzes?page='+page+'&limit=20';
      if (search) url += '&search='+encodeURIComponent(search);
      const r = await api.get(url);
      const items = r.data || [];
      const pg = r.pagination || { total: 0, page: 1, pages: 1 };

      el.innerHTML =
        '<div class="page-header"><div class="page-header-text">'+
          '<h2>Quizzes</h2><p>Practice exercises to test theory and mudras.</p></div>'+
        '<div class="page-header-actions">'+
          '<button class="btn btn-primary" id="add">+ New Quiz</button>'+
        '</div></div>'+

        '<div class="toolbar"><div class="search-wrap"><span class="search-icon">🔍</span>'+
          '<input class="search-input" id="q-search" value="'+escapeHtml(search)+'" placeholder="Search quizzes..."/></div></div>'+

        (items.length === 0 ?
          '<div class="empty-state"><div class="empty-icon">📝</div><h3>No quizzes yet</h3><p>Build your first quiz to help students practice.</p></div>' :
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">'+
            items.map(q =>
              '<div class="card" data-id="'+q._id+'" style="padding:18px">'+
                '<div style="font-size:11px;color:var(--gold-dk);font-weight:600;letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px">'+escapeHtml(q.category||'General')+'</div>'+
                '<div style="font-weight:600;font-size:16px;margin-bottom:6px">'+escapeHtml(q.title)+'</div>'+
                (q.description ? '<div style="font-size:13px;color:var(--text-2);margin-bottom:10px">'+escapeHtml(q.description)+'</div>' : '')+
                '<div style="display:flex;gap:14px;font-size:12px;color:var(--text-3);margin-bottom:12px">'+
                  '<span>📝 '+(q.questionCount || (q.questions||[]).length)+' questions</span>'+
                  '<span>🎯 '+(q.passingScore||60)+'% to pass</span>'+
                  '<span>'+(q.isPublished===false?'⚠ Draft':'✓ Published')+'</span>'+
                '</div>'+
                '<div style="display:flex;gap:6px">'+
                  '<button class="btn btn-sm btn-secondary btn-edit" data-id="'+q._id+'" style="flex:1;justify-content:center">Edit</button>'+
                  '<button class="btn btn-sm btn-danger btn-del" data-id="'+q._id+'" data-title="'+escapeHtml(q.title)+'">✕</button>'+
                '</div>'+
              '</div>'
            ).join('')+
          '</div>')+

        (pg.pages > 1 ? '<div class="pagination" style="margin-top:18px"><span>'+pg.total+' quizzes</span>'+
          '<div class="pagination-btns"><button class="pagination-btn" id="prev" '+(page<=1?'disabled':'')+'>← Prev</button>'+
          '<span style="padding:0 8px;font-size:13px">'+page+' / '+pg.pages+'</span>'+
          '<button class="pagination-btn" id="next" '+(page>=pg.pages?'disabled':'')+'>Next →</button></div></div>' : '');

      el.querySelector('#q-search').oninput = e => { search = e.target.value; page=1; render(); };
      el.querySelector('#add').onclick = () => showForm();
      const prev = el.querySelector('#prev'); if (prev) prev.onclick = () => { if(page>1){page--; render();} };
      const next = el.querySelector('#next'); if (next) next.onclick = () => { if(page<pg.pages){page++; render();} };

      el.querySelectorAll('.btn-edit').forEach(b => b.onclick = async () => {
        const r2 = await api.get('/quizzes/'+b.dataset.id);
        showForm(r2.data);
      });
      el.querySelectorAll('.btn-del').forEach(b => b.onclick = () =>
        modal.confirm('Delete "'+b.dataset.title+'"?', async () => {
          await api.del('/quizzes/'+b.dataset.id);
          toast.success('Deleted'); render();
        })
      );
    } catch (e) {
      el.innerHTML = '<div class="card" style="border-color:var(--danger)"><p style="color:var(--danger)">'+e.message+'</p></div>';
    }
  }

  function questionBlock(q, i) {
    return '<div class="q-block" data-i="'+i+'" style="border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:12px;background:var(--cream)">'+
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px">'+
        '<strong style="font-size:13px">Question '+(i+1)+'</strong>'+
        '<button type="button" class="btn-sm btn-danger q-del" style="padding:4px 8px;border-radius:6px;font-size:11px">Remove</button>'+
      '</div>'+
      '<input class="form-control q-prompt" placeholder="Question text" value="'+(q.prompt||'').replace(/"/g,'&quot;')+'" style="margin-bottom:8px"/>'+
      '<div class="q-opts" style="display:flex;flex-direction:column;gap:6px">'+
        (q.options||['','','','']).map((o, j) =>
          '<label style="display:flex;align-items:center;gap:8px">'+
            '<input type="radio" name="correct-'+i+'" class="q-correct" data-j="'+j+'" '+(q.correctIndex===j?'checked':'')+'/>'+
            '<input class="form-control q-opt" placeholder="Option '+(j+1)+'" value="'+String(o).replace(/"/g,'&quot;')+'" style="flex:1"/>'+
          '</label>'
        ).join('')+
      '</div>'+
      '<input class="form-control q-expl" placeholder="Explanation (optional)" value="'+(q.explanation||'').replace(/"/g,'&quot;')+'" style="margin-top:8px"/>'+
    '</div>';
  }

  function readQuestionsFromDOM(ov) {
    return [...ov.querySelectorAll('.q-block')].map(b => {
      const opts = [...b.querySelectorAll('.q-opt')].map(o => o.value.trim()).filter(Boolean);
      const checked = b.querySelector('.q-correct:checked');
      return {
        prompt: b.querySelector('.q-prompt').value.trim(),
        options: opts,
        correctIndex: checked ? Number(checked.dataset.j) : 0,
        explanation: b.querySelector('.q-expl').value.trim(),
      };
    });
  }

  function showForm(existing) {
    const q = existing || { questions: [{ options: ['','','',''], correctIndex: 0 }] };
    const ov = modal.show(existing ? 'Edit Quiz' : 'New Quiz',
      '<div class="form-row">'+
        '<div class="form-group"><label class="form-label">Title *</label><input id="f-title" class="form-control" value="'+(q.title||'').replace(/"/g,'&quot;')+'"/></div>'+
        '<div class="form-group"><label class="form-label">Category</label><input id="f-cat" class="form-control" value="'+(q.category||'General').replace(/"/g,'&quot;')+'"/></div>'+
      '</div>'+
      '<div class="form-group"><label class="form-label">Description</label><textarea id="f-desc" class="form-control" rows="2">'+escapeHtml(q.description||'')+'</textarea></div>'+
      '<div class="form-row">'+
        '<div class="form-group"><label class="form-label">Passing score (%)</label><input id="f-pass" type="number" class="form-control" value="'+(q.passingScore||60)+'"/></div>'+
        (existing ? '<div class="form-group"><label class="form-label">Status</label><select id="f-pub" class="form-control"><option value="true" '+(q.isPublished!==false?'selected':'')+'>Published</option><option value="false" '+(q.isPublished===false?'selected':'')+'>Draft</option></select></div>' : '<div class="form-group"></div>')+
      '</div>'+

      '<div style="margin:14px 0 8px;display:flex;justify-content:space-between;align-items:center">'+
        '<strong>Questions</strong>'+
        '<button type="button" class="btn btn-sm btn-secondary" id="add-q">+ Add Question</button>'+
      '</div>'+
      '<div id="q-wrap">'+ (q.questions||[]).map((qq, i) => questionBlock(qq, i)).join('') +'</div>',

      '<button class="btn btn-secondary modal-cancel">Cancel</button><button class="btn btn-primary" id="f-save">'+(existing?'Save':'Create')+'</button>'
    );

    function reindex() {
      [...ov.querySelectorAll('.q-block')].forEach((b, i) => {
        b.dataset.i = i;
        b.querySelector('strong').textContent = 'Question ' + (i+1);
        b.querySelectorAll('.q-correct').forEach(r => { r.name = 'correct-' + i; });
      });
    }
    function bindBlock(b) {
      b.querySelector('.q-del').onclick = () => { b.remove(); reindex(); };
    }
    ov.querySelectorAll('.q-block').forEach(bindBlock);

    ov.querySelector('#add-q').onclick = () => {
      const wrap = ov.querySelector('#q-wrap');
      const idx = wrap.querySelectorAll('.q-block').length;
      const tmp = document.createElement('div');
      tmp.innerHTML = questionBlock({ options: ['','','',''], correctIndex: 0 }, idx);
      const block = tmp.firstChild;
      wrap.appendChild(block);
      bindBlock(block);
    };

    ov.querySelector('.modal-cancel').onclick = () => ov.remove();
    ov.querySelector('#f-save').onclick = async () => {
      const title = ov.querySelector('#f-title').value.trim();
      if (!title) { toast.error('Title required'); return; }
      const questions = readQuestionsFromDOM(ov);
      if (questions.length === 0) { toast.error('Add at least one question'); return; }
      for (let i=0; i<questions.length; i++) {
        const x = questions[i];
        if (!x.prompt)               { toast.error('Question '+(i+1)+': prompt required'); return; }
        if (!x.options || x.options.length < 2) { toast.error('Question '+(i+1)+': need 2+ options'); return; }
      }
      const body = {
        title,
        description: ov.querySelector('#f-desc').value.trim(),
        category: ov.querySelector('#f-cat').value.trim() || 'General',
        passingScore: Number(ov.querySelector('#f-pass').value) || 60,
        questions,
      };
      if (existing) body.isPublished = ov.querySelector('#f-pub').value === 'true';
      const btn = ov.querySelector('#f-save'); btn.disabled = true; btn.textContent='Saving…';
      try {
        if (existing) await api.put('/quizzes/'+q._id, body);
        else          await api.post('/quizzes', body);
        ov.remove(); toast.success(existing ? 'Updated' : 'Created'); render();
      } catch (e) {
        toast.error(e.message); btn.disabled = false; btn.textContent = existing ? 'Save' : 'Create';
      }
    };
  }

  render();
});
