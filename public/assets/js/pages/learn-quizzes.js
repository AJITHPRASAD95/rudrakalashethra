/* eslint-disable */
router.register('learn-quizzes', async function(el) {
  let search = '', page = 1;
  const escapeHtml = (s='') => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function render() {
    try {
      let url = '/quizzes?page='+page+'&limit=20';
      if (search) url += '&search='+encodeURIComponent(search);
      const [r, pr] = await Promise.all([
        api.get(url),
        api.get('/learn/progress?itemType=quiz').catch(() => ({ data: { map: {} } })),
      ]);
      const items = r.data || [];
      const pg = r.pagination || { total:0,page:1,pages:1 };
      const prog = pr.data.map || {};

      el.innerHTML =
        '<div class="page-header"><div class="page-header-text">'+
          '<h2>Quizzes</h2><p>Test what you have learnt — instant feedback after each attempt.</p></div></div>'+

        '<div class="toolbar"><div class="search-wrap"><span class="search-icon">🔍</span>'+
          '<input class="search-input" id="q-search" value="'+escapeHtml(search)+'" placeholder="Search quizzes..."/></div></div>'+

        (items.length === 0 ?
          '<div class="empty-state"><div class="empty-icon">📝</div><h3>No quizzes available</h3></div>' :
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">'+
            items.map(q => {
              const p = prog[q._id];
              const badge = p
                ? '<div style="font-size:12px;font-weight:600;color:'+(p.status==='completed'?'var(--success)':'var(--warning)')+'">'+(p.status==='completed'?'✓ Passed':'Best: '+(p.bestScore||0)+'%')+'</div>'
                : '<div style="font-size:12px;color:var(--text-3)">Not attempted</div>';
              return '<div class="card quiz-card" data-id="'+q._id+'" style="padding:18px;cursor:pointer">'+
                '<div style="font-size:11px;color:var(--gold-dk);font-weight:600;letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px">'+escapeHtml(q.category||'General')+'</div>'+
                '<div style="font-weight:600;font-size:16px;margin-bottom:6px">'+escapeHtml(q.title)+'</div>'+
                (q.description ? '<div style="font-size:13px;color:var(--text-2);margin-bottom:10px">'+escapeHtml(q.description)+'</div>' : '')+
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">'+
                  '<span style="font-size:12px;color:var(--text-3)">📝 '+(q.questionCount || (q.questions||[]).length)+' questions · 🎯 '+(q.passingScore||60)+'%</span>'+
                  badge+
                '</div>'+
              '</div>';
            }).join('')+
          '</div>')+

        (pg.pages > 1 ? '<div class="pagination" style="margin-top:18px"><span>'+pg.total+' quizzes</span>'+
          '<div class="pagination-btns"><button class="pagination-btn" id="prev" '+(page<=1?'disabled':'')+'>← Prev</button>'+
          '<span style="padding:0 8px;font-size:13px">'+page+' / '+pg.pages+'</span>'+
          '<button class="pagination-btn" id="next" '+(page>=pg.pages?'disabled':'')+'>Next →</button></div></div>' : '');

      el.querySelector('#q-search').oninput = e => { search = e.target.value; page=1; render(); };
      const prev = el.querySelector('#prev'); if (prev) prev.onclick = () => { if(page>1){page--; render();} };
      const next = el.querySelector('#next'); if (next) next.onclick = () => { if(page<pg.pages){page++; render();} };

      el.querySelectorAll('.quiz-card').forEach(c => c.onclick = async () => {
        const r2 = await api.get('/quizzes/'+c.dataset.id);
        startQuiz(r2.data);
      });
    } catch (e) {
      el.innerHTML = '<div class="card" style="border-color:var(--danger)"><p style="color:var(--danger)">'+e.message+'</p></div>';
    }
  }

  function startQuiz(quiz) {
    let current = 0;
    const answers = new Array(quiz.questions.length).fill(null);

    const ov = modal.show(quiz.title,
      '<div id="qbody"></div>',
      '<button class="btn btn-secondary modal-cancel">Cancel</button>'+
      '<button class="btn btn-secondary" id="prev-q">← Prev</button>'+
      '<button class="btn btn-primary" id="next-q">Next →</button>'
    );

    function renderQ() {
      const q = quiz.questions[current];
      const body = ov.querySelector('#qbody');
      body.innerHTML =
        '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-3);margin-bottom:14px">'+
          '<span>Question '+(current+1)+' of '+quiz.questions.length+'</span>'+
          '<span>'+answers.filter(a => a !== null).length+' answered</span>'+
        '</div>'+
        '<div style="height:4px;background:var(--cream-2);border-radius:2px;margin-bottom:18px;overflow:hidden">'+
          '<div style="height:100%;width:'+(((current+1)/quiz.questions.length)*100)+'%;background:var(--gold);transition:width .2s"></div>'+
        '</div>'+
        '<div style="font-size:15px;font-weight:500;margin-bottom:16px;line-height:1.5">'+escapeHtml(q.prompt)+'</div>'+
        '<div style="display:flex;flex-direction:column;gap:8px">'+
          q.options.map((o,i) =>
            '<label class="opt-row" style="display:flex;align-items:center;gap:10px;padding:12px 14px;border:1.5px solid '+(answers[current]===i?'var(--gold)':'var(--border)')+';border-radius:8px;cursor:pointer;background:'+(answers[current]===i?'rgba(201,169,110,.08)':'var(--white)')+'">'+
              '<input type="radio" name="opt" value="'+i+'" '+(answers[current]===i?'checked':'')+'/>'+
              '<span style="font-size:14px">'+escapeHtml(o)+'</span>'+
            '</label>'
          ).join('')+
        '</div>';
      body.querySelectorAll('input[name="opt"]').forEach(r => r.onchange = () => { answers[current] = Number(r.value); renderQ(); });
      ov.querySelector('#prev-q').disabled = current === 0;
      ov.querySelector('#next-q').textContent = current === quiz.questions.length - 1 ? 'Submit ✓' : 'Next →';
    }

    ov.querySelector('.modal-cancel').onclick = () => ov.remove();
    ov.querySelector('#prev-q').onclick = () => { if (current > 0) { current--; renderQ(); } };
    ov.querySelector('#next-q').onclick = async () => {
      if (current < quiz.questions.length - 1) { current++; renderQ(); return; }
      if (answers.some(a => a === null)) {
        if (!confirm('You have unanswered questions. Submit anyway?')) return;
      }
      try {
        const result = await api.post('/quizzes/'+quiz._id+'/submit', { answers: answers.map(a => a === null ? -1 : a) });
        ov.remove(); showResult(quiz, result.data);
      } catch (e) { toast.error(e.message); }
    };
    renderQ();
  }

  function showResult(quiz, res) {
    const pass = res.passed;
    const ov = modal.show('Result · ' + quiz.title,
      '<div style="text-align:center;padding:20px 0 24px">'+
        '<div style="font-size:54px;margin-bottom:6px">'+(pass?'🎉':'💪')+'</div>'+
        '<div style="font-size:32px;font-weight:600;color:'+(pass?'var(--success)':'var(--warning)')+'">'+res.score+'%</div>'+
        '<div style="font-size:13px;color:var(--text-2);margin-top:6px">'+res.correct+' of '+res.total+' correct · pass mark '+res.passingScore+'%</div>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:10px">'+
        res.review.map((q, i) =>
          '<div style="padding:12px 14px;border-left:3px solid '+(q.isRight?'var(--success)':'var(--danger)')+';background:'+(q.isRight?'var(--success-lt)':'var(--danger-lt)')+';border-radius:6px">'+
            '<div style="font-size:13px;font-weight:500;margin-bottom:4px">'+(i+1)+'. '+escapeHtml(q.prompt)+'</div>'+
            '<div style="font-size:12.5px;color:var(--text-2)">'+
              'Your answer: <b>'+(q.chosen >= 0 ? escapeHtml(q.options[q.chosen]||'') : '—')+'</b>'+
              (q.isRight ? '' : ' · Correct: <b>'+escapeHtml(q.options[q.correctIndex]||'')+'</b>') +
            '</div>'+
            (q.explanation ? '<div style="font-size:12px;color:var(--text-3);margin-top:6px;font-style:italic">'+escapeHtml(q.explanation)+'</div>' : '') +
          '</div>'
        ).join('')+
      '</div>',
      '<button class="btn btn-secondary modal-cancel">Close</button>'+
      '<button class="btn btn-primary" id="retry">Retry</button>'
    );
    ov.querySelector('.modal-cancel').onclick = () => { ov.remove(); render(); };
    ov.querySelector('#retry').onclick = async () => {
      ov.remove();
      const r2 = await api.get('/quizzes/'+quiz._id);
      startQuiz(r2.data);
    };
  }

  render();
});
