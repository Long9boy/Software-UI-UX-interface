const $=id=>document.getElementById(id);
const esc=s=>String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const blank=()=>({saved:[],colls:{"Đọc sau":[],"Tham khảo luận văn":[]},hist:[]});

// State chính của AcademAI
const S={
  view:"home",
  q:"",
  crit:null,
  results:[],
  info:null,
  loading:false,
  note:"",
  user:null,
  offline:false,
  mode:"login",
  err:"",
  deep:(()=>{try{return localStorage.getItem("academai.deep")==="1"}catch(e){return false}})(), // Tìm kiếm chuyên sâu
  deepData:null,
  deepTab:"overview",
  cmp:null,
  sort:"rel",
  featuredFilter:"all",
  featuredSort:"cites",
  featuredQuery:"",
  ...blank(),
  keys:[],
  providers:{},
  form:{provider:"Gemini",model:"",key:""},
  test:{},
  msg:"",
  lang:"vi"
};

/* ── Tìm kiếm chuyên sâu: xem js/analysis.js ────────────────────────────────────────────────────────────────────────────────────────── */

/* ── i18n ─────────────────────────────────────────────────── */
const T={
  vi:{
    tabs:[["home","Khám phá"],["featured","Nổi bật"],["saved","Đã lưu"],["colls","Bộ sưu tập"],["hist","Lịch sử"]],
    login:"Đăng nhập",logout:"Đăng xuất",register:"Đăng ký",
    badge:"✦ Tìm kiếm học thuật bằng ngôn ngữ tự nhiên · AI Powered",
    h1a:"Tìm tài nguyên bạn cần,",h1b:"theo cách bạn nghĩ",
    sub:"Hỏi bằng câu tiếng Việt hoặc tiếng Anh bình thường. Hệ thống AI tự động phân tích sâu ý định truy vấn và truy hồi từ hàng chục triệu bài báo, sách, luận văn và tạp chí uy tín toàn cầu.",
    placeholder:"Nhập chủ đề, câu hỏi hoặc tên tài liệu (VD: tác động của AI đến việc tự học của sinh viên đại học)...",
    tries:[
      "Tổng quan về Transformer và Attention cho người mới bắt đầu",
      "Tác động của trí tuệ nhân tạo đến việc tự học của sinh viên đại học",
      "Phương pháp nghiên cứu định lượng trong kinh tế học hành vi",
      "Systematic reviews on deep learning for NLP",
      "Biến đổi khí hậu và an ninh lương thực ở Việt Nam"
    ],
    tryLabel:"Gợi ý tìm kiếm:",
    deepLabel:"Tìm kiếm chuyên sâu",
    deepHint:"Kèm phân tích số liệu, biểu đồ xu hướng, tổng quan AI và danh mục đọc",
    sortBy:"Sắp xếp theo",sortRel:"Độ phù hợp",sortCit:"Số trích dẫn",sortYear:"Năm mới nhất",
    searchBtn:"Tìm kiếm",
    loggedIn:"Đăng nhập để tìm và lưu tài liệu.",
    gate:"Bạn cần đăng nhập để dùng mục này.",
    gateBtn:"Đăng nhập / Đăng ký",
    settingsTitle:"Cài đặt hệ thống",
    langLabel:"Ngôn ngữ giao diện",
    adminTitle:"Quản trị: Cấu hình API Key",
    addKeyBtn:"Thêm API Key",
    provLabel:"Nhà cung cấp",modelLabel:"Model",keyLabel:"API Key",
    newKey:"Thêm key mới",howLabel:"Cách lấy API Key",
    inUse:"Đang dùng",ai:"AI",src:"Nguồn dữ liệu",noKey:"Chưa có key nào. Thêm key bên dưới.",
    deleteKey:"Bạn có chắc muốn xóa key này?",testBtn:"Kiểm tra",deleteBtn:"Xóa",
    understand:"AI hiểu ngữ cảnh",allTypes:"Tất cả loại",docType:"Loại tài liệu",pubYear:"Năm xuất bản từ",anyYear:"Tất cả năm",
    loading:"Đang kết nối OpenAlex, Crossref & Google Sách và tóm tắt bằng AI…",
    noFilter:"Không có kết quả nào phù hợp với bộ lọc hiện tại.",aiTopicNote:"AI tự động phát hiện chủ đề từ câu hỏi.",
    resultsOf:"tài liệu học thuật được tìm thấy",srcLabel:"Nguồn dữ liệu:",aiLabel:"Mô hình AI:",
    saved:"Đã lưu",
    notSaved:"Chưa lưu tài liệu nào. Bấm 'Lưu' trên các bài viết để lưu lại.",addToColl:"+ Thêm vào bộ sưu tập",
    colls:"Bộ sưu tập tài liệu",noDocs:"tài liệu",noColls:"Chưa có bộ sưu tập nào.",
    hist:"Lịch sử tìm kiếm",deleteAll:"Xóa tất cả",noHist:"Chưa có lịch sử tìm kiếm.",
    results:"kết quả",searchAgain:"Tìm lại",deleteOne:"Xóa",
    closeBtn:"Đóng",openWeb:"Xem bài gốc ↗",noLink:"Không có liên kết trực tiếp.",
    noAbstract:"Chưa có tóm tắt chi tiết cho tài liệu này.",aiSummary:"Tóm tắt nội dung chính (AI)",origSummary:"Tóm tắt gốc từ tác giả",
    embedNote:"Mở liên kết nguồn tại tab mới.",
    why:"Lý do gợi ý:",unknownAuthor:"Nhiều tác giả",source:"Nguồn",
    match:"độ phù hợp",viewDetail:"Chi tiết →",
    loginBtn:"Đăng nhập ngay",
    nameLabel:"Họ và tên",emailLabel:"Địa chỉ Email",passLabel:"Mật khẩu",
    alreadyHave:"Đã có tài khoản? Đăng nhập",noAccount:"Chưa có tài khoản? Đăng ký ngay",
    demoTitle:"Tài khoản thử nghiệm nhanh",
    adminDesc:"Tìm kiếm hoạt động ngay cả khi chưa gắn key. <b>Key AI</b> (Gemini/Groq miễn phí) giúp phân tích ngữ nghĩa và tóm tắt. <b>Key OpenAlex</b> (miễn phí) tăng hạn mức truy vấn 10×.",
    offlineNote:"Chưa kết nối được máy chủ server.js. Hệ thống đang tự động chuyển sang chế độ dữ liệu mẫu tích hợp.",
    demoNote:"Không tải được từ máy chủ (",demoNote2:"). Đang hiển thị tài liệu mẫu.",
    demoVenue:"Dữ liệu mẫu",demoDesc:"Tài liệu học thuật kinh điển minh họa khả năng tìm kiếm ngữ nghĩa.",
    demoMatch:"khớp từ khóa",
    docTypes:["Bài báo","Sách","Luận văn","Luận án","Review"],
    pubYears:[2018,2020,2022,2023,2024],
    settingsAdminNote:"Chỉ tài khoản Admin mới có thể truy cập trang Quản trị API Key.",
    voicePrompt:"Đang lắng nghe câu hỏi của bạn...",
    featuredTitle:"Kho tàng 50 Công trình Học thuật Kinh điển Thế giới",
    featuredSub:"Tuyển chọn 50 công trình đột phá nhất trong lịch sử khoa học và công nghệ hiện đại — từ mạng Transformer, ResNet, AlphaFold đến Thuyết tương đối Einstein, DNA Double Helix và Cân bằng Nash.",
    copyCitation:"Sao chép trích dẫn",
    copiedCitation:"✓ Đã sao chép trích dẫn chuẩn APA vào bộ nhớ tạm!",
    readPaper:"Đọc bài gốc ↗",
    fields:{
      all:"Tất cả (50)",
      ai:"Trí tuệ nhân tạo (21)",
      bio:"Y Sinh học (6)",
      physics:"Vật lý & Lượng tử (6)",
      cs:"Khoa học máy tính (12)",
      econ:"Kinh tế & Hành vi (2)",
      soc:"Khoa học xã hội (3)"
    },
    sortOptions:[
      ["cites","Trích dẫn nhiều nhất"],
      ["reads","Lượt đọc cao nhất"],
      ["year","Năm xuất bản mới nhất"]
    ],
    searchFeaturedPlaceholder:"Tìm nhanh trong 50 bài học thuật...",
  },
  en:{
    tabs:[["home","Explore"],["featured","Featured"],["saved","Saved"],["colls","Collections"],["hist","History"]],
    login:"Log in",logout:"Log out",register:"Sign up",
    badge:"✦ Natural-Language Academic Search · AI Powered",
    h1a:"Find the research you need,",h1b:"the way you think",
    sub:"Ask in natural language. Our AI extracts deep research intent across tens of millions of trusted papers, books, theses, and high-impact journals.",
    placeholder:"Enter a topic, question or title (e.g., impact of AI on self-directed learning of university students)...",
    tries:[
      "Introductory survey on Transformers and Attention mechanisms",
      "Impact of artificial intelligence on self-directed learning in university students",
      "Quantitative research methods in behavioral economics",
      "Systematic reviews on deep learning for NLP",
      "Climate change and food security in Vietnam"
    ],
    tryLabel:"Search suggestions:",
    deepLabel:"Deep search",
    deepHint:"Adds data analysis, trend charts, an AI overview and a reading list",
    sortBy:"Sort by",sortRel:"Relevance",sortCit:"Citations",sortYear:"Newest",
    searchBtn:"Search",
    loggedIn:"Log in to search and sync your saved library.",
    gate:"You need to log in to access this section.",
    gateBtn:"Log in / Sign up",
    settingsTitle:"System Settings",
    langLabel:"Interface Language",
    adminTitle:"Admin: API Key Management",
    addKeyBtn:"Add API Key",
    provLabel:"Provider",modelLabel:"Model",keyLabel:"API Key",
    newKey:"Add New Key",howLabel:"How to get an API Key",
    inUse:"Active",ai:"AI",src:"Data Source",noKey:"No API keys configured yet.",
    deleteKey:"Are you sure you want to delete this key?",testBtn:"Test",deleteBtn:"Remove",
    understand:"AI Context Understanding",allTypes:"All types",docType:"Document type",pubYear:"Published from",anyYear:"Any year",
    loading:"Connecting to OpenAlex, Crossref & Google Books and generating AI summaries…",
    noFilter:"No resources match the selected filters.",aiTopicNote:"AI automatically infers topics from your prompt.",
    resultsOf:"academic resources found",srcLabel:"Sources:",aiLabel:"AI Model:",
    saved:"Saved Library",
    notSaved:"No saved resources yet. Click 'Save' on any result to bookmark.",addToColl:"+ Add to collection",
    colls:"Collections",noDocs:"papers",noColls:"No collections created yet.",
    hist:"Search History",deleteAll:"Clear all history",noHist:"No search history yet.",
    results:"results",searchAgain:"Search again",deleteOne:"Remove",
    closeBtn:"Close",openWeb:"View on web ↗",noLink:"No source link available.",
    noAbstract:"No detailed abstract available for this resource.",aiSummary:"Key Summary (AI)",origSummary:"Original Abstract",
    embedNote:"Opens publisher link in a new tab.",
    why:"Why suggested:",unknownAuthor:"Various authors",source:"Source",
    match:"match",viewDetail:"Details →",
    loginBtn:"Log in now",
    nameLabel:"Full Name",emailLabel:"Email Address",passLabel:"Password",
    alreadyHave:"Already have an account? Log in",noAccount:"Don't have an account? Sign up",
    demoTitle:"Quick Demo Accounts",
    adminDesc:"Search works without any keys. Adding an <b>AI Key</b> enhances natural-language understanding & summaries.",
    offlineNote:"Cannot connect to the server backend. Running with built-in academic dataset.",
    demoNote:"Server error (",demoNote2:"). Showing sample academic data.",
    demoVenue:"Demo Dataset",demoDesc:"Classic academic paper demonstrating semantic retrieval.",
    demoMatch:"matched",
    docTypes:["Article","Book","Thesis","Dissertation","Review"],
    pubYears:[2018,2020,2022,2023,2024],
    settingsAdminNote:"Only admin accounts have access to the Admin API key panel.",
    voicePrompt:"Listening for your research query...",
    featuredTitle:"50 Landmark Academic Papers That Shaped the World",
    featuredSub:"Curated collection of the most influential scientific breakthroughs in modern history — from Transformers, ResNet, AlphaFold to Einstein's Relativity, DNA Double Helix and Nash Equilibrium.",
    copyCitation:"Copy Citation",
    copiedCitation:"✓ APA Citation copied to clipboard!",
    readPaper:"Read Original ↗",
    fields:{
      all:"All (50)",
      ai:"Artificial Intelligence (21)",
      bio:"Biology & Medicine (6)",
      physics:"Physics & Quantum (6)",
      cs:"Computer Science (12)",
      econ:"Economics & Behavioral (2)",
      soc:"Social Sciences (3)"
    },
    sortOptions:[
      ["cites","Most Cited"],
      ["reads","Most Read"],
      ["year","Newest Year"]
    ],
    searchFeaturedPlaceholder:"Quick search across 50 papers...",
  }
};
const t=()=>T[S.lang]||T.vi;

// Dialog & Toast container
document.body.insertAdjacentHTML("beforeend",`
  <dialog id="dlg"></dialog>
  <div id="toast" class="toast-bubble"></div>
`);
$("dlg").onclick=e=>{if(e.target===$("dlg"))$("dlg").close()};

function showToast(msg){
  const el=$("toast");
  if(!el)return;
  el.textContent=msg;
  el.classList.add("show");
  clearTimeout(el._timer);
  el._timer=setTimeout(()=>el.classList.remove("show"),3000);
}

async function api(p,method="GET",body){
  const r=await fetch("/api/"+p,{method,headers:{"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||("Error "+r.status));return j;
}
const persist=()=>{if(S.user)api("me/data","PUT",{saved:S.saved,colls:S.colls,hist:S.hist}).catch(()=>{})};
async function loadData(){
  sxApply(); // áp cài đặt đã lưu của tài khoản (ngôn ngữ, số kết quả/trang…)
  if(!S.user)return;
  try{const d=await api("me/data");S.saved=d.saved||[];S.colls=d.colls||blank().colls;S.hist=d.hist||[]}catch(e){}
}
const get=title=>S.results.concat(S.saved).concat(typeof FEATURED_PAPERS!=="undefined"?FEATURED_PAPERS:[]).find(x=>x.t===title);
const isSaved=title=>S.saved.some(x=>x.t===title);
const fromLocal=c=>search(c);

function go(v){
  S.view=v;
  S.msg="";
  if(v==="admin")loadKeys();
  draw();
  scrollTo({top:0,behavior:"smooth"});
}
function needLogin(msg){S.mode="login";S.err=msg||"";S.view="auth";draw();scrollTo({top:0,behavior:"smooth"})}
async function loadKeys(){try{const j=await api("admin/keys");S.keys=j.keys;S.providers=j.providers;draw()}catch(e){S.msg=e.message;draw()}}

async function ask(q,rec=true){
  q=String(q||"").trim();
  if(!q)return;
  S.q=q;
  S.crit=parse(q);
  S.view="results";
  S.page=1;
  S.loading=true;
  S.note="";
  S.results=[];
  S.deepData=null;S.cmp=null;S.deepTab="overview";S.deepTok=(S.deepTok||0)+1; // phân tích chuyên sâu của truy vấn cũ không còn dùng
  draw();
  scrollTo({top:0,behavior:"smooth"});

  try{
    const j=await api("search","POST",{q});
    S.results=j.results||[];
    S.info=j;
    S.note=j.note||"";
    S.crit={...S.crit,...(j.crit||{})};
  }catch(e){
    console.warn("API Search fallback to local:",e);
    S.results=fromLocal(S.crit);
    S.info=null;
    S.note=t().demoNote+(e.message||"")+t().demoNote2;
  }
  S.loading=false;
  S.results.forEach((d,i)=>{d.n=i+1}); // số thứ tự [n] dùng để trích dẫn trong bảng phân tích
  if(S.deep&&S.results.length)setTimeout(loadDeep,0); // chạy sau draw() bên dưới
  if(rec){
    S.hist.unshift({q,time:new Date().toLocaleString(S.lang==="vi"?"vi-VN":"en-US"),n:S.results.length});
  }
  persist();
  draw();
}

/* ── Tạo trích dẫn chuẩn APA & BibTeX ─────────────────────── */
function copyCitation(paperTitle){
  const p=get(paperTitle);
  if(!p)return;
  const authors=(p.a||[]).join(", ");
  const year=p.y||"2024";
  const venue=p.venue||"Academic Press";
  const url=p.url||"";
  
  // Format APA 7th Edition
  const apa=`${authors} (${year}). ${p.t}. ${venue}. ${url}`;
  
  navigator.clipboard.writeText(apa).then(()=>{
    showToast(t().copiedCitation);
  }).catch(()=>{
    showToast("✓ "+apa);
  });
}

/* ── Render Hero Section (Full Viewport) ───────────────────── */
function heroSearch(){
  const placeholder=t().placeholder;
  const tries=t().tries;

  return`<section class="hero-full">
  <div class="hero-full-inner">
    <div class="hero-badge-bubble">
      <span class="badge-sparkle">✦</span>
      <span>${esc(t().badge)}</span>
    </div>

    <h1 class="hero-title-main">
      ${esc(t().h1a)} <br><span class="gradient-text">${esc(t().h1b)}</span>
    </h1>

    <p class="hero-sub-main">${esc(t().sub)}</p>

    <!-- THANH TÌM KIẾM BONG BÓNG NƯỚC IOS 26 -->
    <div class="sb-wrapper-full">
      <div class="sb-bubble" id="sf">
        <span class="sb-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </span>
        <input id="qi" type="text" autocomplete="off" value="${esc(S.q)}" placeholder="${esc(placeholder)}">
        <button type="button" class="sb-clear ${S.q?'visible':''}" id="sb-clear" title="Xóa">✕</button>
        <button type="button" class="sb-mic" id="sb-mic" title="Tìm bằng giọng nói">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
        </button>
        <button type="button" class="sb-btn" id="sb">
          <span>${esc(t().searchBtn)}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
    </div>

    ${deepToggle()}

    <!-- CÁC CHIP GỢI Ý TÌM KIẾM -->
    <div class="try-row-full">
      <span class="try-label-full">${esc(t().tryLabel)}</span>
      <div class="try-chips-full">
        ${tries.map(e=>`<button type="button" class="try-chip-bubble" data-e="${esc(e)}"><span class="chip-dot"></span>${esc(e)}</button>`).join("")}
      </div>
    </div>

    <!-- THANH SỐ LIỆU HỌC THUẬT UY TÍN -->
    <div class="hero-metrics-bar">
      <div class="metric-item">
        <span class="metric-num">250,000,000+</span>
        <span class="metric-label">Tài liệu học thuật toàn cầu</span>
      </div>
      <div class="metric-item">
        <span class="metric-num">OpenAlex & Crossref</span>
        <span class="metric-label">Cơ sở dữ liệu khoa học gốc</span>
      </div>
      <div class="metric-item">
        <span class="metric-num">50 Landmark</span>
        <span class="metric-label">Công trình kinh điển có sẵn</span>
      </div>
      <div class="metric-item">
        <span class="metric-num">AI Deep Search</span>
        <span class="metric-label">Phân tích xu hướng & khoảng trống nghiên cứu</span>
      </div>
    </div>
  </div>
</section>`;
}

/* ── Inline Search cho trang kết quả ───────────────────────── */
function inlineSearch(){
  const placeholder=t().placeholder;
  return`<div class="sb-bar-wrapper">
    <div class="sb sb-inline" id="sf-inline">
      <span class="sb-icon" style="color:var(--mut);display:flex;margin-right:10px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </span>
      <input id="qi" type="text" autocomplete="off" value="${esc(S.q)}" placeholder="${esc(placeholder)}">
      <button type="button" class="sb-clear ${S.q?'visible':''}" id="sb-clear" title="Xóa">✕</button>
      <button type="button" class="sb-mic" id="sb-mic" title="Tìm bằng giọng nói">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
      </button>
      <button type="button" class="sb-btn" id="sb">
        <span>${esc(t().searchBtn)}</span>
      </button>
    </div>
  </div>`;
}

/* ── Tab Nổi bật: 50 Bài học thuật kinh điển ────────────────── */
function featuredView(){
  const all=(typeof FEATURED_PAPERS!=="undefined"?FEATURED_PAPERS:[]);
  const fKey=S.featuredFilter;
  const qStr=S.featuredQuery.toLowerCase().trim();

  let list=all.filter(p=>{
    if(fKey!=="all"&&p.category!==fKey)return false;
    if(qStr){
      const tAll=((p.t||"")+" "+(p.d||"")+" "+(p.a||[]).join(" ")+" "+(p.field||"")).toLowerCase();
      if(!tAll.includes(qStr))return false;
    }
    return true;
  });

  // Sắp xếp
  if(S.featuredSort==="cites"){
    list.sort((a,b)=>{
      const ca=parseInt(String(a.cites||"0").replace(/\D/g,""))||0;
      const cb=parseInt(String(b.cites||"0").replace(/\D/g,""))||0;
      return cb-ca;
    });
  }else if(S.featuredSort==="reads"){
    list.sort((a,b)=>{
      const parseReads=s=>s.includes("M")?parseFloat(s)*1e6:(parseFloat(s)*1e3||0);
      return parseReads(b.reads||"0")-parseReads(a.reads||"0");
    });
  }else if(S.featuredSort==="year"){
    list.sort((a,b)=>(b.y||0)-(a.y||0));
  }

  const fields=t().fields;

  return`<div class="content-container">
    <div class="featured-header">
      <div class="hero-badge-bubble" style="margin-bottom:14px;">
        <span class="badge-sparkle">🔥</span>
        <span>TOP 50 CÔNG TRÌNH HỌC THUẬT KINH ĐIỂN THẾ GIỚI</span>
      </div>
      <h2>${esc(t().featuredTitle)}</h2>
      <p>${esc(t().featuredSub)}</p>

      <div class="hero-metrics-bar" style="margin-top:0;padding-top:16px;border-top:0;">
        <div class="metric-item">
          <span class="metric-num">50 / 50</span>
          <span class="metric-label">Công trình có link nguồn & ảnh</span>
        </div>
        <div class="metric-item">
          <span class="metric-num">2,500,000+</span>
          <span class="metric-label">Tổng lượt trích dẫn học thuật</span>
        </div>
        <div class="metric-item">
          <span class="metric-num">Nature · Science · NeurIPS</span>
          <span class="metric-label">Nguồn xuất bản uy tín nhất</span>
        </div>
      </div>
    </div>

    <!-- Controls Bar -->
    <div class="featured-controls">
      <div class="featured-filter-tabs">
        ${Object.keys(fields).map(k=>`
          <button class="f-filter-btn ${fKey===k?'active':''}" data-ff="${k}">
            ${esc(fields[k])}
          </button>
        `).join("")}
      </div>

      <div class="featured-search-sort">
        <input type="text" class="f-search-input" id="f-search-input" value="${esc(S.featuredQuery)}" placeholder="${esc(t().searchFeaturedPlaceholder)}">
        <select class="f-sort-select" id="f-sort-select">
          ${t().sortOptions.map(([val,lbl])=>`<option value="${val}" ${S.featuredSort===val?'selected':''}>${esc(lbl)}</option>`).join("")}
        </select>
      </div>
    </div>

    <!-- Lưới 50 Bài Học Thuật -->
    <div class="featured-grid">
      ${list.map(p=>{
        const isSav=isSaved(p.t);
        return`<article class="fc-card">
          <div class="fc-img-box">
            <img src="${esc(p.img)}" alt="${esc(p.t)}" loading="lazy">
            <div class="fc-img-overlay">
              <span class="fc-field-badge">${esc(p.field||"Học thuật")}</span>
              <span class="fc-year-badge">${p.y||""}</span>
            </div>
          </div>
          <div class="fc-body">
            <div class="fc-stats">
              <div class="fc-stat-item" title="Lượt trích dẫn khoa học">
                <span>📚</span> <span>${esc(p.cites||"10,000+")} trích dẫn</span>
              </div>
              <div class="fc-stat-item" style="color:#059669;" title="Lượt đọc trên toàn cầu">
                <span>👁</span> <span>${esc(p.reads||"1M")} lượt đọc</span>
              </div>
            </div>
            <h3 class="fc-title" title="${esc(p.t)}">${esc(p.t)}</h3>
            <div class="fc-authors" title="${esc((p.a||[]).join(", "))}">${esc((p.a||[]).join(", "))}</div>
            <div class="fc-venue" title="${esc(p.venue)}">${esc(p.venue)}</div>
            <p class="fc-desc">${esc(p.d||p.d_en)}</p>
            <div class="fc-actions">
              <div class="fc-actions-left">
                <a class="btn p" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" title="${esc(t().readPaper)}">
                  <span>${esc(t().readPaper)}</span>
                </a>
                <button class="btn" data-cite="${esc(p.t)}" title="${esc(t().copyCitation)}">
                  <span>📋 Trích dẫn</span>
                </button>
              </div>
              <div>
                <button class="btn ${isSav?'sv':''}" data-s="${esc(p.t)}" title="Lưu bài viết">
                  <span>${isSav?'🔖 Đã lưu':'🔖 Lưu'}</span>
                </button>
                <button class="btn" data-o="${esc(p.t)}" title="${esc(t().viewDetail)}">
                  <span>Chi tiết</span>
                </button>
              </div>
            </div>
          </div>
        </article>`;
      }).join("")||`<div class="empty" style="grid-column: 1 / -1;">Không tìm thấy bài học thuật nào phù hợp với từ khóa "${esc(S.featuredQuery)}".</div>`}
    </div>
  </div>`;
}

const opt=(v,cur,l)=>`<option value="${v}" ${String(cur)===String(v)?"selected":""}>${l}</option>`;
const gate=()=>`<div class="content-container"><div class="empty"><h3>${esc(t().gate)}</h3><p style="margin:12px 0 20px">${esc(t().loggedIn)}</p><button class="btn p" data-v="auth">${esc(t().gateBtn)}</button></div></div>`;

function saveLabel(isSav){
  return isSav
    ? (S.lang==="vi"?"🔖 Đã lưu":"🔖 Saved")
    : (S.lang==="vi"?"🔖 Lưu tài liệu":"🔖 Save");
}

function card(d,extra=""){
  const s=isSaved(d.t);
  const score=d.sc||0;
  const isHigh=score>=70;
  return`<article class="rc" id="res-${d.n||""}">
    <div class="rt">
      <div class="bd">
        ${S.deep&&d.n?`<span class="ref-badge">[${d.n}]</span>`:""}
        ${d.type?`<span class="b1">${esc(d.type)}</span>`:""}
        <span class="yr">${d.y||""}</span>
        ${citOf(d)?`<span class="cit-badge" title="Trích dẫn">📚 ${fmtN(citOf(d))}</span>`:""}
        ${d.oa?'<span class="b2">Open Access</span>':""}
      </div>
      <span class="mt ${isHigh?'high':''}">● ${score}% ${esc(t().match)}</span>
    </div>
    <h3>${esc(d.t)}</h3>
    <div class="au"><button class="lnk" data-o="${esc(d.t)}">${esc((d.a||[]).join(" · "))||esc(t().unknownAuthor)}</button></div>
    <div class="vn"><button class="lnk" data-o="${esc(d.t)}"><i>${esc(d.venue||t().source)}</i></button>${d.src?` <span class="meta">· ${esc(d.src)}</span>`:""}</div>
    <p class="ab">${esc(d.d||"")}</p>
    ${d.why?`<span class="why">💡 ${esc(t().why)} ${esc(d.why)}</span>`:""}
    <div class="tg">${(d.tags||[]).map(tg=>`<span>${esc(tg)}</span>`).join("")}</div>
    ${resLinks(d)}
    <div class="ft">
      <span class="mono">${extra}</span>
      <div class="ac">
        <button class="btn" data-cite="${esc(d.t)}" title="Sao chép trích dẫn APA">📋 Trích dẫn</button>
        <button class="btn ${s?'sv':''}" data-s="${esc(d.t)}">${saveLabel(s)}</button>
        <button class="btn p" data-o="${esc(d.t)}">${esc(t().viewDetail)}</button>
      </div>
    </div>
  </article>`;
}

function openD(title){
  const d=get(title);if(!d)return;
  $("dlg").innerHTML=`<h3>${esc(d.t)}</h3>
  <div class="meta" style="margin: 8px 0 16px;line-height:1.6;">
    ${esc((d.a||[]).join(", "))} · <i>${esc(d.venue||"")}</i> · <b>${d.y||""}</b>
    ${d.cites?` · <b style='color:#2563eb'>📚 ${esc(d.cites)} trích dẫn</b>`:""}
    ${d.oa?" · <b style='color:#15803d'>Open Access</b>":""}
    ${d.src?" · "+esc(t().source)+": "+esc(d.src):""}
  </div>
  ${d.img?`<div style="margin:14px 0;max-height:220px;overflow:hidden;border-radius:14px;"><img src="${esc(d.img)}" style="width:100%;height:100%;object-fit:cover;"></div>`:""}
  <h4>${d.ai?esc(t().aiSummary):esc(t().origSummary)}</h4>
  <p style="line-height:1.7;color:#334155;margin:8px 0 14px;font-size:0.96rem;">${esc(d.d||t().noAbstract)}</p>
  ${d.d_en?`<h4 style="margin-top:14px;color:#64748b;">English Abstract</h4><p style="line-height:1.65;color:#475569;margin:6px 0 12px;font-size:0.9rem;">${esc(d.d_en)}</p>`:""}
  ${d.why?`<p class="why" style="display:block;margin:12px 0;">💡 ${esc(t().why)} ${esc(d.why)}</p>`:""}
  <div class="tg" style="margin:14px 0">${(d.tags||[]).map(x=>`<span>${esc(x)}</span>`).join("")}</div>
  ${resLinks(d)}
  <div class="ft" style="margin-top:20px;padding-top:16px;">
    <span class="meta">${d.url?esc(t().embedNote):esc(t().noLink)}</span>
    <div class="ac">
      <button class="btn" onclick="copyCitation('${esc(d.t)}')">📋 Sao chép APA</button>
      ${d.url?`<a class="btn p" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(t().openWeb)}</a>`:""}
      <button class="btn" onclick="$('dlg').close()">${esc(t().closeBtn)}</button>
    </div>
  </div>`;
  $("dlg").showModal();
}

function authView(){
  const reg=S.mode==="register";
  return`<div class="content-container">
    <div class="auth">
      <h2>${reg?esc(t().register):esc(t().login)}</h2>
      ${S.err?`<div class="note">${esc(S.err)}</div>`:""}
      ${reg?`<label>${esc(t().nameLabel)}</label><input id="an" autocomplete="name" placeholder="Nguyễn Văn A">`:""}
      <label>${esc(t().emailLabel)}</label>
      <input id="ae" type="email" autocomplete="email" placeholder="example@email.com">
      <label>${esc(t().passLabel)}</label>
      <input id="ap" type="password" autocomplete="current-password" placeholder="••••••••">
      <button class="btn p wide" id="go">${reg?esc(t().register):esc(t().loginBtn)}</button>
      <p class="meta" style="text-align:center;margin-top:16px;">
        <button class="lnk" data-m="${reg?"login":"register"}">${reg?esc(t().alreadyHave):esc(t().noAccount)}</button>
      </p>
      <div class="demo">
        <b>${esc(t().demoTitle)}:</b><br>
        <div style="margin-top:6px;display:flex;flex-direction:column;gap:6px;">
          <button class="lnk" data-fill="admin@academai.vn|admin123">🔑 <b>Admin</b>: admin@academai.vn / admin123</button>
          <button class="lnk" data-fill="sinhvien@academai.vn|user123">🎓 <b>User</b>: sinhvien@academai.vn / user123</button>
        </div>
      </div>
    </div>
  </div>`;
}

function adminView(){
  const P=S.providers,f=S.form,pv=P[f.provider],models=pv?pv.models:[];
  return`<div class="content-container">
    <h2>${esc(t().adminTitle)}</h2>
    <p class="meta" style="margin-bottom:20px;line-height:1.6;">${t().adminDesc}</p>
    ${S.msg?`<div class="note">${esc(S.msg)}</div>`:""}
    ${S.keys.map(k=>`<div class="hc">
      <div class="g">
        <h3>${esc(k.provider)} · ${esc(k.model)} ${k.inUse?`<span class="b2">${esc(t().inUse)}</span>`:""} <span class="b1">${k.kind==="source"?esc(t().src):esc(t().ai)}</span></h3>
        <div class="meta">${esc(k.hint)} · ${new Date(k.createdAt).toLocaleDateString(S.lang==="vi"?"vi-VN":"en-US")}${S.test[k.id]?" · "+esc(S.test[k.id]):""}</div>
      </div>
      <button class="btn" data-t="${k.id}">${esc(t().testBtn)}</button>
      <button class="x" data-k="${k.id}">${esc(t().deleteBtn)}</button>
    </div>`).join("")||`<div class="empty">${esc(t().noKey)}</div>`}
    <div class="side" style="position:static;margin-top:24px;">
      <h3>${esc(t().newKey)}</h3>
      <label>${esc(t().provLabel)}</label>
      <select data-ap>${Object.keys(P).map(k=>opt(k,f.provider,esc(P[k].label))).join("")}</select>
      ${pv&&pv.steps?`<div class="how"><b>${esc(t().howLabel)}</b><ol>${pv.steps.map(x=>`<li>${esc(x)}</li>`).join("")}</ol></div>`:""}
      <label>${esc(t().modelLabel)}</label>
      <select data-am>${models.map(m=>opt(m.id,f.model||models[0].id,esc(m.label))).join("")}</select>
      <label>${esc(t().keyLabel)} ${pv?`(<a href="${pv.link}" target="_blank" rel="noopener">${S.lang==="vi"?"Lấy key tại đây ↗":"Get key here ↗"}</a>)`:""}</label>
      <input id="ak" type="password" autocomplete="off" value="${esc(f.key)}" placeholder="${S.lang==="vi"?"Dán API key vào đây...":"Paste your API key here..."}">
      <button class="btn p wide" style="margin-top:16px;" id="addk">${esc(t().addKeyBtn)}</button>
    </div>
  </div>`;
}

/* ── Bong bóng nước trượt giữa các tab ──────────────────────────────────────
   · Bong bóng trượt từ tab cũ sang tab mới với đà nảy nhẹ (left/width có transition)
   · Khi di chuyển, bong bóng bị kéo dãn rồi co lại như giọt nước (squash & stretch)
   · Sinh ra các bọt nhỏ bay lên dọc đường đi (xem .nav-foam trong css/enhance.css)
   Dùng offsetLeft/offsetWidth (không chịu ảnh hưởng của transform scale còn đang chạy). */
let _bubbleX=null;

function spawnFoam(nav,fromX,toX,top,h){
  const dir=toX>=fromX?1:-1,dist=Math.abs(toX-fromX);
  for(let i=0;i<12;i++){
    const b=document.createElement("i");
    const sz=4+Math.random()*9,along=Math.random();
    b.className="nav-foam";
    b.style.cssText=`width:${sz.toFixed(1)}px;height:${sz.toFixed(1)}px;`
      +`left:${(fromX+dir*dist*along-sz/2).toFixed(1)}px;top:${(top+h*(0.15+Math.random()*0.7)).toFixed(1)}px;`
      +`--dx:${Math.round(Math.random()*30-15)}px;--dy:${Math.round(-18-Math.random()*28)}px;`
      +`--dur:${(0.75+Math.random()*0.6).toFixed(2)}s;animation-delay:${(along*0.3).toFixed(2)}s`;
    b.addEventListener("animationend",()=>b.remove());
    nav.appendChild(b);
  }
}

function updateBubbleSlider(instant=false){
  const nav=$("nav");
  const slider=$("tab-bubble-slider");
  if(!nav||!slider)return;
  const tab=nav.querySelector(".nav-tab.on");
  if(!tab){
    slider.style.opacity="0";
    _bubbleX=null;
    return;
  }
  const L=tab.offsetLeft,T=tab.offsetTop,W=tab.offsetWidth,H=tab.offsetHeight;
  const prevL=_bubbleX,prevW=slider._w||W;
  const still=instant===true||prevL===null; // lần đầu / resize: đặt thẳng vào vị trí, không animation
  const moved=!still&&Math.abs(L-prevL)>2;
  const ease="cubic-bezier(0.34, 1.45, 0.5, 1)";

  slider.style.transition=still?"none":`left 0.6s ${ease}, width 0.6s ${ease}, top 0.3s ease, height 0.3s ease, opacity 0.2s`;
  slider.style.opacity="1";
  slider.style.left=L+"px";
  slider.style.top=T+"px";
  slider.style.width=W+"px";
  slider.style.height=H+"px";

  if(moved&&!matchMedia("(prefers-reduced-motion: reduce)").matches){
    const dist=Math.abs(L-prevL);
    const sx=Math.min(1.4,1+dist/500),sy=Math.max(0.78,1-dist/1100);
    slider.animate([
      {transform:"scale(1,1)"},
      {transform:`scale(${sx},${sy})`,offset:0.35},
      {transform:`scale(${(1-(sx-1)*0.3).toFixed(2)},${(1+(1-sy)*0.4).toFixed(2)})`,offset:0.7},
      {transform:"scale(1,1)"}
    ],{duration:650,easing:"ease-in-out"});
    spawnFoam(nav,prevL+prevW/2,L+W/2,T,H);
  }
  _bubbleX=L;
  slider._w=W;
}

/* ── Render Thanh điều hướng Tabs (Giữ nguyên con trượt để chuyển động mượt) ── */
function renderNav(){
  const nav=$("nav");
  if(!nav)return;
  const u=S.user;
  const tabIcons={
    home:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    featured:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>`,
    saved:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`,
    colls:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    hist:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    admin:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`
  };
  const tabs=t().tabs.concat(u&&u.role==="admin"?[["admin","Admin"]]:[]);

  let slider=$("tab-bubble-slider");
  const existingBtns=nav.querySelectorAll(".nav-tab");
  const tabKeys=tabs.map(x=>x[0]).join(",");
  const currentKeys=Array.from(existingBtns).map(b=>b.dataset.v).join(",");

  if(slider && tabKeys===currentKeys && existingBtns.length===tabs.length){
    // Giữ nguyên DOM buttons và slider -> di chuyển mượt mà từ tab hiện tại sang tab mới!
    existingBtns.forEach(btn=>{
      const k=btn.dataset.v;
      const isOn=S.view===k||(S.view==="results"&&k==="home");
      btn.classList.toggle("on",isOn);
      if(k==="saved"){
        let badge=btn.querySelector(".badge-count");
        if(S.saved.length){
          if(!badge)btn.insertAdjacentHTML("beforeend",`<em class="badge-count">${S.saved.length}</em>`);
          else badge.textContent=S.saved.length;
        }else if(badge){
          badge.remove();
        }
      }
    });
    requestAnimationFrame(()=>updateBubbleSlider(false));
  } else {
    // Chỉ tạo mới khi danh sách cấu trúc tab thay đổi
    const btnsHtml=tabs.map(([k,l])=>`
      <button data-v="${k}" class="nav-tab ${S.view===k||(S.view==="results"&&k==="home")?"on":""}">
        <span class="tab-icon">${tabIcons[k]||""}</span>
        <span class="tab-label">${esc(l)}</span>
        ${k==="saved"&&S.saved.length?`<em class="badge-count">${S.saved.length}</em>`:""}
        ${k==="featured"?`<em class="badge-count" style="background:#f59e0b;">50</em>`:""}
      </button>
    `).join("");

    nav.innerHTML=`<div class="nav-bubble-slider" id="tab-bubble-slider"></div>` + btnsHtml;
    requestAnimationFrame(()=>updateBubbleSlider(true));
  }
}

/* ── Render chính toàn bộ giao diện ───────────────────────── */
function draw(){
  const u=S.user;
  
  // 1. Nạp cài đặt (ngôn ngữ…) trước khi vẽ
  sxInit();

  // 2. Render Tabs ở giữa với con trượt Bong bóng nước iOS 26
  renderNav();

  // 3. User Nav bên phải: khung user mở dropdown (Cài đặt / Đăng xuất); khách thì hiện nút Đăng nhập
  const userNav=$("user-nav");
  if(userNav)userNav.innerHTML=userNavHtml();

  // 4. Render Body View
  let h=S.offline?`<div class="content-container"><div class="note">${t().offlineNote}</div></div>`:"";

  if(S.view==="home"){
    h+=heroSearch();
  } else if(S.view==="featured"){
    h+=featuredView();
  } else if(S.view==="auth"){
    h+=authView();
  } else if(S.view==="settings"){
    h+=settingsView();
  } else if(S.view==="admin"){
    h+=u&&u.role==="admin"?adminView():gate();
  } else if(S.view==="results"){
    const c=S.crit||{topics:[],type:"",from:""};
    const r=filteredResults(); // đã lọc theo loại / năm / ngôn ngữ và sắp xếp
    h+=`<div class="content-container">`
      +inlineSearch()+`<div class="lay">
      <aside class="side">
        <h3>${esc(t().understand)}</h3>
        <div>${(c.topics||[]).map(tp=>`<span class="chip">${esc(tp)}</span>`).join("")||`<span class="meta">${esc(t().aiTopicNote)}</span>`}</div>
        
        <label>${esc(t().docType)}</label>
        <select data-f="type">
          ${opt("",c.type,t().allTypes)}
          ${t().docTypes.map(x=>opt(x,c.type,x)).join("")}
        </select>
        <label>${esc(t().pubYear)}</label>
        <select data-f="from">
          ${opt("",c.from,t().anyYear)}
          ${t().pubYears.map(x=>opt(x,c.from,x)).join("")}
        </select>
        <label>${esc(t().sortBy)}</label>
        <select data-sort>
          ${[["rel",t().sortRel],["cit",t().sortCit],["year",t().sortYear]].map(([v,l])=>opt(v,S.sort,esc(l))).join("")}
        </select>
      </aside>
      <section>
        ${S.loading?`<div class="empty"><div class="spin"></div><p style="font-weight:700;color:var(--tx);margin-bottom:6px;">${esc(t().loading)}</p><span class="meta">${S.lang==="vi"?"Đang kết nối các máy chủ học thuật quốc tế...":"Querying international academic repositories..."}</span></div>`:
        `${S.note?`<div class="note">${esc(S.note)}</div>`:""}
        <div class="meta" style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <span><b>${r.length}</b> ${esc(t().resultsOf)}</span>
          ${S.info?`<span>${S.info.sources?Object.entries(S.info.sources).map(([k,v])=>`<span class="b1" style="font-size:0.75rem">${esc(k)}: ${v}</span>`).join(" "):""} ${S.info.ai?`<span class="b2" style="font-size:0.75rem">🤖 ${esc(S.info.ai)}</span>`:""}</span>`:""}
        </div>
        ${S.deep&&r.length?deepPanel(r):""}
        ${pageSlice(r).map(d=>card(d)).join("")||`<div class="empty">${esc(t().noFilter)}</div>`}${pager(r.length)}`}
      </section>
    </div></div>`;
  } else if(S.view==="saved"){
    h+=`<div class="content-container"><h2>${esc(t().saved)} (${S.saved.length})</h2>`
      +(!u?`<div class="note" style="margin-bottom:20px;">💡 ${S.lang==="vi"?"Bạn đang lưu tài liệu tạm thời trên phiên này. Hãy đăng nhập để lưu vĩnh viễn trên mọi thiết bị.":"You are saving papers in this session. Log in to sync permanently across devices."}</div>`:"")
      +(S.saved.map(d=>card(d,`<select data-c="${esc(d.t)}"><option value="">+ ${esc(t().addToColl).slice(2)}</option>${Object.keys(S.colls).map(k=>`<option>${esc(k)}</option>`).join("")}</select>`)).join("")
      ||`<div class="empty">${esc(t().notSaved)}</div>`)+`</div>`;
  } else if(S.view==="colls"){
    h+=collsView(); // có nút tạo / đổi tên / xóa bộ sưu tập (js/settings.js)
  } else {
    h+=`<div class="content-container"><h2 style="display:flex;justify-content:space-between;align-items:center;"><span>${esc(t().hist)}</span> ${S.hist.length?`<button class="x" id="ca">${esc(t().deleteAll)}</button>`:""}</h2>`
      +(S.hist.map((x,i)=>`<div class="hc"><div class="g"><h3>"${esc(x.q)}"</h3><div class="meta">${x.time} · ${x.n} ${esc(t().results)}</div></div><button class="btn" data-h="${i}">${esc(t().searchAgain)}</button><button class="x" data-d="${i}">${esc(t().deleteOne)}</button></div>`).join("")
      ||`<div class="empty">${esc(t().noHist)}</div>`)+`</div>`;
  }

  $("app").innerHTML=h;
  enhanceSelects(); // dropdown bo góc + animation cuộn xuống

  // 5. Cập nhật vị trí thanh trượt Bong bóng nước
  requestAnimationFrame(()=>updateBubbleSlider(false));

  // 6. Gắn sự kiện các input và nút tìm kiếm
  const i=$("qi");
  const sb=$("sb");
  const clearBtn=$("sb-clear");
  const micBtn=$("sb-mic");

  if(i){
    i.onkeydown=e=>{
      if(e.key==="Enter"){
        e.preventDefault();
        ask(i.value);
      }
    };
    i.oninput=()=>{
      if(clearBtn)clearBtn.classList.toggle("visible",!!i.value);
    };
  }

  if(sb && i){
    sb.onclick=e=>{
      e.preventDefault();
      e.stopPropagation();
      ask(i.value);
    };
  }

  if(clearBtn && i){
    clearBtn.onclick=e=>{
      e.preventDefault();
      i.value="";
      clearBtn.classList.remove("visible");
      i.focus();
    };
  }

  if(micBtn && i){
    micBtn.onclick=()=>{
      const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(SpeechRecognition){
        const rec=new SpeechRecognition();
        rec.lang=S.lang==="vi"?"vi-VN":"en-US";
        micBtn.classList.add("listening");
        rec.onresult=(evt)=>{
          const txt=evt.results[0][0].transcript;
          i.value=txt;
          if(clearBtn)clearBtn.classList.add("visible");
          micBtn.classList.remove("listening");
          ask(txt);
        };
        rec.onerror=()=>micBtn.classList.remove("listening");
        rec.onend=()=>micBtn.classList.remove("listening");
        rec.start();
      }else{
        alert(S.lang==="vi"?"Trình duyệt chưa hỗ trợ tìm kiếm bằng giọng nói.":"Voice search is not supported in this browser.");
      }
    };
  }

  // Gắn sự kiện ô tìm kiếm trong Tab Nổi Bật
  const fSearchInput=$("f-search-input");
  if(fSearchInput){
    fSearchInput.oninput=()=>{
      S.featuredQuery=fSearchInput.value;
      const fgrid=document.querySelector(".featured-grid");
      if(fgrid){
        const temp=document.createElement("div");
        temp.innerHTML=featuredView();
        const newGrid=temp.querySelector(".featured-grid");
        if(newGrid)fgrid.innerHTML=newGrid.innerHTML;
      }
    };
  }

  const fSortSelect=$("f-sort-select");
  if(fSortSelect){
    fSortSelect.onchange=()=>{
      S.featuredSort=fSortSelect.value;
      draw();
    };
  }

  const k=$("ak");if(k)k.oninput=()=>S.form.key=k.value;
  if($("go"))document.querySelectorAll(".auth input").forEach(x=>x.onkeydown=e=>{if(e.key==="Enter")$("go").click()});
}

/* ── Dropdown tuỳ chỉnh: bo góc + animation cuộn từ từ xuống ─────────────
   Thay thế danh sách xổ xuống gốc của trình duyệt (không thể bo góc/animate).
   <select> gốc vẫn được giữ (ẩn) và vẫn bắn sự kiện "change" nên
   document.body.onchange xử lý bộ lọc như cũ. */
function closeAllSelects(){
  document.querySelectorAll(".cs-wrap.open").forEach(w=>w.classList.remove("open"));
}
document.addEventListener("click",closeAllSelects);
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeAllSelects()});

function enhanceSelects(root=document){
  root.querySelectorAll("select[data-f],select[data-sort],select[data-set]").forEach(select=>{
    if(select.dataset.csDone)return;
    select.dataset.csDone="1";

    const wrap=document.createElement("div");
    wrap.className="cs-wrap";
    select.parentNode.insertBefore(wrap,select);
    wrap.appendChild(select);
    select.style.display="none";

    const btn=document.createElement("button");
    btn.type="button";
    btn.className="cs-btn";
    btn.setAttribute("aria-haspopup","listbox");
    const label=document.createElement("span");
    label.className="cs-label";
    btn.appendChild(label);

    const list=document.createElement("ul");
    list.className="cs-list";
    list.setAttribute("role","listbox");

    const sync=()=>{
      const o=select.options[select.selectedIndex];
      label.textContent=o?o.text:"";
      list.querySelectorAll(".cs-item").forEach((li,i)=>li.classList.toggle("selected",i===select.selectedIndex));
    };

    [...select.options].forEach((o,i)=>{
      const li=document.createElement("li");
      li.className="cs-item";
      li.setAttribute("role","option");
      li.style.setProperty("--i",i);
      li.textContent=o.text;
      li.onclick=e=>{
        e.stopPropagation();
        closeAllSelects();
        if(select.selectedIndex===i)return;
        select.selectedIndex=i;
        sync();
        // chờ animation đóng chạy xong rồi mới áp dụng bộ lọc (draw() sẽ vẽ lại giao diện)
        setTimeout(()=>select.dispatchEvent(new Event("change",{bubbles:true})),200);
      };
      list.appendChild(li);
    });

    wrap.append(btn,list);
    sync();

    btn.onclick=e=>{
      e.stopPropagation();
      const willOpen=!wrap.classList.contains("open");
      closeAllSelects();
      if(willOpen){
        // Nếu bên dưới không đủ chỗ thì xổ lên phía trên
        const r=btn.getBoundingClientRect();
        const need=Math.min(list.scrollHeight,260)+12;
        wrap.classList.toggle("up",innerHeight-r.bottom<need&&r.top>need);
        wrap.classList.add("open");
      }
    };
  });
}

async function submitAuth(){
  const reg=S.mode==="register";
  try{
    const j=await api("auth/"+(reg?"register":"login"),"POST",{name:reg?$("an").value:"",email:$("ae").value,password:$("ap").value});
    S.user=j.user;
    await loadData();
    S.err="";
    go("home");
  }catch(e){
    S.err=e.message;
    draw();
  }
}

// Bắt sự kiện Click toàn cục
document.body.onclick=async e=>{
  // 1. Lọc Chuyên Ngành trong Tab Nổi Bật
  const ffBtn=e.target.closest("[data-ff]");
  if(ffBtn){
    S.featuredFilter=ffBtn.dataset.ff;
    draw();
    return;
  }

  // 3. Sao Chép Trích Dẫn APA
  const citeBtn=e.target.closest("[data-cite]");
  if(citeBtn){
    copyCitation(citeBtn.dataset.cite);
    return;
  }

  // 4. Các nút bấm và tương tác khác
  const b=e.target.closest("button")||e.target.closest(".brand");
  if(!b)return;
  const d=b.dataset;

  if("settings" in d){
    S.view="settings";
    draw();
    scrollTo({top:0,behavior:"smooth"});
    return;
  }
  if(d.lang){
    S.lang=d.lang;
    draw();
    return;
  }
  if(d.v){
    if(d.v==="auth")needLogin();
    else go(d.v);
    return;
  }
  if(d.e){
    ask(d.e);
    return;
  }
  if(d.o){
    openD(d.o);
    return;
  }
  if(d.m){
    S.mode=d.m;
    S.err="";
    draw();
    return;
  }
  if(d.fill){
    const[a,p]=d.fill.split("|");
    if($("ae"))$("ae").value=a;
    if($("ap"))$("ap").value=p;
    return;
  }
  if(b.id==="go"){
    submitAuth();
    return;
  }
  if("out" in d){
    await api("auth/logout","POST").catch(()=>{});
    S.user=null;
    Object.assign(S,blank());
    go("home");
    return;
  }
  if(d.s){
    const idx=S.saved.findIndex(x=>x.t===d.s);
    if(idx<0){
      const it=get(d.s);
      if(it)S.saved.push(it);
      showToast("🔖 Đã lưu tài liệu vào thư viện cá nhân");
    }else{
      S.saved.splice(idx,1);
      Object.values(S.colls).forEach(a=>{
        const j=a.indexOf(d.s);
        if(j>=0)a.splice(j,1);
      });
      showToast("Đã xóa khỏi thư viện lưu trữ");
    }
    persist();
    draw();
    return;
  }
  if(d.h){
    ask(S.hist[+d.h].q,false);
    return;
  }
  if(d.d){
    S.hist.splice(+d.d,1);
    persist();
    draw();
    return;
  }
  if(b.id==="ca"){
    S.hist=[];
    persist();
    draw();
    return;
  }
  if(b.id==="addk"){
    try{
      const f=S.form,pv=S.providers[f.provider];
      S.keys=(await api("admin/keys","POST",{provider:f.provider,model:f.model||pv.models[0].id,key:f.key})).keys;
      S.form.key="";
      S.msg="";
    }catch(er){
      S.msg=er.message;
    }
    draw();
    return;
  }
  if(d.t){
    S.test[d.t]=S.lang==="vi"?"đang thử…":"testing…";
    draw();
    try{
      const j=await api("admin/keys/"+d.t+"/test","POST");
      S.test[d.t]=j.ok?"✓ "+(S.lang==="vi"?"hoạt động, ":"ok, ")+j.msg:"✗ "+j.error;
    }catch(er){
      S.test[d.t]="✗ "+er.message;
    }
    draw();
    return;
  }
  if(d.k){
    if(confirm(t().deleteKey)){
      try{
        S.keys=(await api("admin/keys/"+d.k,"DELETE")).keys;
      }catch(er){
        S.msg=er.message;
      }
      draw();
    }
    return;
  }
};

document.body.onchange=e=>{
  const s=e.target,d=s.dataset;
  if(s.id==="deep-cb"){toggleDeep(s.checked);return}
  if(d.f){
    S.crit[d.f]=d.f==="from"&&s.value?+s.value:s.value;
    draw();
  }
  else if("sort" in d){
    S.sort=s.value;
    draw();
  }
  else if(d.c&&s.value){
    const a=S.colls[s.value];
    if(!a.includes(d.c))a.push(d.c);
    persist();
    draw();
    showToast(`Đã thêm vào bộ sưu tập: ${s.value}`);
  }
  else if("ap" in d){
    S.form.provider=s.value;
    S.form.model="";
    draw();
  }
  else if("am" in d){
    S.form.model=s.value;
  }
};

window.addEventListener("resize",()=>{
  updateBubbleSlider(true);
});
// Font tải xong làm độ rộng tab thay đổi -> căn lại bong bóng, không chạy animation
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>updateBubbleSlider(true));

// Khởi chạy ứng dụng
(async()=>{
  try{
    const me=await api("auth/me");
    S.user=me.user;
    if(S.user)await loadData();
  }catch(e){
    S.offline=e instanceof TypeError;
  }
  draw();
})();
