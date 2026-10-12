/* ═══════════════════════════════════════════════════════════════════════════
   AcademAI: quản lý giao diện (theme) "night" (ban đêm) và "light" (ban ngày).
   - Nạp ở <head> để đặt data-theme ngay từ đầu, tránh nháy sai màu khi tải trang.
   - Lưu lựa chọn trong localStorage ("academai.theme"), dùng được cả khi chưa đăng nhập.
   - Phát sự kiện "academai:theme" để background.js đổi nền (sao / mây nắng).
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  const KEY = "academai.theme";
  const THEMES = ["night", "light"];
  const root = document.documentElement;

  function read() {
    try {
      const v = localStorage.getItem(KEY);
      if (THEMES.includes(v)) return v;
    } catch (e) {}
    return "night";
  }

  let cur = read();

  const SUN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"></circle><path d="M12 2v2.2M12 19.8V22M4.93 4.93l1.55 1.55M17.52 17.52l1.55 1.55M2 12h2.2M19.8 12H22M4.93 19.07l1.55-1.55M17.52 6.48l1.55-1.55"></path></svg>';
  const MOON = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path></svg>';

  const LABEL = {
    vi: { toLight: "Chuyển sang giao diện ban ngày (mây và nắng)", toNight: "Chuyển sang giao diện ban đêm (sao và tinh vân)" },
    en: { toLight: "Switch to the light theme (clouds & sunshine)", toNight: "Switch to the night theme (stars & nebula)" }
  };

  function labelFor(lang) {
    const L = LABEL[lang] || LABEL.vi;
    return cur === "night" ? L.toLight : L.toNight;
  }

  // Nút chuyển nhanh ở thanh đầu trang: đang đêm -> hiện mặt trời, đang sáng -> hiện mặt trăng
  function toggleHtml(lang) {
    const t = labelFor(lang);
    return `<button type="button" class="theme-toggle" data-theme-toggle aria-label="${t}" title="${t}">${cur === "night" ? SUN : MOON}</button>`;
  }

  function paint() {
    root.setAttribute("data-theme", cur);
    root.style.colorScheme = cur === "light" ? "light" : "dark";
    document.querySelectorAll("[data-theme-toggle]").forEach((b) => {
      const lang = (typeof S !== "undefined" && S && S.lang) || "vi"; // S là const toàn cục của app.js (không nằm trên window)
      const t = labelFor(lang);
      b.innerHTML = cur === "night" ? SUN : MOON;
      b.setAttribute("aria-label", t);
      b.title = t;
    });
    document.querySelectorAll("[data-theme-set]").forEach((el) => {
      const on = el.dataset.themeSet === cur;
      el.classList.toggle("on", on);
      el.setAttribute("aria-checked", on ? "true" : "false");
    });
  }

  function set(next) {
    if (!THEMES.includes(next) || next === cur) return;
    cur = next;
    try { localStorage.setItem(KEY, cur); } catch (e) {}
    paint();
    window.dispatchEvent(new CustomEvent("academai:theme", { detail: cur }));
  }

  window.AcademTheme = {
    get: () => cur,
    set,
    toggle: () => set(cur === "night" ? "light" : "night"),
    toggleHtml
  };

  paint();

  // Pha capture: chạy trước các handler click trong app.js / settings.js
  document.addEventListener("click", (e) => {
    const tg = e.target;
    if (!(tg instanceof Element)) return;
    let el;
    if ((el = tg.closest("[data-theme-toggle]"))) {
      e.stopPropagation();
      window.AcademTheme.toggle();
      return;
    }
    if ((el = tg.closest("[data-theme-set]"))) {
      e.stopPropagation();
      set(el.dataset.themeSet);
    }
  }, true);
})();
