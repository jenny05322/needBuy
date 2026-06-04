const LS_KEY = 'jenny_script_url';

function saveUrl() {
  const val = document.getElementById('urlInput').value.trim();
  if (!val) { showStatus('請輸入網址', 'err'); return; }
  if (!val.startsWith('https://script.google.com/')) {
    showStatus('網址格式不正確，請貼上 Apps Script 的部署網址', 'err'); return;
  }
  localStorage.setItem(LS_KEY, val);
  document.getElementById('urlInput').classList.add('saved');
  showStatus('✅ 已儲存！正在測試連線…', 'info');
  loadStats(val);
}

function clearUrl() {
  localStorage.removeItem(LS_KEY);
  document.getElementById('urlInput').value = '';
  document.getElementById('urlInput').classList.remove('saved');
  showStatus('已清除設定', 'info');
  document.getElementById('statProducts').innerHTML = dots();
  document.getElementById('statShops').innerHTML    = dots();
}

function dots() {
  return '<span class="loading-dots"><span></span><span></span><span></span></span>';
}

function showStatus(msg, type) {
  const el = document.getElementById('urlStatus');
  el.textContent = msg;
  el.className = 'url-status ' + type;
}

async function fetchCount(url, sheet) {
  try {
    const res  = await fetch(`${url}?sheet=${sheet}&action=list`);
    const data = await res.json();
    return Array.isArray(data) ? data.length : '—';
  } catch { return '—'; }
}

async function loadStats(url) {
  url = url || localStorage.getItem(LS_KEY) || '';
  if (!url) {
    document.getElementById('statProducts').textContent = '—';
    document.getElementById('statShops').textContent    = '—';
    return;
  }
  const [pc, sc] = await Promise.all([
    fetchCount(url, 'Products'),
    fetchCount(url, 'Shops'),
  ]);
  document.getElementById('statProducts').textContent = pc + ' 筆';
  document.getElementById('statShops').textContent    = sc + ' 間';
  if (pc !== '—') showStatus('✅ 連線成功', 'ok');
  else            showStatus('❌ 連線失敗，請確認網址是否正確', 'err');
}

// 初始化
const saved = localStorage.getItem(LS_KEY) || '';
if (saved) {
  document.getElementById('urlInput').value = saved;
  document.getElementById('urlInput').classList.add('saved');
  showStatus('✅ 已設定', 'ok');
}
loadStats();
