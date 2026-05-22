window.router = (function(){
  const routes = {};
  return {
    register(name, fn){ routes[name] = fn; },
    go(page, params={}){
      store.set('page', page);
      const label = page.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
      document.getElementById('page-title').textContent = label;
      document.querySelectorAll('.nav-item').forEach(el =>
        el.classList.toggle('active', el.dataset.page === page)
      );
      const el = document.getElementById('page-content');
      el.innerHTML = '<div style="padding:40px 0;display:flex;justify-content:center"><div class="loading-grid" style="width:100%;max-width:900px">' +
        Array(4).fill('<div class="loading-card"><div class="skeleton" style="width:40px;height:40px;margin-bottom:14px;border-radius:10px"></div><div class="skeleton" style="width:50%;height:10px;margin-bottom:8px"></div><div class="skeleton" style="width:70%;height:26px;margin-bottom:6px"></div><div class="skeleton" style="width:40%;height:10px"></div></div>').join('') +
        '</div></div>';
      if (routes[page]) routes[page](el, params);
      else el.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><h3>Page not found</h3><p>This page does not exist.</p></div>';
    },
  };
})();
