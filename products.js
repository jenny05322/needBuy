const SHEET = 'Products';
let records     = [];
let editId      = null;
let currentStar = 0;

async function init() {
  if (!localStorage.getItem(LS_KEY)) { showSetupBanner(true); return; }
  showSetupBanner(false);
  setLoading(true, '從 Google Sheets 載入中…');
  try {
    records = await apiFetch(SHEET, { action: 'list' });
    updateCountryFilter();
    renderCards();
  } catch (e) {
    showToast('❌ 載入失敗：' + e.message);
  } finally {
    setLoading(false);
  }
}

function renderCards() {
  const q  = document.getElementById('searchInput').value.toLowerCase();
  const cf = document.getElementById('countryFilter').value;
  const rf = parseInt(document.getElementById('ratingFilter').value) || 0;

  const filtered = records.filter(r => {
    const text = [r.name, r.brand, r.country, r.shop, r.review, r.tags].join(' ').toLowerCase();
    return (!q || text.includes(q)) && (!cf || r.country === cf) && (!rf || (r.rating || 0) >= rf);
  });

  document.getElementById('statsText').textContent = `共 ${filtered.length} / ${records.length} 筆`;
  const grid = document.getElementById('cardGrid');

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><div class="icon">📭</div><div>${records.length ? '找不到符合的記錄' : '尚無記錄，點擊右上角新增！'}</div></div>`;
    return;
  }

  grid.innerHTML = filtered.map(r => {
    const stars = Array.from({ length: 5 }, (_, i) =>
      `<span class="star ${i < (r.rating || 0) ? '' : 'empty'}">★</span>`).join('');
    const imgHtml = r.img
      ? `<div class="card-img"><img src="${esc(r.img)}" onerror="this.parentElement.innerHTML='📷'" alt="${esc(r.name)}"></div>`
      : `<div class="card-img">📷</div>`;
    const tagsHtml = r.tags ? r.tags.split(',').map(t => t.trim()).filter(Boolean)
      .map(t => `<span class="tag" style="background:#f9f0ff;color:#722ed1">${esc(t)}</span>`).join('') : '';
    const price = r.price ? `${r.currency ? esc(r.currency) + ' ' : ''}${esc(r.price)}` : '';
    return `
    <div class="card">
      ${imgHtml}
      <div class="card-body">
        <div class="card-title">${esc(r.name)}</div>
        ${r.brand ? `<div style="font-size:.82rem;color:#888;">🏷️ ${esc(r.brand)}</div>` : ''}
        <div class="tag-row">
          ${r.country ? `<span class="tag tag-country">🌍 ${esc(r.country)}</span>` : ''}
          ${r.shop    ? `<span class="tag tag-shop">🏪 ${esc(r.shop)}</span>` : ''}
          ${price     ? `<span class="tag tag-price">💰 ${price}</span>` : ''}
        </div>
        <div class="stars">${stars}</div>
        <div class="card-review">${esc(r.review)}</div>
        ${tagsHtml ? `<div class="tag-row">${tagsHtml}</div>` : ''}
      </div>
      <div class="card-actions">
        <button class="btn-edit-card" onclick="openEditModal('${r.id}')">編輯</button>
        <button class="btn-del-card"  onclick="deleteRecord('${r.id}')">刪除</button>
      </div>
    </div>`;
  }).join('');
}

function updateCountryFilter() {
  const sel = document.getElementById('countryFilter');
  const cur = sel.value;
  const countries = [...new Set(records.map(r => r.country).filter(Boolean))].sort();
  sel.innerHTML = '<option value="">所有國家</option>' +
    countries.map(c => `<option value="${esc(c)}" ${c === cur ? 'selected' : ''}>${esc(c)}</option>`).join('');
  document.getElementById('countryList').innerHTML = countries.map(c => `<option value="${esc(c)}">`).join('');
}

function openAddModal() {
  editId = null; currentStar = 0;
  document.getElementById('formTitle').textContent = '新增記錄';
  ['fName', 'fBrand', 'fCountry', 'fShop', 'fCurrency', 'fPrice', 'fReview', 'fTags', 'fImgUrl']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('imgPreview').style.display = 'none';
  renderStars();
  document.getElementById('formOverlay').classList.add('active');
}

function openEditModal(id) {
  const r = records.find(x => x.id === id);
  if (!r) return;
  editId = id; currentStar = Number(r.rating) || 0;
  document.getElementById('formTitle').textContent    = '編輯記錄';
  document.getElementById('fName').value     = r.name     || '';
  document.getElementById('fBrand').value    = r.brand    || '';
  document.getElementById('fCountry').value  = r.country  || '';
  document.getElementById('fShop').value     = r.shop     || '';
  document.getElementById('fCurrency').value = r.currency || '';
  document.getElementById('fPrice').value    = r.price    || '';
  document.getElementById('fReview').value   = r.review   || '';
  document.getElementById('fTags').value     = r.tags     || '';
  document.getElementById('fImgUrl').value   = r.img      || '';
  const prev = document.getElementById('imgPreview');
  if (r.img) { prev.src = r.img; prev.style.display = 'block'; }
  else { prev.style.display = 'none'; }
  renderStars();
  document.getElementById('formOverlay').classList.add('active');
}

function closeFormModal() { document.getElementById('formOverlay').classList.remove('active'); }

async function saveRecord() {
  const name = document.getElementById('fName').value.trim();
  if (!name) { alert('請輸入商品名稱'); return; }

  const data = {
    name,
    brand    : document.getElementById('fBrand').value.trim(),
    country  : document.getElementById('fCountry').value.trim(),
    shop     : document.getElementById('fShop').value.trim(),
    currency : document.getElementById('fCurrency').value.trim(),
    price    : document.getElementById('fPrice').value.trim(),
    review   : document.getElementById('fReview').value.trim(),
    tags     : document.getElementById('fTags').value.trim(),
    img      : document.getElementById('fImgUrl').value.trim(),
    rating   : currentStar,
  };

  let record;
  if (editId) {
    const idx = records.findIndex(r => r.id === editId);
    records[idx] = record = { ...records[idx], ...data };
  } else {
    record = { id: Date.now().toString(36) + Math.random().toString(36).slice(2), ...data };
    records.unshift(record);
  }

  document.getElementById('saveBtn').disabled = true;
  setLoading(true, '儲存到 Google Sheets…');
  try {
    await apiFetch(SHEET, { action: 'save', ...record });
    showToast('✅ 已儲存');
  } catch (e) {
    showToast('❌ 儲存失敗：' + e.message);
  }
  setLoading(false);
  document.getElementById('saveBtn').disabled = false;
  updateCountryFilter();
  renderCards();
  closeFormModal();
}

async function deleteRecord(id) {
  const r = records.find(x => x.id === id);
  if (!r || !confirm(`確定要刪除「${r.name}」嗎？`)) return;
  records = records.filter(x => x.id !== id);
  renderCards();
  setLoading(true, '刪除中…');
  try {
    await apiFetch(SHEET, { action: 'delete', id });
    showToast('🗑️ 已刪除');
  } catch (e) {
    showToast('❌ 刪除失敗：' + e.message);
    records.splice(0, 0, r);
    renderCards();
  }
  setLoading(false);
  updateCountryFilter();
}

document.getElementById('formOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeFormModal();
});

init();
