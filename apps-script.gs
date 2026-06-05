// ══════════════════════════════════════════════════════
// 物品使用心得 + 商店口袋名單 — Google Apps Script
// 使用方式：
//   1. 開啟 Google Sheets → 擴充功能 → Apps Script
//   2. 把這整段程式碼貼上去（取代原本的內容）
//   3. 點選「部署」→「新增部署作業」（若已部署請選「管理部署作業」→ 編輯 → 新增版本）
//   4. 類型選「網頁應用程式」
//   5. 執行身分：我 / 存取權：所有人
//   6. 點「部署」，複製產生的網址貼到網頁中
//
//   頁籤對應：
//     products.html → sheet=Products
//     shops.html    → sheet=Shops
// ══════════════════════════════════════════════════════

const SHEET_CONFIGS = {
  Products: ['id','name','brand','country','shop','currency','price','review','tags','img','rating'],
  Shops:   ['id','name','type','country','city','address','url','note','img','rating'],
};

function doGet(e) {
  try {
    const sheetName = e.parameter.sheet || 'Records';
    const headers   = SHEET_CONFIGS[sheetName];
    if (!headers) return respond({ error: 'unknown sheet: ' + sheetName });

    const action = e.parameter.action || 'list';

    if (action === 'list') {
      return respond(listAll(sheetName, headers));
    }

    const lock = LockService.getScriptLock();
    lock.tryLock(10000);
    try {
      if (action === 'save') {
        const record = {};
        headers.forEach(h => { record[h] = e.parameter[h] !== undefined ? e.parameter[h] : ''; });
        upsert(sheetName, headers, record);
        return respond({ ok: true });
      }
      if (action === 'delete') {
        remove(sheetName, headers, e.parameter.id);
        return respond({ ok: true });
      }
    } finally {
      lock.releaseLock();
    }

    return respond({ error: 'unknown action' });
  } catch(err) {
    return respond({ error: err.message });
  }
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(sheetName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function listAll(sheetName, headers) {
  const sheet = getSheet(sheetName, headers);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? String(row[i]) : ''; });
    return obj;
  });
}

function upsert(sheetName, headers, record) {
  const sheet = getSheet(sheetName, headers);
  const data  = sheet.getDataRange().getValues();
  const idCol = headers.indexOf('id');
  const rowData = headers.map(h => record[h] !== undefined ? record[h] : '');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(record.id)) {
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([rowData]);
      return;
    }
  }
  sheet.appendRow(rowData);
}

function remove(sheetName, headers, id) {
  const sheet = getSheet(sheetName, headers);
  const data  = sheet.getDataRange().getValues();
  const idCol = headers.indexOf('id');
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][idCol]) === String(id)) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}
