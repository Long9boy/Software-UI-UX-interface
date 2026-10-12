// Bước "Hiểu câu hỏi": biến câu hỏi tự nhiên thành tiêu chí tìm kiếm đa luồng.
const TOPICS = {
  "ai": [/\bai\b/, /trí tuệ nhân tạo/, /chatgpt/, /generative/, /llm/, /transformer/, /attention/, /deep learning/],
  "machine learning": [/học máy/, /machine learning/, /neural/, /nơ-ron/, /cnn/, /rnn/, /lstm/, /resnet/],
  "học tập": [/việc học/, /học tập/, /tự học/, /learning/],
  "sinh viên": [/sinh viên/, /student/, /undergraduate/],
  "đại học": [/đại học/, /university/, /higher education/],
  "giáo dục": [/giáo dục/, /education/, /sư phạm/, /giảng dạy/, /pedagogy/],
  "chuyển đổi số": [/chuyển đổi số/, /digital transformation/],
  "tìm kiếm": [/tìm kiếm/, /search/, /retrieval/, /pagerank/],
  "học trực tuyến": [/trực tuyến/, /online/],
  "nghiên cứu": [/phương pháp nghiên cứu/, /research/, /sota/, /scopus/, /q1/],
  "khí hậu": [/khí hậu/, /climate/, /môi trường/, /nóng lên toàn cầu/],
  "nông nghiệp": [/nông nghiệp/, /agriculture/],
  "lượng tử": [/lượng tử/, /quantum/, /qubit/, /jiuzhang/, /sycamore/],
  "y sinh": [/y tế/, /y sinh/, /dna/, /crispr/, /gen/, /cancer/, /ung thư/, /protein/, /alphafold/, /vaccine/]
};

const TYPES = {
  "Sách": /\bsách\b|giáo trình|\bbook\b/i,
  "Bài báo": /bài báo|paper|tạp chí|journal|article/i,
  "Luận văn": /luận văn|thesis/i,
  "Luận án": /luận án|dissertation/i,
  "Review": /review|survey|tổng quan/i
};

function parse(q) {
  const s = String(q || "").toLowerCase();
  const c = { topics: [], type: "", lang: "", from: "" };
  for (const k in TOPICS) {
    if (TOPICS[k].some(r => r.test(s))) c.topics.push(k);
  }
  for (const k in TYPES) {
    if (TYPES[k].test(s)) c.type = k;
  }
  if (/tiếng anh|english/.test(s)) c.lang = "en";
  else if (/tiếng việt/.test(s)) c.lang = "vi";
  
  let m = s.match(/từ\s*(20\d\d|19\d\d)/);
  if (m) c.from = +m[1];
  m = s.match(/(\d+)\s*năm (gần đây|qua)/);
  if (m) c.from = 2026 - (+m[1]);

  return c;
}

// Bước "Lọc kết quả" + chấm điểm gợi ý (chỉ dùng khi máy chủ không phản hồi)
function search(c) {
  const dataset = (typeof FEATURED_PAPERS !== "undefined" ? FEATURED_PAPERS : []).concat(DATA || []);
  const words = (c.q || "").toLowerCase().split(/\s+/).filter(w => w.length > 2);

  return dataset.map(d => {
    if (c.type && d.type && d.type !== c.type) return null;
    if (c.lang && d.lang && d.lang !== c.lang) return null;
    if (c.from && d.y && d.y < c.from) return null;

    const tags = d.tags || [d.category || "ai", d.field || "học thuật"];
    const textAll = ((d.t || "") + " " + (d.d || "") + " " + (Array.isArray(d.a) ? d.a.join(" ") : d.a || "")).toLowerCase();
    
    const h = c.topics.filter(t => tags.includes(t) || textAll.includes(t));
    let wordMatches = words.filter(w => textAll.includes(w)).length;

    // Tính điểm phù hợp cơ bản
    let sc = 50;
    if (c.topics.length) {
      sc = Math.round((h.length / c.topics.length) * 60) + (wordMatches * 10);
    } else if (words.length) {
      sc = Math.min(98, 40 + Math.round((wordMatches / words.length) * 55));
    }

    sc = Math.max(25, Math.min(99, sc));
    if (c.topics.length && !h.length && !wordMatches) return null;

    return {
      t: d.t,
      a: Array.isArray(d.a) ? d.a : [d.a],
      y: d.y,
      type: d.type || "Bài báo",
      venue: d.venue || (d.field ? `${d.field}` : "Dữ liệu học thuật"),
      oa: !!d.oa || true,
      d: d.d || d.d_en || "Tài liệu học thuật trích dẫn cao.",
      tags: tags,
      url: d.url || "",
      sc: sc,
      h: h.length ? h : (words.length ? words.slice(0, 3) : ["học thuật"]),
      cites: d.cites || "",
      img: d.img || ""
    };
  }).filter(Boolean).sort((a, b) => b.sc - a.sc || (b.y || 0) - (a.y || 0));
}
