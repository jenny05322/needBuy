const LS_KEY = "jenny_script_url";

function esc(s) {
    return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

async function apiFetch(sheet, params) {
    const scriptUrl = localStorage.getItem(LS_KEY) || "";
    const url = scriptUrl + "?" + new URLSearchParams({ sheet, ...params }).toString();
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.error) throw new Error(data.error);
    if (params.action !== "list" && !data.ok)
        throw new Error("操作未完成，請確認 Apps Script 已重新部署");
    return data;
}

function setLoading(on, text) {
    document.getElementById("loadingOverlay").classList.toggle("active", on);
    if (text) document.getElementById("loadingText").textContent = text;
}

let _toastTimer;
function showToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
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

function setStar(v) {
    currentStar = v;
    renderStars();
}
function renderStars() {
    document
        .querySelectorAll("#starInput span")
        .forEach((s) => s.classList.toggle("on", parseInt(s.dataset.v) <= currentStar));
}
