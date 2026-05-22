(function(){
  const stack = () => document.getElementById('toast-stack');
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  window.toast = {
    show(msg, type=''){
      const el = document.createElement('div');
      el.className = 'toast' + (type ? ' toast-'+type : '');
      el.innerHTML = (icons[type] ? '<span style="font-size:14px;font-weight:700">'+icons[type]+'</span>' : '') + '<span>'+msg+'</span>';
      stack().appendChild(el);
      setTimeout(() => { el.style.opacity='0'; el.style.transform='translateX(20px)'; el.style.transition='all .2s'; setTimeout(()=>el.remove(),200); }, 3200);
    },
    success: m => window.toast.show(m,'success'),
    error:   m => window.toast.show(m,'error'),
    info:    m => window.toast.show(m,'info'),
  };
})();
