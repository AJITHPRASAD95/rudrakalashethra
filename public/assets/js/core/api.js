// API_BASE is empty string = same origin as the page.
// Works for both local (http://localhost:5000) and any hosted domain.
const API_BASE = '';

const req = async (method, path, body, isForm = false) => {
  const token = localStorage.getItem('ds_token');
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  if (!isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(API_BASE + '/api/v1' + path, {
    method,
    headers,
    body: isForm ? body : (body ? JSON.stringify(body) : undefined),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed (' + res.status + ')');
  return data;
};

window.api = {
  get:    (p)              => req('GET',    p),
  post:   (p, b)           => req('POST',   p, b),
  put:    (p, b)           => req('PUT',    p, b),
  del:    (p)              => req('DELETE', p),
  upload: (p, fd, method)  => req(method || 'POST', p, fd, true),
};
