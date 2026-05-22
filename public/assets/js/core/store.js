window.store = (function(){
  let s = { user:null, token:localStorage.getItem('ds_token'), page:'dashboard' };
  const ls = [];
  return {
    get: k => s[k],
    set(k,v){ s[k]=v; ls.forEach(fn=>fn(s)); },
    subscribe: fn => ls.push(fn),
    isAuth: () => !!s.token,
  };
})();
