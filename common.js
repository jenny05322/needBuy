const LS_KEY = "jenny_script_url";

// Cached so apiFetch doesn't hit localStorage on every call.
// Updated by index.js when the user saves a new URL.
let _scriptUrl = localStorage.getItem(LS_KEY) || "";

function esc(s) {
    return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

async function apiFetch(sheet, params) {
    const url = _scriptUrl + "?" + new URLSearchParams({ sheet, ...params }).toString();
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.error) throw new Error(data.error);
    if (params.action !== "list" && !data.ok)
        throw new Error("操作未完成，請確認 Apps Script 已重新部署");
    return data;
}

// ── Filter helpers ────────────────────────────────────
// Rebuild a <select> preserving the current selection.
function populateSelect(sel, values, allLabel) {
    const cur = sel.value;
    sel.innerHTML =
        `<option value="">${allLabel}</option>` +
        values
            .map(
                (v) =>
                    `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${esc(v)}</option>`,
            )
            .join("");
}

// Populate a <datalist> for autocomplete suggestions.
function populateDatalist(id, values) {
    document.getElementById(id).innerHTML = values
        .map((v) => `<option value="${esc(v)}">`)
        .join("");
}

// ── UI helpers ────────────────────────────────────────
function setLoading(on, text) {
    document.getElementById("loadingOverlay").classList.toggle("active", on);
    if (text) document.getElementById("loadingText").textContent = text;
}

let _toastTimer;
function showToast(msg) {
    const t = document.getElementById("toast");
    t.innerHTML = msg;
    t.classList.add("show");
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => t.classList.remove("show"), 2500);
}

function showSetupBanner(show) {
    document.getElementById("setupBanner").style.display = show ? "flex" : "none";
    document.getElementById("toolbar").style.display = show ? "none" : "flex";
    document.getElementById("cardGrid").style.display = show ? "none" : "grid";
    document.getElementById("addBtn").style.display = show ? "none" : "";
}

function handleUrlInput(url) {
    const prev = document.getElementById("imgPreview");
    if (url) {
        prev.src = url;
        prev.style.display = "block";
    } else {
        prev.style.display = "none";
    }
}

// ── Star rating ───────────────────────────────────────
// Call once after the modal HTML is in the DOM to stamp the SVG.
function initStars() {
    document.querySelectorAll("#starInput span").forEach((s) => {
        s.innerHTML = ICONS.starSolid(24);
    });
}

function setStar(v) {
    currentStar = v;
    renderStars();
}

// Only toggles the active class — SVG content is set once by initStars().
function renderStars() {
    document
        .querySelectorAll("#starInput span")
        .forEach((s) => s.classList.toggle("on", parseInt(s.dataset.v) <= currentStar));
}
