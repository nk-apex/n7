import axios from 'axios';

const PANEL_URL = 'https://panel.xwolf.space';
const API_KEY   = 'ptla_Qb6eV2z1t3Zp7plXkWJ0YtcYEesQ94cBZzfNDu4oK13';

const api = axios.create({
  baseURL: `${PANEL_URL}/api/application`,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    Accept:        'application/json',
    'Content-Type':'application/json'
  },
  timeout: 20000
});

async function fetchAllPages(endpoint) {
  const items = [];
  let page = 1;
  while (true) {
    const res = await api.get(endpoint, { params: { per_page: 100, page } });
    items.push(...(res.data.data || []));
    const meta = res.data.meta?.pagination;
    if (!meta || page >= meta.total_pages) break;
    page++;
  }
  return items;
}

export async function listServers() {
  const raw = await fetchAllPages('/servers');
  return raw.map(s => ({
    id:         s.attributes.id,
    name:       s.attributes.name,
    identifier: s.attributes.identifier,
    user:       s.attributes.user,
    suspended:  s.attributes.suspended
  }));
}

export async function deleteServer(id) {
  await api.delete(`/servers/${id}`);
}

export async function listUsers() {
  const raw = await fetchAllPages('/users');
  return raw.map(u => ({
    id:         u.attributes.id,
    username:   u.attributes.username,
    email:      u.attributes.email,
    root_admin: u.attributes.root_admin
  }));
}

export async function deleteUser(id) {
  await api.delete(`/users/${id}`);
}
