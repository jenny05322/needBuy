const SHEET = "Shops";
let records = [];
let editId = null;
let currentStar = 0;

async function init() {
    if (!localStorage.getItem(LS_KEY)) {
        showSetupBanner(true);
        return;
    }
    showSetupBanner(false);
    setLoading(true, "從 Google Sheets 載入中…");
    try {
        records = await apiFetch(SHEET, { action: "list" });
        updateFilters();
        renderCards();
    } catch (e) {
        showToast("❌ 載入失敗：" + e.message);
    } finally {
        setLoading(false);
    }
}

function renderCards() {
    const q = document.getElementById("searchInput").value.toLowerCase();
    const tf = document.getElementById("typeFilter").value;
    const cf = document.getElementById("countryFilter").value;
    const sf = document.getElementById("statusFilter").value;

    const filtered = records.filter((r) => {
        const text = [r.name, r.type, r.country, r.city, r.address, r.note].join(" ").toLowerCase();
        return (
            (!q || text.includes(q)) &&
            (!tf || r.type === tf) &&
            (!cf || r.country === cf) &&
            (!sf || r.status === sf)
        );
    });

    document.getElementById("statsText").textContent =
        `共 ${filtered.length} / ${records.length} 間`;
    const grid = document.getElementById("cardGrid");

    if (!filtered.length) {
        grid.innerHTML = `<div class="empty-state"><div class="icon">🏪</div><div>${records.length ? "找不到符合的商店" : "尚無記錄，點擊右上角新增！"}</div></div>`;
        return;
    }

    grid.innerHTML = filtered
        .map((r) => {
            const isDone = r.status === "已去";
            const stars = Array.from(
                { length: 5 },
                (_, i) => `<span class="star ${i < (r.rating || 0) ? "" : "empty"}">★</span>`,
            ).join("");
            const imgHtml = r.img
                ? `<div class="card-img"><img src="${esc(r.img)}" onerror="this.parentElement.innerHTML='🏪'" alt="${esc(r.name)}"></div>`
                : `<div class="card-img">🏪</div>`;
            const linkHtml = r.url
                ? `<a class="card-link" href="${esc(r.url)}" target="_blank" rel="noopener">🔗 ${esc(r.url.replace(/^https?:\/\//, "").slice(0, 40))}${r.url.length > 47 ? "…" : ""}</a>`
                : "";
            return `
        <div class="card">
            ${imgHtml}
            <div class="card-body">
                <div class="card-title">${esc(r.name)}</div>
                <div class="tag-row">
                    ${r.status ? `<span class="tag ${isDone ? "tag-status-done" : "tag-status-want"}">${isDone ? "✅" : "🔖"} ${esc(r.status)}</span>` : ""}
                    ${r.type ? `<span class="tag tag-type">🏷️ ${esc(r.type)}</span>` : ""}
                </div>
                <div class="tag-row">
                    ${r.country ? `<span class="tag tag-country">🌍 ${esc(r.country)}</span>` : ""}
                    ${r.city ? `<span class="tag tag-city">🏙️ ${esc(r.city)}</span>` : ""}
                </div>
                ${r.address ? `<div style="font-size:.82rem;color:#888;">📍 ${esc(r.address)}</div>` : ""}
                <div class="stars">${stars}</div>
                ${r.note ? `<div class="card-note">${esc(r.note)}</div>` : ""}
                ${linkHtml}
            </div>
            <div class="card-actions">
                <button class="btn-edit-card" onclick="openEditModal('${r.id}')">編輯</button>
                <button class="btn-del-card"  onclick="deleteRecord('${r.id}')">刪除</button>
            </div>
        </div>`;
        })
        .join("");
}

function updateFilters() {
    const typeSel = document.getElementById("typeFilter");
    const countrySel = document.getElementById("countryFilter");
    const curType = typeSel.value;
    const curCountry = countrySel.value;
    const types = [...new Set(records.map((r) => r.type).filter(Boolean))].sort();
    const countries = [...new Set(records.map((r) => r.country).filter(Boolean))].sort();
    typeSel.innerHTML =
        '<option value="">所有類型</option>' +
        types
            .map(
                (t) =>
                    `<option value="${esc(t)}" ${t === curType ? "selected" : ""}>${esc(t)}</option>`,
            )
            .join("");
    countrySel.innerHTML =
        '<option value="">所有國家</option>' +
        countries
            .map(
                (c) =>
                    `<option value="${esc(c)}" ${c === curCountry ? "selected" : ""}>${esc(c)}</option>`,
            )
            .join("");
    document.getElementById("countryList").innerHTML = countries
        .map((c) => `<option value="${esc(c)}">`)
        .join("");
}

function openAddModal() {
    editId = null;
    currentStar = 0;
    document.getElementById("formTitle").textContent = "新增商店";
    ["fName", "fCity", "fAddress", "fUrl", "fNote", "fImgUrl"].forEach(
        (id) => (document.getElementById(id).value = ""),
    );
    document.getElementById("fType").value = "";
    document.getElementById("fStatus").value = "想去";
    document.getElementById("fCountry").value = "";
    document.getElementById("imgPreview").style.display = "none";
    renderStars();
    document.getElementById("formOverlay").classList.add("active");
}

function openEditModal(id) {
    const r = records.find((x) => x.id === id);
    if (!r) return;
    editId = id;
    currentStar = Number(r.rating) || 0;
    document.getElementById("formTitle").textContent = "編輯商店";
    document.getElementById("fName").value = r.name || "";
    document.getElementById("fType").value = r.type || "";
    document.getElementById("fCountry").value = r.country || "";
    document.getElementById("fCity").value = r.city || "";
    document.getElementById("fAddress").value = r.address || "";
    document.getElementById("fUrl").value = r.url || "";
    document.getElementById("fStatus").value = r.status || "想去";
    document.getElementById("fNote").value = r.note || "";
    document.getElementById("fImgUrl").value = r.img || "";
    const prev = document.getElementById("imgPreview");
    if (r.img) {
        prev.src = r.img;
        prev.style.display = "block";
    } else {
        prev.style.display = "none";
    }
    renderStars();
    document.getElementById("formOverlay").classList.add("active");
}

function closeFormModal() {
    document.getElementById("formOverlay").classList.remove("active");
}

async function saveRecord() {
    const name = document.getElementById("fName").value.trim();
    if (!name) {
        alert("請輸入商店名稱");
        return;
    }

    const data = {
        name,
        type: document.getElementById("fType").value,
        country: document.getElementById("fCountry").value.trim(),
        city: document.getElementById("fCity").value.trim(),
        address: document.getElementById("fAddress").value.trim(),
        url: document.getElementById("fUrl").value.trim(),
        status: document.getElementById("fStatus").value,
        note: document.getElementById("fNote").value.trim(),
        img: document.getElementById("fImgUrl").value.trim(),
        rating: currentStar,
    };

    let record;
    if (editId) {
        const idx = records.findIndex((r) => r.id === editId);
        records[idx] = record = { ...records[idx], ...data };
    } else {
        record = { id: Date.now().toString(36) + Math.random().toString(36).slice(2), ...data };
        records.unshift(record);
    }

    document.getElementById("saveBtn").disabled = true;
    setLoading(true, "儲存到 Google Sheets…");
    try {
        await apiFetch(SHEET, { action: "save", ...record });
        showToast("✅ 已儲存");
    } catch (e) {
        showToast("❌ 儲存失敗：" + e.message);
    }
    setLoading(false);
    document.getElementById("saveBtn").disabled = false;
    updateFilters();
    renderCards();
    closeFormModal();
}

async function deleteRecord(id) {
    const r = records.find((x) => x.id === id);
    if (!r || !confirm(`確定要刪除「${r.name}」嗎？`)) return;
    records = records.filter((x) => x.id !== id);
    renderCards();
    setLoading(true, "刪除中…");
    try {
        await apiFetch(SHEET, { action: "delete", id });
        showToast("🗑️ 已刪除");
    } catch (e) {
        showToast("❌ 刪除失敗：" + e.message);
        records.splice(0, 0, r);
        renderCards();
    }
    setLoading(false);
    updateFilters();
}

document.getElementById("formOverlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeFormModal();
});

init();
