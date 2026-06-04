# ✈️ Jenny's 旅遊清單

記錄旅途中購買的好物與想去的商店，資料儲存於 Google Sheets。

## 功能

### 🛍️ 物品使用心得
- 新增、編輯、刪除購物記錄
- 欄位：商品名稱、品牌、國家、購買點、幣別、價格、評分、圖片、使用心得、標籤
- 依國家、評分篩選，全文搜尋

### 🗺️ 商店口袋名單
- 記錄想去或已去的商店
- 欄位：商店名稱、類型、國家、城市、地址、地圖連結、狀態、評分、備註
- 依類型、國家、狀態篩選，全文搜尋

## 檔案結構

```
├── index.html        # 首頁 Dashboard（含 Apps Script 設定）
├── index.css         # 首頁樣式
├── index.js          # 首頁邏輯
│
├── products.html     # 物品使用心得頁面
├── shops.html        # 商店口袋名單頁面
│
├── style.css         # 共用樣式（物品 & 商店頁）
├── common.js         # 共用函式（apiFetch、esc、toast 等）
├── products.js       # 物品頁邏輯
├── shops.js          # 商店頁邏輯
│
└── apps-script.gs    # Google Apps Script 後端程式碼
```

## 使用方式

### 1. 建立 Google Sheets + Apps Script

1. 開啟 [Google Sheets](https://sheets.google.com) 建立新試算表
2. 點選選單：**擴充功能 → Apps Script**
3. 將 `apps-script.gs` 的內容全部貼上（取代原本的程式碼）
4. 點選**部署 → 新增部署作業**
   - 類型選「**網頁應用程式**」
   - 執行身分：**我**
   - 存取權：**所有人**
5. 點「部署」，複製產生的網址

> 首次執行需要授權存取 Google Sheets，請點「授權存取」並完成驗證。

### 2. 設定網址

1. 開啟 `index.html`
2. 在「⚙️ Apps Script 設定」貼上剛才複製的網址
3. 點「儲存」，出現「✅ 連線成功」即設定完成
4. 網址會存在瀏覽器的 `localStorage`，之後開啟不需重新設定

### 3. 開始使用

- 從 `index.html` 首頁進入各功能頁面
- 右上角按「＋ 新增」按鈕新增資料
- 資料即時同步至 Google Sheets 對應頁籤：
  - 物品記錄 → `Products` 頁籤
  - 商店名單 → `Shops` 頁籤

## 技術說明

- 純前端 HTML / CSS / JS，無需任何框架或打包工具
- 後端使用 Google Apps Script 作為 API，透過 GET 請求讀寫 Google Sheets
- 使用 CSS 自訂變數（`--color-primary`、`--header-bg` 等）管理各頁面主題色
