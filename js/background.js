/**
 * AcademAI Background Engine v6 (2 theme: night / light)
 *
 * NIGHT  : nền vũ trụ + tinh vân là 2 ảnh PNG trong thư mục assets/ (nebula-pink.png, nebula-blue.png),
 *          sao đa sắc lấp lánh, thỉnh thoảng có sao chổi bay vụt qua với vệt đuôi dài mờ dần.
 * LIGHT  : bầu trời xanh, mặt trời có tia nắng xoay chậm, mây trôi nhiều tầng.
 *
 * Giữ nguyên các tối ưu hiệu năng của v5: sprite dựng sẵn, nền cache, giới hạn 60 FPS,
 * tự tạm dừng khi chuyển tab, hình học lục giác tính trước.
 * Đổi theme bằng window.AcademTheme (js/theme.js) -> sự kiện "academai:theme".
 */
(function() {
  // 3 lớp canvas chồng nhau để KHÔNG phải vẽ lại cả màn hình mỗi frame:
  //  1) bgCache  : nền tĩnh (tinh vân / bầu trời), chỉ vẽ khi đổi theme hoặc resize
  //  2) canvas   : sao, sao chổi, mặt trời, mây (~30 FPS, tự giảm nếu máy yếu)
  //  3) hexCanvas: lục giác 3D, chỉ vẽ lại đúng vùng quanh con trỏ chuột
  function makeLayer(id) {
    const c = document.createElement("canvas");
    c.id = id;
    c.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:0;";
    return c;
  }
  const bgCache = makeLayer("bg-canvas");
  const canvas = makeLayer("bg-canvas-fx");
  const hexCanvas = makeLayer("bg-canvas-hex");
  document.body.prepend(hexCanvas);
  document.body.prepend(canvas);
  document.body.prepend(bgCache);

  const bgCtx = bgCache.getContext("2d", { alpha: false });
  const ctx = canvas.getContext("2d");
  const hctx = hexCanvas.getContext("2d");
  let width = 0, height = 0, dpr = 1;

  let theme = (window.AcademTheme && window.AcademTheme.get()) || "night";

  const mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999, active: false };

  // ── LỤC GIÁC ──────────────────────────────────────────────
  const HEX_R = 76;
  const HEX_H = Math.sqrt(3) * HEX_R;
  let hexagons = [];
  let hexDirtyAll = true;

  const DRIFT_VX = -0.16;
  const DRIFT_VY = 0.045;

  let stars = [];

  const COS_60 = [1, 0.5, -0.5, -1, -0.5, 0.5];
  const SIN_60 = [0, 0.866025, 0.866025, 0, -0.866025, -0.866025];
  const SLANT_X = 0.04;
  const SLANT_Y = -0.025;

  const TOP_VX_OFF = new Float32Array(6);
  const TOP_VY_OFF = new Float32Array(6);
  const IN_VX_OFF = new Float32Array(6);
  const IN_VY_OFF = new Float32Array(6);

  for (let i = 0; i < 6; i++) {
    TOP_VX_OFF[i] = (HEX_R * COS_60[i]) + (COS_60[i] * SLANT_X) * HEX_R;
    TOP_VY_OFF[i] = (HEX_R * SIN_60[i] * 0.92) + (COS_60[i] * SLANT_Y) * HEX_R;

    const inR = HEX_R * 0.82;
    IN_VX_OFF[i] = (inR * COS_60[i]) + (COS_60[i] * SLANT_X) * inR;
    IN_VY_OFF[i] = (inR * SIN_60[i] * 0.92) + (COS_60[i] * SLANT_Y) * inR;
  }

  const curVx = new Float32Array(6);
  const curVy = new Float32Array(6);

  // Bảng màu lục giác theo theme
  const HEX_PAL = {
    night: {
      shadow: "rgba(0, 0, 0, 0.35)",
      side: ["", "rgba(7, 18, 56, 0.96)", "rgba(10, 26, 75, 0.95)", "rgba(4, 12, 42, 0.97)"],
      sideStroke: g => `rgba(56, 189, 248, ${0.30 + g * 0.40})`,
      hoverFill: g => `rgba(18, 48, 130, ${0.44 - g * 0.08})`,
      hoverStroke: g => `rgba(56, 189, 248, ${0.85 + g * 0.15})`,
      hoverInner: g => `rgba(147, 197, 253, ${0.50 + g * 0.35})`,
      restA: "rgba(8, 22, 68, 0.82)",
      restB: "rgba(14, 42, 115, 0.76)",
      restStroke: "rgba(56, 189, 248, 0.62)",
      restInner: "rgba(56, 189, 248, 0.30)",
      hl: "rgba(224, 242, 254, 0.70)",
      hlHover: "rgba(255, 255, 255, 0.90)"
    },
    light: {
      shadow: "rgba(30, 70, 130, 0.10)",
      side: ["", "rgba(185, 218, 250, 0.85)", "rgba(165, 204, 245, 0.85)", "rgba(140, 185, 236, 0.88)"],
      sideStroke: g => `rgba(37, 99, 235, ${0.22 + g * 0.28})`,
      hoverFill: g => `rgba(255, 255, 255, ${0.75 + g * 0.15})`,
      hoverStroke: g => `rgba(37, 99, 235, ${0.70 + g * 0.25})`,
      hoverInner: g => `rgba(59, 130, 246, ${0.35 + g * 0.30})`,
      restA: "rgba(255, 255, 255, 0.60)",
      restB: "rgba(215, 235, 255, 0.50)",
      restStroke: "rgba(37, 99, 235, 0.32)",
      restInner: "rgba(37, 99, 235, 0.16)",
      hl: "rgba(255, 255, 255, 0.90)",
      hlHover: "rgba(255, 255, 255, 1)"
    }
  };
  let P = HEX_PAL[theme];

  // ══════════════════════════════════════════════════════════════
  //  SPRITE SAO CHỮ THẬP (dựng sẵn, dùng cho cả sao lớn và sao nhỏ)
  // ══════════════════════════════════════════════════════════════
  const jewelSprites = {};
  const miniJewelSprites = {};
  const STAR_COLORS = { purple: "#c084fc", red: "#f87171", blue: "#38bdf8", white: "#ffffff" };

  function makeStarSprite(size, col, o) {
    const half = size / 2;
    const sCan = document.createElement("canvas");
    sCan.width = size;
    sCan.height = size;
    const sCtx = sCan.getContext("2d");

    const g = sCtx.createRadialGradient(half, half, 0, half, half, half * 0.75);
    g.addColorStop(0, col);
    g.addColorStop(0.35, col + o.a1);
    g.addColorStop(0.75, col + o.a2);
    g.addColorStop(1, "rgba(0,0,0,0)");
    sCtx.fillStyle = g;
    sCtx.beginPath();
    sCtx.arc(half, half, half * 0.75, 0, Math.PI * 2);
    sCtx.fill();

    const flareR = half * o.flare;

    const hGrd = sCtx.createLinearGradient(half - flareR, half, half + flareR, half);
    hGrd.addColorStop(0, "rgba(255,255,255,0)");
    hGrd.addColorStop(0.5, `rgba(255,255,255,${o.arm})`);
    hGrd.addColorStop(1, "rgba(255,255,255,0)");
    sCtx.fillStyle = hGrd;
    sCtx.beginPath();
    sCtx.moveTo(half - flareR, half);
    sCtx.lineTo(half, half - o.w);
    sCtx.lineTo(half + flareR, half);
    sCtx.lineTo(half, half + o.w);
    sCtx.closePath();
    sCtx.fill();

    const vGrd = sCtx.createLinearGradient(half, half - flareR, half, half + flareR);
    vGrd.addColorStop(0, "rgba(255,255,255,0)");
    vGrd.addColorStop(0.5, `rgba(255,255,255,${o.arm})`);
    vGrd.addColorStop(1, "rgba(255,255,255,0)");
    sCtx.fillStyle = vGrd;
    sCtx.beginPath();
    sCtx.moveTo(half, half - flareR);
    sCtx.lineTo(half + o.w, half);
    sCtx.lineTo(half, half + flareR);
    sCtx.lineTo(half - o.w, half);
    sCtx.closePath();
    sCtx.fill();

    sCtx.fillStyle = "#ffffff";
    sCtx.beginPath();
    sCtx.arc(half, half, o.core, 0, Math.PI * 2);
    sCtx.fill();

    return { canvas: sCan, half, size };
  }

  function createJewelSprites() {
    for (const [key, col] of Object.entries(STAR_COLORS)) {
      jewelSprites[key] = makeStarSprite(48, col, { a1: "66", a2: "15", flare: 0.85, arm: 0.95, w: 1.2, core: 2.2 });
      miniJewelSprites[key] = makeStarSprite(24, col, { a1: "55", a2: "12", flare: 0.82, arm: 0.90, w: 0.8, core: 1.2 });
    }
  }
  createJewelSprites();

  // ── RANH GIỚI VÙNG LỤC GIÁC ─────────────────────────────
  function isInsideCircledArea(cx, cy) {
    if (cy < 0.36 * height) return false;
    const t = (height - cy) / (0.64 * height);
    const xBound = (0.26 + t * 0.74) * width;
    return cx >= xBound - 35;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    hexCanvas.width = Math.floor(width * dpr);
    hexCanvas.height = Math.floor(height * dpr);
    hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bgCache.width = Math.floor(width * dpr);
    bgCache.height = Math.floor(height * dpr);
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    renderBackground();
    buildHexGrid();
    buildStars();
    buildSun();
    buildClouds();
  }

  function renderBackground() {
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bgCtx.globalAlpha = 1;
    bgCtx.globalCompositeOperation = "source-over";
    if (theme === "light") renderSkyBackground();
    else renderNightBackground();
  }

  // ══════════════════════════════════════════════════════════════
  //  NIGHT: NỀN VŨ TRỤ + TINH VÂN NGẪU NHIÊN TỪ 2 ẢNH CỦA BẠN
  // ══════════════════════════════════════════════════════════════
  // Ảnh 1: Tinh vân hồng tím phát sáng (nebula-1.png / nebula-pink.png)
  // Ảnh 2: Tinh vân xanh lam huyền ảo (nebula-2.jpg / nebula-blue.jpg)
  const NEBULA_SRC = {
    pink: "assets/nebula-1.png",
    blue: "assets/nebula-2.jpg"
  };
  const nebulaImg = {};
  let nebulaSettled = 0;

  function loadNebulaImages() {
    Object.entries(NEBULA_SRC).forEach(([key, src]) => {
      const im = new Image();
      const done = () => {
        nebulaSettled++;
        if (theme === "night" && width) renderBackground();
      };
      im.onload = () => {
        nebulaImg[key] = im;
        done();
      };
      im.onerror = () => {
        // Dự phòng đường dẫn phụ nếu cần
        const fallbackSrc = key === "blue" ? "assets/nebula-blue.jpg" : "assets/nebula-pink.png";
        if (src !== fallbackSrc) {
          const fb = new Image();
          fb.onload = () => { nebulaImg[key] = fb; done(); };
          fb.onerror = done;
          fb.src = fallbackSrc;
        } else {
          done();
        }
      };
      im.src = src;
    });
  }

  // Bố cục ngẫu nhiên tinh vân: mỗi lần load trang / đổi sang Dark Theme sẽ tự sinh ngẫu nhiên
  let currentNebulaLayout = [];

  function generateRandomNebulaLayout() {
    const rMode = Math.random();
    const layout = [];

    if (rMode < 0.38) {
      // ── KỊCH BẢN 1: TINH VÂN HỒNG TÍM CHỦ ĐẠO (Ảnh 1) ──
      const mainX = 0.32 + Math.random() * 0.36; // 0.32 -> 0.68
      const mainY = 0.34 + Math.random() * 0.26; // 0.34 -> 0.60
      layout.push({
        k: "pink",
        x: mainX,
        y: mainY,
        w: 0.72 + Math.random() * 0.22,
        r: Math.random() * Math.PI * 2,
        a: 0.95
      });
      // Cụm phụ nhỏ điểm xuyết
      layout.push({
        k: "pink",
        x: mainX > 0.5 ? 0.20 + Math.random() * 0.12 : 0.78 + Math.random() * 0.12,
        y: mainY > 0.45 ? 0.22 + Math.random() * 0.14 : 0.72 + Math.random() * 0.14,
        w: 0.38 + Math.random() * 0.16,
        r: Math.random() * Math.PI * 2,
        a: 0.70
      });

    } else if (rMode < 0.76) {
      // ── KỊCH BẢN 2: TINH VÂN XANH LAM CHỦ ĐẠO (Ảnh 2) ──
      const mainX = 0.34 + Math.random() * 0.32;
      const mainY = 0.36 + Math.random() * 0.26;
      layout.push({
        k: "blue",
        x: mainX,
        y: mainY,
        w: 0.88 + Math.random() * 0.26,
        r: Math.random() * Math.PI * 2,
        a: 0.92
      });
      // Vệt khí phụ phiêu lãng
      layout.push({
        k: "blue",
        x: mainX > 0.5 ? 0.18 + Math.random() * 0.14 : 0.80 + Math.random() * 0.12,
        y: mainY > 0.48 ? 0.24 + Math.random() * 0.15 : 0.74 + Math.random() * 0.14,
        w: 0.48 + Math.random() * 0.18,
        r: Math.random() * Math.PI * 2,
        a: 0.65
      });

    } else {
      // ── KỊCH BẢN 3: HÒA TRỘN CẢ HAI TINH VÂN (Ảnh 1 & Ảnh 2) ──
      // Tinh vân xanh lam làm nền khí sâu
      layout.push({
        k: "blue",
        x: 0.60 + Math.random() * 0.14,
        y: 0.58 + Math.random() * 0.14,
        w: 0.78 + Math.random() * 0.18,
        r: Math.random() * Math.PI * 2,
        a: 0.85
      });
      // Tinh vân hồng tím rực rỡ ở dải đối diện
      layout.push({
        k: "pink",
        x: 0.28 + Math.random() * 0.14,
        y: 0.32 + Math.random() * 0.14,
        w: 0.60 + Math.random() * 0.16,
        r: Math.random() * Math.PI * 2,
        a: 0.92
      });
    }

    return layout;
  }

  function drawImageNebulae() {
    if (!currentNebulaLayout || currentNebulaLayout.length === 0) {
      currentNebulaLayout = generateRandomNebulaLayout();
    }
    const M = Math.max(width, height);
    for (const L of currentNebulaLayout) {
      const im = nebulaImg[L.k] || nebulaImg[L.k === "pink" ? "blue" : "pink"];
      if (!im || !im.complete || !im.naturalWidth) continue;

      const w = L.w * M;
      const h = w * (im.naturalHeight / im.naturalWidth);

      bgCtx.save();
      bgCtx.translate(L.x * width, L.y * height);
      bgCtx.rotate(L.r);

      // Hòa trộn 'screen': Triệt tiêu 100% màu đen của ảnh JPG, giữ lại làn khói phát quang
      bgCtx.globalCompositeOperation = "screen";
      bgCtx.globalAlpha = L.a;
      bgCtx.drawImage(im, -w / 2, -h / 2, w, h);

      // Lớp phát quang bổ sung 'lighter': Làm lõi tinh vân sáng bừng lung linh
      bgCtx.globalCompositeOperation = "lighter";
      bgCtx.globalAlpha = L.a * 0.32;
      bgCtx.drawImage(im, -w / 2, -h / 2, w, h);

      bgCtx.restore();
    }
  }

  // Tinh vân vẽ tay: chỉ dùng khi không nạp được ảnh
  function drawProceduralNebulae() {
    bgCtx.save();
    bgCtx.globalCompositeOperation = "lighter";
    const nebulaLayers = [
      { xp: 0.30, yp: 0.32, r: 0.30, c: [120, 40, 180], a: 0.22 },
      { xp: 0.33, yp: 0.30, r: 0.24, c: [168, 85, 247], a: 0.25 },
      { xp: 0.28, yp: 0.35, r: 0.20, c: [217, 70, 239], a: 0.22 },
      { xp: 0.32, yp: 0.28, r: 0.16, c: [244, 114, 182], a: 0.20 },
      { xp: 0.31, yp: 0.31, r: 0.08, c: [255, 200, 220], a: 0.28 },
      { xp: 0.18, yp: 0.65, r: 0.28, c: [20, 80, 160], a: 0.20 },
      { xp: 0.20, yp: 0.62, r: 0.22, c: [14, 165, 233], a: 0.25 },
      { xp: 0.16, yp: 0.68, r: 0.19, c: [56, 189, 248], a: 0.22 },
      { xp: 0.19, yp: 0.64, r: 0.07, c: [200, 240, 255], a: 0.30 },
      { xp: 0.48, yp: 0.78, r: 0.25, c: [120, 20, 30], a: 0.18 },
      { xp: 0.46, yp: 0.75, r: 0.20, c: [220, 38, 38], a: 0.22 },
      { xp: 0.51, yp: 0.80, r: 0.17, c: [244, 63, 94], a: 0.20 },
      { xp: 0.52, yp: 0.18, r: 0.28, c: [70, 30, 120], a: 0.18 },
      { xp: 0.48, yp: 0.15, r: 0.22, c: [139, 92, 246], a: 0.24 },
      { xp: 0.55, yp: 0.22, r: 0.19, c: [56, 189, 248], a: 0.18 },
      { xp: 0.38, yp: 0.50, r: 0.32, c: [80, 40, 120], a: 0.10 }
    ];
    for (const n of nebulaLayers) {
      const nx = n.xp * width, ny = n.yp * height, nr = n.r * Math.max(width, height);
      const grd = bgCtx.createRadialGradient(nx, ny, nr * 0.08, nx, ny, nr);
      grd.addColorStop(0, `rgba(${n.c[0]}, ${n.c[1]}, ${n.c[2]}, ${n.a})`);
      grd.addColorStop(0.3, `rgba(${n.c[0]}, ${n.c[1]}, ${n.c[2]}, ${n.a * 0.65})`);
      grd.addColorStop(0.6, `rgba(${n.c[0]}, ${n.c[1]}, ${n.c[2]}, ${n.a * 0.25})`);
      grd.addColorStop(1, "rgba(0, 0, 0, 0)");
      bgCtx.fillStyle = grd;
      bgCtx.fillRect(0, 0, width, height);
    }
    bgCtx.restore();
  }

  function renderNightBackground() {
    bgCtx.fillStyle = "#010206";
    bgCtx.fillRect(0, 0, width, height);

    const baseGrd = bgCtx.createLinearGradient(0, 0, width, height);
    baseGrd.addColorStop(0, "#010206");
    baseGrd.addColorStop(0.35, "#030514");
    baseGrd.addColorStop(0.70, "#060720");
    baseGrd.addColorStop(1, "#020310");
    bgCtx.fillStyle = baseGrd;
    bgCtx.fillRect(0, 0, width, height);

    if (nebulaImg.pink || nebulaImg.blue) drawImageNebulae();
    else if (nebulaSettled >= 2) drawProceduralNebulae();

    // Làm tối 2 góc trái để chữ ở menu dễ đọc
    for (const cy of [0, height]) {
      const g = bgCtx.createRadialGradient(0, cy, 30, 0, cy, width * 0.55);
      g.addColorStop(0, "rgba(1, 2, 4, 0.92)");
      g.addColorStop(0.5, "rgba(2, 3, 8, 0.45)");
      g.addColorStop(1, "rgba(2, 3, 8, 0)");
      bgCtx.fillStyle = g;
      bgCtx.fillRect(0, 0, width, height);
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  NIGHT: sao
  // ══════════════════════════════════════════════════════════════
  function buildStars() {
    stars = [];
    const count = Math.floor(Math.max(180, (width * height) / 8500));

    for (let i = 0; i < count; i++) {
      const x = Math.random() * (width + 80) - 20;
      const y = Math.random() * (height + 80) - 20;

      const colorRand = Math.random();
      let category, color;
      if (colorRand < 0.27) { category = "purple"; color = "#c084fc"; }
      else if (colorRand < 0.54) { category = "red"; color = "#f87171"; }
      else if (colorRand < 0.81) { category = "blue"; color = "#38bdf8"; }
      else { category = "white"; color = "#ffffff"; }

      const sizeRand = Math.random();
      let type, baseR, speedMult;
      if (sizeRand > 0.90) {
        type = "jewel"; baseR = 2.4 + Math.random() * 1.0; speedMult = 0.65 + Math.random() * 0.35;
      } else if (sizeRand > 0.72) {
        type = "mini_jewel"; baseR = 1.2 + Math.random() * 0.4; speedMult = 0.30 + Math.random() * 0.20;
      } else if (sizeRand > 0.36) {
        type = "twinkle"; baseR = 1.3 + Math.random() * 0.6; speedMult = 0.48 + Math.random() * 0.30;
      } else {
        type = "micro"; baseR = 0.8 + Math.random() * 0.5; speedMult = 0.35 + Math.random() * 0.25;
      }

      stars.push({
        x, y, baseR, type, category, color, speedMult,
        twinkleSpeed: 0.0015 + Math.random() * 0.003,
        twinklePhase: Math.random() * Math.PI * 2,
        repelX: 0, repelY: 0,
        nextSparkleTime: 2000 + Math.random() * 32000,
        isSparkling: false, sparkleStart: 0, sparkleDuration: 0
      });
    }
  }

  function updateAndDrawStars(time, step = 1) {
    const mouseR = 190, mouseR2 = mouseR * mouseR;
    const hasMouse = mouse.active && mouse.x > 0;

    const batches = { purple: [], red: [], blue: [], white: [] };
    const jewels = [];
    const miniJewels = [];
    const sparklingFlairs = [];

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];

      s.x += DRIFT_VX * s.speedMult * step;
      s.y += DRIFT_VY * s.speedMult * step;

      if (s.x < -25) { s.x = width + 20; s.y = Math.random() * height; }
      if (s.y > height + 25) { s.y = -15; s.x = Math.random() * width; }

      if (hasMouse) {
        const curX = s.x + s.repelX, curY = s.y + s.repelY;
        const dx = curX - mouse.x, dy = curY - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < mouseR2 && d2 > 0) {
          const d = Math.sqrt(d2);
          const force = (1 - d / mouseR) * 65;
          s.repelX += (dx / d) * force * 0.22;
          s.repelY += (dy / d) * force * 0.22;
        }
      }
      s.repelX *= 0.88;
      s.repelY *= 0.88;

      const rx = s.x + s.repelX, ry = s.y + s.repelY;

      if (!s.isSparkling && time >= s.nextSparkleTime) {
        s.isSparkling = true;
        s.sparkleStart = time;
        s.sparkleDuration = 1800 + Math.random() * 1000;
        s.nextSparkleTime = time + s.sparkleDuration + 20000 + Math.random() * 25000;
      }

      let sparkle = 0;
      if (s.isSparkling) {
        const elapsed = time - s.sparkleStart;
        if (elapsed >= s.sparkleDuration) s.isSparkling = false;
        else sparkle = Math.sin((elapsed / s.sparkleDuration) * Math.PI);
      }

      if (s.type === "jewel") {
        jewels.push({ s, rx, ry, sparkle });
      } else if (s.type === "mini_jewel") {
        miniJewels.push({ s, rx, ry, sparkle });
      } else {
        if (sparkle > 0.05) sparklingFlairs.push({ s, rx, ry, sparkle });
        const tw = s.type === "twinkle" ? Math.sin(time * s.twinkleSpeed + s.twinklePhase) * 0.3 : 0;
        const curR = Math.max(0.6, s.baseR + tw * 0.4);
        batches[s.category].push({ x: rx, y: ry, r: curR });
      }
    }

    const batchColors = {
      purple: "rgba(192, 132, 252, 0.90)",
      red:    "rgba(248, 113, 113, 0.92)",
      blue:   "rgba(56, 189, 248, 0.92)",
      white:  "rgba(255, 255, 255, 0.94)"
    };
    for (const cat of ["purple", "red", "blue", "white"]) {
      const b = batches[cat];
      if (b.length === 0) continue;
      ctx.beginPath();
      for (let k = 0; k < b.length; k++) {
        ctx.moveTo(b[k].x + b[k].r, b[k].y);
        ctx.arc(b[k].x, b[k].y, b[k].r, 0, Math.PI * 2);
      }
      ctx.fillStyle = batchColors[cat];
      ctx.fill();
    }

    for (let m = 0; m < miniJewels.length; m++) {
      const { s, rx, ry, sparkle } = miniJewels[m];
      const sp = miniJewelSprites[s.category] || miniJewelSprites.white;
      if (sparkle > 0.05) {
        const w = sp.size * (1.0 + sparkle * 0.55);
        ctx.drawImage(sp.canvas, rx - w / 2, ry - w / 2, w, w);
      } else {
        ctx.drawImage(sp.canvas, rx - sp.half, ry - sp.half);
      }
    }

    for (let j = 0; j < jewels.length; j++) {
      const { s, rx, ry, sparkle } = jewels[j];
      const sp = jewelSprites[s.category] || jewelSprites.white;
      if (sparkle > 0.05) {
        const w = sp.size * (1.0 + sparkle * 0.45);
        ctx.drawImage(sp.canvas, rx - w / 2, ry - w / 2, w, w);
      } else {
        ctx.drawImage(sp.canvas, rx - sp.half, ry - sp.half);
      }
    }

    if (sparklingFlairs.length > 0) {
      for (let k = 0; k < sparklingFlairs.length; k++) {
        const { s, rx, ry, sparkle } = sparklingFlairs[k];
        const sp = miniJewelSprites[s.category] || miniJewelSprites.white;
        ctx.save();
        ctx.globalAlpha = sparkle * 0.85;
        const w = sp.size * (0.8 + sparkle * 0.35);
        ctx.drawImage(sp.canvas, rx - w / 2, ry - w / 2, w, w);
        ctx.restore();
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  NIGHT: SAO CHỔI (lâu lâu mới có một ngôi bay vụt qua)
  // ══════════════════════════════════════════════════════════════
  const COMET_TINTS = [[255, 255, 255], [147, 210, 255], [196, 160, 255], [255, 170, 210]];
  const COMET_GAP_MIN = 7000;   // ms giữa 2 lần xuất hiện: 7s ... 18s
  const COMET_GAP_RANGE = 11000;
  let comets = [];
  let nextCometAt = performance.now() + 2500 + Math.random() * 2500; // sao chổi đầu tiên sau ~3-5 giây

  function spawnComet() {
    const fromTop = Math.random() < 0.45;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const ang = (16 + Math.random() * 30) * Math.PI / 180;
    const speed = 10 + Math.random() * 7;
    let x, y;
    if (fromTop) {
      x = Math.random() * width;
      y = -50;
    } else {
      x = dir > 0 ? -50 : width + 50;
      y = Math.random() * height * 0.5;
    }
    comets.push({
      x, y,
      vx: Math.cos(ang) * speed * dir,
      vy: Math.sin(ang) * speed,
      len: 300 + Math.random() * 260,
      w: 2.2 + Math.random() * 1.4,
      tint: COMET_TINTS[(Math.random() * COMET_TINTS.length) | 0]
    });
  }

  function cometOut(px, py) {
    return px < -80 || px > width + 80 || py < -80 || py > height + 80;
  }

  function updateAndDrawComets(now, step) {
    if (now >= nextCometAt) {
      spawnComet();
      if (Math.random() < 0.15) spawnComet(); // thỉnh thoảng có một cặp
      nextCometAt = now + COMET_GAP_MIN + Math.random() * COMET_GAP_RANGE;
    }

    for (let i = comets.length - 1; i >= 0; i--) {
      const c = comets[i];
      c.x += c.vx * step;
      c.y += c.vy * step;

      const sp = Math.hypot(c.vx, c.vy);
      const ux = c.vx / sp, uy = c.vy / sp;
      // Chỉ xóa khi cả đầu lẫn chóp đuôi đều đã ra khỏi màn hình (đuôi không bị biến mất đột ngột)
      if (cometOut(c.x, c.y) && cometOut(c.x - ux * c.len, c.y - uy * c.len)) {
        comets.splice(i, 1);
        continue;
      }

      const L = c.len, W = c.w, r = c.tint[0], g = c.tint[1], b = c.tint[2];
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(Math.atan2(c.vy, c.vx));

      // Đuôi ngoài: rộng, mờ, dài
      let gr = ctx.createLinearGradient(0, 0, -L, 0);
      gr.addColorStop(0, `rgba(${r},${g},${b},0.38)`);
      gr.addColorStop(0.35, `rgba(${r},${g},${b},0.12)`);
      gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.moveTo(0, -W * 3.2);
      ctx.quadraticCurveTo(-L * 0.45, -W * 1.2, -L, 0);
      ctx.quadraticCurveTo(-L * 0.45, W * 1.2, 0, W * 3.2);
      ctx.closePath();
      ctx.fill();

      // Lõi đuôi: sáng, thon, mờ dần về phía cuối
      gr = ctx.createLinearGradient(0, 0, -L * 0.8, 0);
      gr.addColorStop(0, "rgba(255,255,255,0.95)");
      gr.addColorStop(0.2, `rgba(${r},${g},${b},0.60)`);
      gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.moveTo(0, -W * 0.9);
      ctx.lineTo(-L * 0.8, 0);
      ctx.lineTo(0, W * 0.9);
      ctx.closePath();
      ctx.fill();

      // Đầu sao chổi phát sáng
      const hg = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 6);
      hg.addColorStop(0, "rgba(255,255,255,1)");
      hg.addColorStop(0.25, `rgba(${r},${g},${b},0.60)`);
      hg.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(0, 0, W * 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  LIGHT: bầu trời, mặt trời, mây
  // ══════════════════════════════════════════════════════════════
  const sun = { x: 0, y: 0, r: 60, rays: null, core: null };
  let cloudSprites = [];
  let clouds = [];

  function renderSkyBackground() {
    const g = bgCtx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, "#7eb4e2");
    g.addColorStop(0.35, "#a5d0f2");
    g.addColorStop(0.7, "#cde3f7");
    g.addColorStop(1, "#ebf3fa");
    bgCtx.fillStyle = g;
    bgCtx.fillRect(0, 0, width, height);

    // Quầng nắng ấm nhẹ tỏa quanh mặt trời (êm dịu, không chói)
    const M = Math.max(width, height);
    const halo = bgCtx.createRadialGradient(sun.x, sun.y, sun.r * 0.5, sun.x, sun.y, M * 0.55);
    halo.addColorStop(0, "rgba(255, 248, 220, 0.45)");
    halo.addColorStop(0.25, "rgba(255, 240, 190, 0.20)");
    halo.addColorStop(0.6, "rgba(255, 235, 190, 0.05)");
    halo.addColorStop(1, "rgba(255, 235, 190, 0)");
    bgCtx.fillStyle = halo;
    bgCtx.fillRect(0, 0, width, height);

    // Sương sáng nhẹ ở chân trời
    const haze = bgCtx.createLinearGradient(0, height * 0.7, 0, height);
    haze.addColorStop(0, "rgba(255,255,255,0)");
    haze.addColorStop(1, "rgba(255,255,255,0.40)");
    bgCtx.fillStyle = haze;
    bgCtx.fillRect(0, height * 0.7, width, height * 0.3);
  }

  function buildSun() {
    sun.x = width * 0.82;
    sun.y = height * 0.2;
    sun.r = Math.max(44, Math.min(78, Math.min(width, height) * 0.085));

    // Tia nắng (xoay chậm mỗi frame, cường độ dịu nhẹ)
    const R = sun.r * 4.2, S = Math.ceil(R * 2), c = S / 2;
    const rays = document.createElement("canvas");
    rays.width = S; rays.height = S;
    const rx = rays.getContext("2d");
    const rg = rx.createRadialGradient(c, c, sun.r * 0.9, c, c, R);
    rg.addColorStop(0, "rgba(255, 242, 180, 0.30)");
    rg.addColorStop(1, "rgba(255, 242, 180, 0)");
    rx.fillStyle = rg;
    const N = 16;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const long = i % 2 === 0;
      const len = long ? R : R * 0.62;
      const ha = long ? 0.075 : 0.05;
      rx.beginPath();
      rx.moveTo(c + Math.cos(a - ha) * sun.r * 0.9, c + Math.sin(a - ha) * sun.r * 0.9);
      rx.lineTo(c + Math.cos(a) * len, c + Math.sin(a) * len);
      rx.lineTo(c + Math.cos(a + ha) * sun.r * 0.9, c + Math.sin(a + ha) * sun.r * 0.9);
      rx.closePath();
      rx.fill();
    }
    sun.rays = rays;

    // Đĩa mặt trời (ấm áp, không gắt mắt)
    const R2 = sun.r * 2.6, S2 = Math.ceil(R2 * 2), c2 = S2 / 2;
    const core = document.createElement("canvas");
    core.width = S2; core.height = S2;
    const cx2 = core.getContext("2d");
    const cg = cx2.createRadialGradient(c2, c2, 0, c2, c2, R2);
    cg.addColorStop(0, "rgba(255, 255, 250, 0.96)");
    cg.addColorStop((sun.r * 0.75) / R2, "rgba(255, 250, 215, 0.90)");
    cg.addColorStop(sun.r / R2, "rgba(255, 232, 140, 0.85)");
    cg.addColorStop((sun.r * 1.6) / R2, "rgba(255, 220, 110, 0.20)");
    cg.addColorStop(1, "rgba(255, 220, 110, 0)");
    cx2.fillStyle = cg;
    cx2.beginPath();
    cx2.arc(c2, c2, R2, 0, Math.PI * 2);
    cx2.fill();
    sun.core = core;

    if (theme === "light") renderBackground(); // vị trí mặt trời đổi theo kích thước màn hình
  }

  function cloudBlob(x, px, py, r, rgb, a) {
    const g = x.createRadialGradient(px, py, r * 0.1, px, py, r);
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(0.55, `rgba(${rgb},${a * 0.7})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g;
    x.fillRect(px - r, py - r, r * 2, r * 2);
  }

  function makeCloudSprite(w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const x = c.getContext("2d");
    const n = 7 + Math.floor(Math.random() * 4);
    const puffs = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const hump = Math.sin(t * Math.PI);
      puffs.push([
        w * (0.16 + 0.68 * t) + (Math.random() - 0.5) * w * 0.06,
        h * 0.66 - hump * h * 0.20 - Math.random() * h * 0.05,
        h * (0.22 + 0.22 * hump) + Math.random() * h * 0.06
      ]);
    }
    for (const [px, py, r] of puffs) cloudBlob(x, px, py + r * 0.18, r, "165,196,232", 0.5); // bóng đáy mây
    for (const [px, py, r] of puffs) cloudBlob(x, px, py, r, "255,255,255", 0.95);
    // đáy mây phẳng và mờ dần
    x.globalCompositeOperation = "destination-out";
    const fade = x.createLinearGradient(0, h * 0.78, 0, h);
    fade.addColorStop(0, "rgba(0,0,0,0)");
    fade.addColorStop(1, "rgba(0,0,0,1)");
    x.fillStyle = fade;
    x.fillRect(0, h * 0.78, w, h * 0.22);
    return c;
  }

  function buildClouds() {
    if (!cloudSprites.length) {
      for (let i = 0; i < 5; i++) cloudSprites.push(makeCloudSprite(420, 200));
    }
    clouds = [];
    const count = Math.max(9, Math.round(width / 150));
    for (let i = 0; i < count; i++) {
      const layer = Math.random(); // 0 = xa, 1 = gần
      clouds.push({
        sprite: cloudSprites[i % cloudSprites.length],
        scale: 0.45 + layer * 0.95,
        speed: 0.10 + layer * 0.28,
        alpha: 0.55 + layer * 0.40,
        x: Math.random() * (width + 700) - 350,
        y: height * (-0.02 + Math.random() * 0.9)
      });
    }
    clouds.sort((a, b) => a.scale - b.scale); // mây xa vẽ trước, mây gần vẽ sau
  }

  function drawLightScene(now, step) {
    // Tia nắng xoay chậm + nhịp thở nhẹ
    ctx.save();
    ctx.translate(sun.x, sun.y);
    ctx.rotate(now * 0.000035);
    ctx.globalAlpha = 0.82 + 0.18 * Math.sin(now * 0.0011);
    ctx.drawImage(sun.rays, -sun.rays.width / 2, -sun.rays.height / 2);
    ctx.restore();
    ctx.drawImage(sun.core, sun.x - sun.core.width / 2, sun.y - sun.core.height / 2);

    // Mây trôi từ trái sang phải
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      c.x += c.speed * step;
      const w = c.sprite.width * c.scale, h = c.sprite.height * c.scale;
      if (c.x > width + w * 0.5) {
        c.x = -w * 1.2;
        c.y = height * (-0.02 + Math.random() * 0.9);
      }
      ctx.globalAlpha = c.alpha;
      ctx.drawImage(c.sprite, c.x - w / 2, c.y - h / 2, w, h);
    }
    ctx.globalAlpha = 1;
  }

  // ══════════════════════════════════════════════════════════════
  //  LỤC GIÁC 3D
  // ══════════════════════════════════════════════════════════════
  function buildHexGrid() {
    hexagons = [];
    hexDirtyAll = true;
    const colStep = HEX_R * 1.5;
    const rowStep = HEX_H;
    const cols = Math.ceil(width / colStep) + 2;
    const rows = Math.ceil(height / rowStep) + 2;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const cx = c * colStep;
        const cy = r * rowStep + (c % 2 === 1 ? rowStep / 2 : 0);

        if (isInsideCircledArea(cx, cy)) {
          const baseHeight = 14 + (c % 3) * 4;

          const restingGrd = ctx.createLinearGradient(
            cx - HEX_R * 0.6, cy + HEX_R * 0.6,
            cx + HEX_R * 0.6, cy - HEX_R * 0.6
          );
          restingGrd.addColorStop(0, P.restA);
          restingGrd.addColorStop(1, P.restB);

          hexagons.push({ cx, cy, baseZ: baseHeight, z: baseHeight, targetZ: baseHeight, glow: 0, dz: baseHeight, dg: 0, dirty: false, restingGrd });
        }
      }
    }
  }

  function innerPath(cx, cy) {
    const ctx = hctx;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const inX = cx + IN_VX_OFF[i];
      const inY = cy + IN_VY_OFF[i];
      if (i === 0) ctx.moveTo(inX, inY);
      else ctx.lineTo(inX, inY);
    }
    ctx.closePath();
  }

  function draw3DHex(h) {
    const ctx = hctx;
    const z = h.z;
    const cx = h.cx;
    const cy = h.cy - z;
    const glowFactor = h.glow;

    for (let i = 0; i < 6; i++) {
      curVx[i] = cx + TOP_VX_OFF[i];
      curVy[i] = cy + TOP_VY_OFF[i];
    }

    // 1. Bóng đổ
    ctx.beginPath();
    const shadowYOff = z * 0.52;
    for (let i = 0; i < 6; i++) {
      const sx = h.cx - 8 + TOP_VX_OFF[i];
      const sy = h.cy + shadowYOff + (HEX_R * SIN_60[i] * 0.92);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fillStyle = P.shadow;
    ctx.fill();

    // 2. Thành bên
    for (let k = 1; k <= 3; k++) {
      const iNext = (k + 1) % 6;
      ctx.beginPath();
      ctx.moveTo(curVx[k], curVy[k]);
      ctx.lineTo(curVx[iNext], curVy[iNext]);
      ctx.lineTo(curVx[iNext], curVy[iNext] + z);
      ctx.lineTo(curVx[k], curVy[k] + z);
      ctx.closePath();
      ctx.fillStyle = P.side[k];
      ctx.fill();
      ctx.strokeStyle = P.sideStroke(glowFactor);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 3. Mặt trên
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      if (i === 0) ctx.moveTo(curVx[i], curVy[i]);
      else ctx.lineTo(curVx[i], curVy[i]);
    }
    ctx.closePath();

    if (glowFactor > 0.05) {
      ctx.fillStyle = P.hoverFill(glowFactor);
      ctx.fill();
      ctx.strokeStyle = P.hoverStroke(glowFactor);
      ctx.lineWidth = 2.2;
      ctx.stroke();

      innerPath(cx, cy);
      ctx.strokeStyle = P.hoverInner(glowFactor);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else {
      ctx.fillStyle = h.restingGrd;
      ctx.fill();
      ctx.strokeStyle = P.restStroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      innerPath(cx, cy);
      ctx.strokeStyle = P.restInner;
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    // 4. Vệt phản quang cạnh trên
    ctx.beginPath();
    ctx.moveTo(curVx[5], curVy[5]);
    ctx.lineTo(curVx[0], curVy[0]);
    ctx.strokeStyle = glowFactor > 0.05 ? P.hlHover : P.hl;
    ctx.lineWidth = glowFactor > 0.05 ? 2.2 : 1.4;
    ctx.stroke();
  }

  // ══════════════════════════════════════════════════════════════
  //  LỚP LỤC GIÁC: chỉ vẽ lại vùng có chuyển động (không vẽ gì khi chuột đứng yên)
  // ══════════════════════════════════════════════════════════════
  const HEX_PAD_X = HEX_R + 14;
  const HEX_PAD_TOP = HEX_R + 70;
  const HEX_PAD_BOT = HEX_R + 46;

  // Cập nhật trạng thái từng lục giác, trả về true nếu có cái cần vẽ lại
  function updateHexes() {
    const hasMouse = mouse.active && mouse.x > 0;
    const hoverR = 220, hoverR2 = hoverR * hoverR;
    let any = false;

    for (let i = 0; i < hexagons.length; i++) {
      const hex = hexagons[i];

      if (hasMouse) {
        const dx = hex.cx - mouse.x;
        const dy = hex.cy - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < hoverR2) {
          const factor = 1 - Math.sqrt(d2) / hoverR;
          hex.targetZ = hex.baseZ + 46 * factor;
          hex.glow = factor;
        } else {
          hex.targetZ = hex.baseZ;
          hex.glow *= 0.88;
        }
      } else {
        hex.targetZ = hex.baseZ;
        hex.glow *= 0.88;
      }
      if (hex.glow < 0.02) hex.glow = 0;

      hex.z += (hex.targetZ - hex.z) * 0.2;
      if (Math.abs(hex.targetZ - hex.z) < 0.05) hex.z = hex.targetZ;

      // So với trạng thái đã vẽ gần nhất: khác đáng kể mới cần vẽ lại
      hex.dirty = Math.abs(hex.z - hex.dz) > 0.05 || Math.abs(hex.glow - hex.dg) > 0.004;
      if (hex.dirty) any = true;
    }
    return any;
  }

  function drawHexLayer(all) {
    let x0 = 0, y0 = 0, x1 = width, y1 = height;

    if (!all) {
      x0 = Infinity; y0 = Infinity; x1 = -Infinity; y1 = -Infinity;
      for (let i = 0; i < hexagons.length; i++) {
        const h = hexagons[i];
        if (!h.dirty) continue;
        if (h.cx - HEX_PAD_X < x0) x0 = h.cx - HEX_PAD_X;
        if (h.cx + HEX_PAD_X > x1) x1 = h.cx + HEX_PAD_X;
        if (h.cy - HEX_PAD_TOP < y0) y0 = h.cy - HEX_PAD_TOP;
        if (h.cy + HEX_PAD_BOT > y1) y1 = h.cy + HEX_PAD_BOT;
      }
      if (x0 === Infinity) return;
      // Canh theo pixel thiết bị để mép vùng vẽ lại không để lại đường kẻ mờ
      x0 = Math.max(0, Math.floor(x0 * dpr) / dpr);
      y0 = Math.max(0, Math.floor(y0 * dpr) / dpr);
      x1 = Math.min(width, Math.ceil(x1 * dpr) / dpr);
      y1 = Math.min(height, Math.ceil(y1 * dpr) / dpr);
      if (x1 <= x0 || y1 <= y0) return;
    }

    hctx.save();
    hctx.beginPath();
    hctx.rect(x0, y0, x1 - x0, y1 - y0);
    hctx.clip();
    hctx.clearRect(x0, y0, x1 - x0, y1 - y0);
    for (let i = 0; i < hexagons.length; i++) {
      const h = hexagons[i];
      if (h.cx + HEX_PAD_X < x0 || h.cx - HEX_PAD_X > x1 || h.cy + HEX_PAD_BOT < y0 || h.cy - HEX_PAD_TOP > y1) continue;
      draw3DHex(h);
      h.dz = h.z;
      h.dg = h.glow;
      h.dirty = false;
    }
    hctx.restore();
  }

  // ══════════════════════════════════════════════════════════════
  //  VÒNG LẶP CHÍNH
  //  · Mỗi frame (60Hz): chỉ cập nhật chuột + lục giác (rất nhẹ, vẽ chỉ khi có thay đổi)
  //  · Sao / mây / sao chổi: ~30 FPS, tự hạ xuống 20 / 15 FPS nếu máy chậm
  // ══════════════════════════════════════════════════════════════
  let lastFrameTime = 0;
  let isRunning = true;
  let frameGap = 33;
  let costSum = 0, costN = 0;

  function drawDynamic(now, step) {
    ctx.clearRect(0, 0, width, height);
    if (theme === "light") {
      drawLightScene(now, step);
    } else {
      updateAndDrawStars(now, step);
      updateAndDrawComets(now, step);
    }
  }

  function animate(now) {
    if (!isRunning) return;
    requestAnimationFrame(animate);

    // 1) Chuột mượt + lục giác
    if (mouse.active) {
      const mdx = mouse.targetX - mouse.x, mdy = mouse.targetY - mouse.y;
      if (mdx * mdx + mdy * mdy < 0.04) {
        mouse.x = mouse.targetX;
        mouse.y = mouse.targetY;
      } else {
        mouse.x += mdx * 0.3;
        mouse.y += mdy * 0.3;
      }
    }
    const anyHex = updateHexes();
    if (hexDirtyAll) {
      hexDirtyAll = false;
      drawHexLayer(true);
    } else if (anyHex) {
      drawHexLayer(false);
    }

    // 2) Sao / mây / sao chổi với tốc độ khung hình thấp hơn
    const elapsed = now - lastFrameTime;
    if (elapsed < frameGap - 2) return;
    const step = Math.min(3, elapsed / 16.6);
    lastFrameTime = now;

    const t0 = performance.now();
    drawDynamic(now, step);
    costSum += performance.now() - t0;
    if (++costN >= 40) {
      const avg = costSum / costN;
      frameGap = avg > 14 ? 66 : avg > 8 ? 50 : 33;
      costSum = 0;
      costN = 0;
    }
  }

  function applyTheme(next) {
    theme = next === "light" ? "light" : "night";
    P = HEX_PAL[theme];
    comets = [];
    nextCometAt = performance.now() + 2500 + Math.random() * 2500;
    if (theme === "night") {
      currentNebulaLayout = generateRandomNebulaLayout();
    }
    renderBackground();
    buildHexGrid();

    // Vẽ ngay để View Transition chụp được trạng thái nền mới
    if (width && height) {
      drawDynamic(performance.now(), 1);
      drawHexLayer(true);
      hexDirtyAll = false;
    }
  }

  window.addEventListener("academai:theme", e => applyTheme(e.detail));

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      isRunning = false;
    } else if (!isRunning) {
      isRunning = true;
      lastFrameTime = performance.now();
      requestAnimationFrame(animate);
    }
  });

  window.addEventListener("mousemove", e => {
    if (!mouse.active) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    mouse.active = true;
  }, { passive: true });

  window.addEventListener("mouseleave", () => {
    mouse.targetX = -9999;
    mouse.targetY = -9999;
    mouse.active = false;
  });

  // Debounce: kéo resize cửa sổ không dựng lại nền tinh vân liên tục
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  loadNebulaImages();
  resize();
  lastFrameTime = performance.now();
  requestAnimationFrame(animate);
})();
