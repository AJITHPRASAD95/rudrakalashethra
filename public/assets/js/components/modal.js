window.modal = {
  show(title, bodyHTML, footerHTML=''){
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.innerHTML =
      '<div class="modal">'+
        '<div class="modal-header">'+
          '<h3 class="modal-title">'+title+'</h3>'+
          '<button class="modal-close"><svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>'+
        '</div>'+
        '<div class="modal-body">'+bodyHTML+'</div>'+
        (footerHTML ? '<div class="modal-footer">'+footerHTML+'</div>' : '')+
      '</div>';
    ov.querySelector('.modal-close').onclick = () => ov.remove();
    ov.addEventListener('click', e => { if(e.target===ov) ov.remove(); });
    document.body.appendChild(ov);
    setTimeout(() => ov.querySelector('.modal').querySelector('input, select, textarea') && ov.querySelector('.modal').querySelector('input, select, textarea').focus(), 50);
    return ov;
  },
  confirm(msg, onYes, danger=true){
    const ov = window.modal.show('Confirm Action',
      '<p style="color:var(--text-2);font-size:14px;line-height:1.6">'+msg+'</p>',
      '<button class="btn btn-secondary modal-cancel">Cancel</button>'+
      '<button class="btn '+(danger?'btn-danger':'btn-primary')+' modal-confirm">Confirm</button>'
    );
    ov.querySelector('.modal-cancel').onclick  = () => ov.remove();
    ov.querySelector('.modal-confirm').onclick = () => { ov.remove(); onYes(); };
  },
};
