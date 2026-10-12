/* ═══════════════════════════════════════════════════════════════════════════
   AcademAI: Cài đặt người dùng, menu tài khoản, quản lý bộ sưu tập, phân trang kết quả,
   liên kết nhập trích dẫn (BibTeX, EndNote, RefMan, RefWorks) và liên kết thư viện.
   File này được nạp TRƯỚC app.js. Mọi thứ chỉ dùng biến chung (S, t, $, esc, api, draw, go, gate, get,
   persist, showToast, opt, blank, sortRes, closeAllSelects) tại thời điểm chạy, không dùng lúc nạp file.
   ═══════════════════════════════════════════════════════════════════════════ */

const SX_DEFAULT={perPage:10,newTab:false,cite:"none",citeFmt:"bibtex",resultLang:"all",libs:[]};
const SX_PER_PAGE=[10,20,50,100];
const SX_FORMATS=[["bibtex","BibTeX"],["endnote","EndNote"],["refman","RefMan"],["refworks","RefWorks"]];
const SX_PROTECTED=["Đọc sau","Tham khảo luận văn"]; // bộ sưu tập mặc định: không đổi tên / xóa
const SX_MAX_COLLS=20,SX_MAX_LIBS=5;

/* ── Chuỗi giao diện (vi / en) ──────────────────────────────────────────── */
const SXT={
  vi:{
    saved:"✓ Đã lưu cài đặt",
    tSearch:"Kết quả tìm kiếm",tLang:"Ngôn ngữ",tLib:"Liên kết thư viện",tAcc:"Tài khoản",
    perPage:"Số kết quả trên mỗi trang",
    perPageHint:"Số tài liệu hiển thị trên mỗi trang ở trang kết quả tìm kiếm.",
    newTab:"Mở kết quả được chọn trong cửa sổ trình duyệt mới",
    newTabHint:"Tắt (mặc định): bấm vào kết quả sẽ hiện hộp thoại chi tiết ngay trên trang. Bật: mở liên kết gốc của tài liệu trong một tab mới.",
    citeTitle:"Liên kết nhập trích dẫn",
    citeHint:"Chọn có hiển thị liên kết để nhập lời trích dẫn vào phần mềm quản lý tài liệu tham khảo hay không.",
    citeNone:"Không hiển thị bất kỳ liên kết nhập trích dẫn",
    citeShow:"Hiển thị các liên kết để nhập lời trích dẫn vào",
    citeFmt:"Nhập trích dẫn vào",
    impLabel:f=>`Nhập vào ${f}`,
    uiLang:"Ngôn ngữ giao diện",uiLangHint:"Ngôn ngữ của menu, nút bấm và thông báo.",
    resLang:"Ngôn ngữ kết quả tìm kiếm",
    resLangHint:"Chỉ hiện tài liệu viết bằng ngôn ngữ đã chọn (nhận diện theo dữ liệu của nguồn hoặc theo tiêu đề).",
    rlAll:"Tất cả ngôn ngữ",rlVi:"Chỉ tiếng Việt",rlEn:"Chỉ tiếng Anh",
    bIntro:"Thêm thư viện của trường hoặc cơ quan bạn. Mỗi kết quả sẽ có thêm liên kết để tìm đúng tài liệu đó trong thư viện.",
    bName:"Tên thư viện",bNamePh:"VD: Thư viện Trường Đại học A",
    bUrl:"Địa chỉ trang tìm kiếm của thư viện",bUrlPh:"https://thuvien.example.edu.vn/search?q={q}",
    bUrlHint:"Dùng {q} làm chỗ chèn tiêu đề tài liệu. Nếu không có {q}, hệ thống sẽ thêm ?q=… vào cuối địa chỉ.",
    bAdd:"Thêm thư viện",bEmpty:"Chưa có thư viện nào.",bRemove:"Xóa",
    bErrName:"Hãy nhập tên thư viện.",bErrUrl:"Địa chỉ phải bắt đầu bằng http:// hoặc https://",
    bMax:`Tối đa ${SX_MAX_LIBS} thư viện.`,
    libFind:n=>`Tìm tại ${n}`,
    aInfo:"Thông tin tài khoản",aName:"Tên hiển thị",aEmail:"Email",aRole:"Vai trò",aSaveName:"Lưu tên",aNameOk:"✓ Đã cập nhật tên hiển thị",
    roleAdmin:"Quản trị viên",roleUser:"Người dùng",
    pwTitle:"Đổi mật khẩu",pwCur:"Mật khẩu hiện tại",pwNew:"Mật khẩu mới (tối thiểu 6 ký tự)",pwNew2:"Nhập lại mật khẩu mới",pwSave:"Đổi mật khẩu",
    pwShort:"Mật khẩu mới tối thiểu 6 ký tự.",pwMismatch:"Mật khẩu nhập lại không khớp.",pwOk:"✓ Đã đổi mật khẩu",
    exTitle:"Dữ liệu của bạn",exHint:"Tải xuống tài liệu đã lưu, bộ sưu tập, lịch sử tìm kiếm và cài đặt dưới dạng tệp JSON.",exBtn:"Tải dữ liệu xuống",
    dTitle:"Vùng nguy hiểm",
    dText:"Xóa tài khoản sẽ xóa vĩnh viễn tài liệu đã lưu, bộ sưu tập, lịch sử tìm kiếm và cài đặt. Không thể hoàn tác.",
    dPw:"Nhập mật khẩu để xác nhận",dType:"Gõ XOA để xác nhận",dWord:"XOA",dBtn:"Xóa tài khoản vĩnh viễn",
    dBadWord:"Hãy gõ đúng chữ XOA để xác nhận.",dNeedPw:"Hãy nhập mật khẩu.",dConfirm:"Bạn chắc chắn muốn xóa vĩnh viễn tài khoản này?",dDone:"Tài khoản đã được xóa.",
    about:"Về AcademAI Resource Discovery",
    aboutText:"Hệ thống tìm kiếm tài liệu học thuật thông minh, tích hợp OpenAlex, Crossref, Google Books cùng mô hình ngôn ngữ lớn (LLM) để hiểu ngữ cảnh câu hỏi, phân tích chuyên sâu và tóm tắt tài liệu.",
    cNew:"Tạo bộ sưu tập",cNewTitle:"Tạo bộ sưu tập mới",cRenTitle:"Đổi tên bộ sưu tập",cName:"Tên bộ sưu tập",cPh:"VD: Tài liệu chương 2",
    cCreate:"Tạo",cSave:"Lưu",cCancel:"Hủy",
    cEmptyErr:"Hãy nhập tên bộ sưu tập.",cDupErr:"Đã có bộ sưu tập trùng tên.",cMaxErr:`Tối đa ${SX_MAX_COLLS} bộ sưu tập.`,
    cCreated:n=>`Đã tạo bộ sưu tập “${n}”`,cRenamed:n=>`Đã đổi tên thành “${n}”`,cDeleted:n=>`Đã xóa bộ sưu tập “${n}”`,
    cDelConfirm:n=>`Xóa bộ sưu tập “${n}”? Các tài liệu vẫn còn trong mục Đã lưu.`,
    cRename:"Đổi tên",cDelete:"Xóa bộ sưu tập",cRm:"Gỡ khỏi bộ sưu tập",
    pPrev:"‹ Trước",pNext:"Sau ›",
    umMenu:"Menu tài khoản",
    tTheme:"Giao diện",
    themeTitle:"Giao diện hiển thị",
    themeHint:"Chọn nền cho toàn bộ ứng dụng. Lựa chọn được lưu trên trình duyệt này.",
    themeNight:"Ban đêm",
    themeNightDesc:"Vũ trụ về đêm: tinh vân, sao lấp lánh và thỉnh thoảng có sao chổi bay vụt qua.",
    themeLight:"Ban ngày",
    themeLightDesc:"Bầu trời xanh với mây trôi nhẹ nhàng và ánh nắng ấm áp.",
    tScholar:"Hồ sơ Scholar",
    scTitle:"Hồ sơ cá nhân Google Scholar",
    scSub:"Theo dõi trích dẫn cho bài viết của bạn. Xuất hiện trong Scholar.",
    scSwitchAcc:"Chuyển đổi tài khoản",
    scStep1:"1. Hồ sơ",
    scStep2:"2. Bài viết",
    scStep3:"3. Cập nhật & Hiển thị",
    scNameLabel:"Tên",
    scNameHint:"Tên đầy đủ như xuất hiện trên bài viết của bạn",
    scAddAlias:"+ Thêm một tên khác",
    scAffilLabel:"Mục liên kết",
    scAffilHint:"Ví dụ: Giáo sư Vật lý, Đại học Princeton",
    scEmailLabel:"Email để xác minh",
    scEmailHint:"Ví dụ: einstein@princeton.edu",
    scEmailNote:"Sử dụng địa chỉ email tại trường học hoặc cơ quan (@edu, @edu.vn,...) để xác minh đơn vị liên kết xuất hiện công khai trên hồ sơ.",
    scInterestsLabel:"Lĩnh vực quan tâm",
    scInterestsHint:"Ví dụ: thuyết tương đối rộng, lý thuyết trường thống nhất",
    scHomeLabel:"Trang chủ (không bắt buộc)",
    scHomeHint:"Ví dụ: http://www.princeton.edu/~einstein",
    scNext:"TIẾP THEO",
    scPrev:"Quay lại",
    scFinish:"HOÀN TẤT & LƯU HỒ SƠ",
    scSkip:"Bỏ qua bước này",
    scArtTitle:"Thêm bài viết vào hồ sơ Scholar",
    scArtSub:"Chọn các bài viết mà bạn đã xuất bản hoặc tham gia nghiên cứu để theo dõi chỉ số trích dẫn.",
    scArtSearch:"Tìm kiếm bài viết theo tiêu đề hoặc từ khóa...",
    scArtAddManual:"+ Thêm bài viết thủ công",
    scUpdateTitle:"Cài đặt cập nhật bài viết và quyền riêng tư",
    scUpdAuto:"Tự động cập nhật danh sách bài viết trong hồ sơ của tôi (Được đề xuất)",
    scUpdReview:"Gửi email cho tôi để xem xét và xác nhận cập nhật trước khi thêm",
    scPublic:"Đặt hồ sơ của tôi ở chế độ công khai (Để các học giả khác có thể tìm thấy và trích dẫn bài viết của bạn)",
    scAlerts:"Gửi thông báo qua email khi có tài liệu mới trích dẫn công trình của tôi",
    scSavedOk:"✓ Đã lưu hồ sơ Google Scholar thành công!",
    scEditProfile:"✎ Chỉnh sửa thông tin hồ sơ",
    scViewPublic:"Hồ sơ công khai",
    scViewPrivate:"Hồ sơ riêng tư",
    scVerifiedAt:d=>`✓ Đã xác minh email tại ${d}`,
    scStatsTitle:"Chỉ số trích dẫn",
    scAll:"Tất cả",
    scSince:"Kể từ 2021",
    scCitations:"Trích dẫn",
    scHIndex:"h-index",
    scI10Index:"i10-index",
    scArticlesList:"Danh sách bài viết",
    scNoArticles:"Chưa có bài viết nào trong hồ sơ.",
    scExportBib:"Xuất BibTeX",
    scDeleteArt:"Xóa bài này khỏi hồ sơ"
  },
  en:{
    saved:"✓ Settings saved",
    tSearch:"Search results",tLang:"Languages",tLib:"Library links",tAcc:"Account",
    perPage:"Results per page",
    perPageHint:"How many documents are shown on each page of the search results.",
    newTab:"Open selected results in a new browser window",
    newTabHint:"Off (default): clicking a result shows the detail dialog on the page. On: opens the document's original link in a new tab.",
    citeTitle:"Citation import links",
    citeHint:"Choose whether to show links for importing citations into your reference manager.",
    citeNone:"Don't show any citation import links",
    citeShow:"Show links to import citations into",
    citeFmt:"Import citations into",
    impLabel:f=>`Import into ${f}`,
    uiLang:"Interface language",uiLangHint:"Language of menus, buttons and messages.",
    resLang:"Search results language",
    resLangHint:"Only show documents written in the selected language (detected from source data or the title).",
    rlAll:"All languages",rlVi:"Vietnamese only",rlEn:"English only",
    bIntro:"Add your school or institution library. Each result gets an extra link to look that document up in the library.",
    bName:"Library name",bNamePh:"e.g. University A Library",
    bUrl:"Library search page address",bUrlPh:"https://library.example.edu/search?q={q}",
    bUrlHint:"Use {q} where the document title should go. Without {q}, ?q=… is appended to the address.",
    bAdd:"Add library",bEmpty:"No libraries yet.",bRemove:"Remove",
    bErrName:"Please enter a library name.",bErrUrl:"The address must start with http:// or https://",
    bMax:`At most ${SX_MAX_LIBS} libraries.`,
    libFind:n=>`Find at ${n}`,
    aInfo:"Account information",aName:"Display name",aEmail:"Email",aRole:"Role",aSaveName:"Save name",aNameOk:"✓ Display name updated",
    roleAdmin:"Administrator",roleUser:"User",
    pwTitle:"Change password",pwCur:"Current password",pwNew:"New password (at least 6 characters)",pwNew2:"Repeat new password",pwSave:"Change password",
    pwShort:"New password must be at least 6 characters.",pwMismatch:"The passwords don't match.",pwOk:"✓ Password changed",
    exTitle:"Your data",exHint:"Download your saved papers, collections, search history and settings as a JSON file.",exBtn:"Download my data",
    dTitle:"Danger zone",
    dText:"Deleting your account permanently removes saved papers, collections, search history and settings. This cannot be undone.",
    dPw:"Enter your password to confirm",dType:"Type DELETE to confirm",dWord:"DELETE",dBtn:"Delete account permanently",
    dBadWord:"Type DELETE exactly to confirm.",dNeedPw:"Please enter your password.",dConfirm:"Permanently delete this account?",dDone:"Your account has been deleted.",
    about:"About AcademAI Resource Discovery",
    aboutText:"An intelligent academic search system combining OpenAlex, Crossref, Google Books and large language models (LLMs) to understand your question, analyze results in depth and summarize papers.",
    cNew:"New collection",cNewTitle:"Create a new collection",cRenTitle:"Rename collection",cName:"Collection name",cPh:"e.g. Chapter 2 sources",
    cCreate:"Create",cSave:"Save",cCancel:"Cancel",
    cEmptyErr:"Please enter a collection name.",cDupErr:"A collection with this name already exists.",cMaxErr:`At most ${SX_MAX_COLLS} collections.`,
    cCreated:n=>`Collection “${n}” created`,cRenamed:n=>`Renamed to “${n}”`,cDeleted:n=>`Collection “${n}” deleted`,
    cDelConfirm:n=>`Delete collection “${n}”? Its papers stay in Saved.`,
    cRename:"Rename",cDelete:"Delete collection",cRm:"Remove from collection",
    pPrev:"‹ Prev",pNext:"Next ›",
    umMenu:"Account menu",
    tTheme:"Appearance",
    themeTitle:"Appearance",
    themeHint:"Pick the background for the whole app. Your choice is saved in this browser.",
    themeNight:"Night",
    themeNightDesc:"A starry universe with nebulae, twinkling stars and the occasional comet streaking past.",
    themeLight:"Light",
    themeLightDesc:"A blue sky with softly drifting clouds and warm sunshine.",
    tScholar:"Scholar Profile",
    scTitle:"Google Scholar Profile",
    scSub:"Track citations to your articles. Appear in Scholar.",
    scSwitchAcc:"Switch account",
    scStep1:"1. Profile",
    scStep2:"2. Articles",
    scStep3:"3. Updates & Visibility",
    scNameLabel:"Name",
    scNameHint:"Full name as it appears on your articles",
    scAddAlias:"+ Add another name",
    scAffilLabel:"Affiliation",
    scAffilHint:"e.g. Professor of Physics, Princeton University",
    scEmailLabel:"Email for verification",
    scEmailHint:"e.g. einstein@princeton.edu",
    scEmailNote:"Use an institutional or academic email address (@edu, @edu.vn,...) to show a verified affiliation badge publicly.",
    scInterestsLabel:"Areas of interest",
    scInterestsHint:"e.g. general relativity, unified field theory",
    scHomeLabel:"Homepage (optional)",
    scHomeHint:"e.g. http://www.princeton.edu/~einstein",
    scNext:"NEXT",
    scPrev:"Back",
    scFinish:"DONE & SAVE PROFILE",
    scSkip:"Skip this step",
    scArtTitle:"Add articles to your Scholar profile",
    scArtSub:"Select papers you authored or co-authored to track citations.",
    scArtSearch:"Search papers by title or keyword...",
    scArtAddManual:"+ Add article manually",
    scUpdateTitle:"Article updates and privacy settings",
    scUpdAuto:"Automatically update the list of articles in my profile (Recommended)",
    scUpdReview:"Email me to review and confirm updates before adding",
    scPublic:"Make my profile public (So other scholars can find and cite your work)",
    scAlerts:"Email me alerts when new articles cite my papers",
    scSavedOk:"✓ Google Scholar profile saved successfully!",
    scEditProfile:"✎ Edit profile info",
    scViewPublic:"Public profile",
    scViewPrivate:"Private profile",
    scVerifiedAt:d=>`✓ Verified email at ${d}`,
    scStatsTitle:"Citation metrics",
    scAll:"All",
    scSince:"Since 2021",
    scCitations:"Citations",
    scHIndex:"h-index",
    scI10Index:"i10-index",
    scArticlesList:"Articles",
    scNoArticles:"No articles in profile yet.",
    scExportBib:"Export BibTeX",
    scDeleteArt:"Remove from profile"
  }
};
const sxT=()=>SXT[S.lang]||SXT.vi;

/* ── Cài đặt: nạp / làm sạch / lưu ──────────────────────────────────────── */
function sxClean(o){
  o=o&&typeof o==="object"?o:{};
  return{
    perPage:SX_PER_PAGE.includes(+o.perPage)?+o.perPage:SX_DEFAULT.perPage,
    newTab:!!o.newTab,
    cite:o.cite==="show"?"show":"none",
    citeFmt:SX_FORMATS.some(f=>f[0]===o.citeFmt)?o.citeFmt:SX_DEFAULT.citeFmt,
    resultLang:["all","vi","en"].includes(o.resultLang)?o.resultLang:"all",
    libs:(Array.isArray(o.libs)?o.libs:[]).slice(0,SX_MAX_LIBS)
      .map(l=>({name:String(l&&l.name||"").trim().slice(0,60),url:String(l&&l.url||"").trim().slice(0,300)}))
      .filter(l=>l.name&&/^https?:\/\//i.test(l.url))
  };
}
function sxScholarClean(sc,u){
  sc=sc&&typeof sc==="object"?sc:{};
  const userName=u?(u.name||""):"Bách Xuân";
  const defArts=[
    {
      id:"sc_demo_1",
      title:"Tác động của trí tuệ nhân tạo và học máy trong phát hiện tri thức học thuật",
      authors:userName+", et al.",
      venue:"Tạp chí Khoa học & Công nghệ Quốc gia",
      year:2024,
      citations:24,
      url:"https://doi.org/10.1016/j.artint.2024.103980"
    },
    {
      id:"sc_demo_2",
      title:"Phương pháp biểu diễn tri thức và tìm kiếm ngữ nghĩa cho tài liệu khoa học",
      authors:userName+", Nguyen Van B, Le Thi C",
      venue:"Hội nghị Quốc tế về Trí tuệ Nhân tạo và Dữ liệu lớn (AIBD)",
      year:2023,
      citations:48,
      url:"https://arxiv.org/abs/2304.08912"
    },
    {
      id:"sc_demo_3",
      title:"Attention Mechanisms in Deep Transformer Networks: An Analytical Survey",
      authors:userName+", John D.",
      venue:"IEEE Transactions on Pattern Analysis and Machine Intelligence",
      year:2021,
      citations:136,
      url:"https://doi.org/10.1109/TPAMI.2021.3098765"
    }
  ];
  return{
    name:String(sc.name||userName||"Bách Xuân").trim().slice(0,100),
    aliases:Array.isArray(sc.aliases)&&sc.aliases.length?sc.aliases.map(String).map(s=>s.trim()).filter(Boolean):[],
    affiliation:String(sc.affiliation||(sc.created?"Giáo sư Vật lý, Đại học Princeton":"")).trim().slice(0,200),
    verifyEmail:String(sc.verifyEmail||(sc.created?"einstein@princeton.edu":"")).trim().slice(0,100),
    interests:Array.isArray(sc.interests)&&sc.interests.length?sc.interests.map(String).map(s=>s.trim()).filter(Boolean):["thuyết tương đối rộng","lý thuyết trường thống nhất"],
    homepage:String(sc.homepage||"").trim().slice(0,300),
    autoUpdate:sc.autoUpdate!==false,
    isPublic:sc.isPublic!==false,
    emailAlerts:sc.emailAlerts!==false,
    created:!!sc.created,
    editing:sc.created?!!sc.editing:true,
    step:Math.max(1,Math.min(3,+sc.step||1)),
    articles:Array.isArray(sc.articles)&&sc.articles.length?sc.articles:defArts
  };
}

function sxScholarInit(){
  if(S.scholar)return;
  let o=null;
  if(S.user&&S.user.scholar)o=S.user.scholar;
  else{
    try{o=JSON.parse(localStorage.getItem("academai.scholar")||"null")}catch(e){}
  }
  S.scholar=sxScholarClean(o,S.user);
}

async function sxScholarSave(silent){
  sxScholarInit();
  const sc=S.scholar;
  try{localStorage.setItem("academai.scholar",JSON.stringify(sc))}catch(e){}
  if(S.user){
    S.user.scholar=sc;
    try{
      await api("me/scholar","POST",sc);
    }catch(e){}
  }
  if(!silent)showToast(sxT().scSavedOk);
}

function sxComputeIndices(arts){
  arts=Array.isArray(arts)?arts:[];
  const curY=new Date().getFullYear(), cutoff=curY-5;
  let citAll=0, citSince=0;
  const citList=[];
  arts.forEach(a=>{
    const c=+a.citations||+a.cit||0;
    const y=+a.year||+a.y||0;
    citAll+=c;
    if(y>=cutoff)citSince+=c;
    citList.push(c);
  });
  citList.sort((a,b)=>b-a);
  let h=0;
  for(let i=0;i<citList.length;i++){
    if(citList[i]>=i+1)h=i+1;
    else break;
  }
  let i10=citList.filter(c=>c>=10).length;
  return{citAll,citSince,h,i10,cutoff};
}

function sxExportScholarBib(){
  const sc=S.scholar;if(!sc||!Array.isArray(sc.articles))return;
  const L=sc.articles.map((a,i)=>{
    const tag=(a.authors?a.authors.split(",")[0].trim().split(" ").pop():"author")+(a.year||"2024")+(i+1);
    return `@article{${tag},
  title = {${a.title||""}},
  author = {${a.authors||""}},
  journal = {${a.venue||""}},
  year = {${a.year||""}},
  note = {Citations: ${a.citations||0}},
  url = {${a.url||""}}
}`;
  });
  sxDownload((sc.name||"scholar")+"-citations.bib",L.join("\n\n")+"\n","application/x-bibtex");
}

function sxScholarSyncStep1(){
  if(!$("sc-in-name"))return;
  S.scholar.name=$("sc-in-name").value.trim();
  S.scholar.affiliation=$("sc-in-affil")?$("sc-in-affil").value.trim():"";
  S.scholar.verifyEmail=$("sc-in-vemail")?$("sc-in-vemail").value.trim():"";
  const intVal=$("sc-in-interests")?$("sc-in-interests").value.trim():"";
  S.scholar.interests=intVal.split(",").map(s=>s.trim()).filter(Boolean);
  S.scholar.homepage=$("sc-in-home")?$("sc-in-home").value.trim():"";
}

function sxScholarSyncStep3(){
  const autoRadio=document.querySelector('input[name="sc-auto-upd"]:checked');
  if(autoRadio)S.scholar.autoUpdate=autoRadio.value==="auto";
  const pubBox=$("sc-in-public");
  if(pubBox)S.scholar.isPublic=pubBox.checked;
  const alertBox=$("sc-in-alerts");
  if(alertBox)S.scholar.emailAlerts=alertBox.checked;
}

function sxInit(){
  if(S.settings)return;
  let o=null;
  try{o=JSON.parse(localStorage.getItem("academai.settings")||"null")}catch(e){}
  S.settings=sxClean(o);
  if(o&&o.lang)S.lang=o.lang==="en"?"en":"vi";
  if(!S.page)S.page=1;
  if(!S.setTab)S.setTab="search";
  sxScholarInit();
}
// Gọi sau khi đăng nhập / tải lại trang: cài đặt trên máy chủ được ưu tiên.
function sxApply(){
  sxInit();
  if(!S.user)return;
  if(S.user.settings){
    S.settings=sxClean(S.user.settings);
    S.lang=S.user.settings.lang==="en"?"en":"vi";
  }else sxSave();
  if(S.user.scholar){
    S.scholar=sxScholarClean(S.user.scholar,S.user);
  }
}
let sxTimer=0;
function sxSave(){
  sxInit();
  const payload={...S.settings,lang:S.lang};
  try{localStorage.setItem("academai.settings",JSON.stringify(payload))}catch(e){}
  if(S.user){
    S.user.settings=payload;
    clearTimeout(sxTimer);
    sxTimer=setTimeout(()=>api("me/settings","PUT",payload).catch(()=>{}),300);
  }
}
const sxSaved=()=>showToast(sxT().saved);

/* ── Lọc ngôn ngữ + phân trang kết quả ──────────────────────────────────── */
const SX_VI_CHARS=/[ăâđêôơưàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũỳýỵỷỹ]/i;
function sxDocLang(d){
  const l=String(d.lang||"").toLowerCase();
  if(l)return l.startsWith("vi")?"vi":l.startsWith("en")?"en":l.slice(0,2);
  return SX_VI_CHARS.test(d.t||"")?"vi":"en"; // chỉ xét tiêu đề (tóm tắt có thể đã được AI dịch sang tiếng Việt)
}
function langOk(d){
  sxInit();
  const r=S.settings.resultLang;
  return r==="all"||sxDocLang(d)===r;
}
function filteredResults(){
  const c=S.crit||{topics:[],type:"",from:""};
  return sortRes(S.results.filter(x=>(!c.type||x.type===c.type)&&(!c.from||!x.y||x.y>=c.from)&&langOk(x)));
}
function pageSlice(r){
  sxInit();
  const pp=S.settings.perPage,pages=Math.max(1,Math.ceil(r.length/pp));
  S.page=Math.min(Math.max(1,S.page||1),pages);
  return r.slice((S.page-1)*pp,S.page*pp);
}
function pager(total){
  sxInit();
  const pp=S.settings.perPage,pages=Math.ceil(total/pp),cur=S.page||1,L=sxT();
  if(pages<=1)return"";
  const nums=[];
  for(let i=1;i<=pages;i++){
    if(i===1||i===pages||Math.abs(i-cur)<=2)nums.push(i);
    else if(nums[nums.length-1]!=="…")nums.push("…");
  }
  return`<nav class="pager" aria-label="pagination">
    <button type="button" class="pg" data-pg="prev" ${cur<=1?"disabled":""}>${esc(L.pPrev)}</button>
    ${nums.map(n=>n==="…"?`<span class="pg-gap">…</span>`:`<button type="button" class="pg ${n===cur?"on":""}" data-pg="${n}" ${n===cur?'aria-current="page"':""}>${n}</button>`).join("")}
    <button type="button" class="pg" data-pg="next" ${cur>=pages?"disabled":""}>${esc(L.pNext)}</button>
  </nav>`;
}

/* ── Liên kết dưới mỗi kết quả: nhập trích dẫn + thư viện ───────────────── */
const sxAscii=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D");
const sxOne=s=>String(s==null?"":s).replace(/\s+/g," ").trim();
function sxKey(d){
  const au=(d.a&&d.a[0])||"";
  const last=sxAscii(String(au).trim().split(/\s+/).pop()).replace(/[^A-Za-z0-9]/g,"").toLowerCase()||"ref";
  const w=(sxAscii(d.t).match(/[A-Za-z]{4,}/)||["doc"])[0].toLowerCase();
  return last+(d.y||"")+w;
}
const sxKind=d=>{const ty=String(d.type||"");return ty==="Sách"?"book":ty==="Luận văn"?"ms":ty==="Luận án"?"phd":"article"};
function sxBuild(d,fmt){
  const au=(d.a||[]).map(sxOne).filter(Boolean),y=d.y||"",v=sxOne(d.venue),url=d.url||"",doi=d.doi||"",k=sxKind(d);
  if(fmt==="bibtex"){
    const bv=s=>sxOne(s).replace(/[{}]/g,"");
    const ty={article:"article",book:"book",ms:"mastersthesis",phd:"phdthesis"}[k];
    const vf={article:"journal",book:"publisher",ms:"school",phd:"school"}[k];
    const f=[["title","{"+bv(d.t)+"}"],["author",au.map(bv).join(" and ")],["year",y],[vf,bv(v)],["doi",doi],["url",url]].filter(x=>x[1]);
    return[`@${ty}{${sxKey(d)},\n${f.map(([a,b])=>`  ${a}={${b}}`).join(",\n")}\n}\n`,"bib"];
  }
  if(fmt==="endnote"){
    const ty={article:"Journal Article",book:"Book",ms:"Thesis",phd:"Thesis"}[k];
    const L=[`%0 ${ty}`,...au.map(a=>`%A ${a}`),`%T ${sxOne(d.t)}`];
    if(y)L.push(`%D ${y}`);
    if(v)L.push(`${k==="article"?"%J":"%I"} ${v}`);
    if(doi)L.push(`%R ${doi}`);
    if(url)L.push(`%U ${url}`);
    return[L.join("\n")+"\n","enw"];
  }
  if(fmt==="refman"){
    const ty={article:"JOUR",book:"BOOK",ms:"THES",phd:"THES"}[k];
    const L=[`TY  - ${ty}`,...au.map(a=>`AU  - ${a}`),`TI  - ${sxOne(d.t)}`];
    if(y)L.push(`PY  - ${y}`);
    if(v)L.push(`${k==="article"?"JO":"PB"}  - ${v}`);
    if(doi)L.push(`DO  - ${doi}`);
    if(url)L.push(`UR  - ${url}`);
    L.push("ER  - ");
    return[L.join("\n")+"\n","ris"];
  }
  // RefWorks (định dạng thẻ RefWorks)
  const ty={article:"Journal Article",book:"Book, Whole",ms:"Dissertation/Thesis",phd:"Dissertation/Thesis"}[k];
  const L=[`RT ${ty}`,...au.map(a=>`A1 ${a}`),`T1 ${sxOne(d.t)}`];
  if(y)L.push(`YR ${y}`);
  if(v)L.push(`${k==="article"?"JF":"PB"} ${v}`);
  if(doi)L.push(`DO ${doi}`);
  if(url)L.push(`LK ${url}`);
  L.push("ER ");
  return[L.join("\n")+"\n","txt"];
}
function sxDownload(name,text,type){
  const a=document.createElement("a"),href=URL.createObjectURL(new Blob([text],{type:(type||"text/plain")+";charset=utf-8"}));
  a.href=href;a.download=name;a.style.display="none";document.body.appendChild(a);a.click();
  setTimeout(()=>{a.remove();URL.revokeObjectURL(href)},600);
}
function sxImport(title){
  const d=get(title);if(!d)return;
  sxInit();
  const[text,ext]=sxBuild(d,S.settings.citeFmt);
  sxDownload(sxKey(d)+"."+ext,text);
}
function sxLibUrl(l,d){
  const q=encodeURIComponent(d.t||"");
  return l.url.includes("{q}")?l.url.split("{q}").join(q):l.url+(l.url.includes("?")?"&":"?")+"q="+q;
}
function resLinks(d){
  sxInit();
  const s=S.settings,L=sxT(),out=[];
  if(s.cite==="show"){
    const f=SX_FORMATS.find(x=>x[0]===s.citeFmt);
    out.push(`<button type="button" class="lnk sx-lnk" data-imp="${esc(d.t)}">${esc(L.impLabel(f?f[1]:""))}</button>`);
  }
  (s.libs||[]).forEach(l=>out.push(`<a class="lnk sx-lnk" href="${esc(sxLibUrl(l,d))}" target="_blank" rel="noopener noreferrer">${esc(L.libFind(l.name))}</a>`));
  return out.length?`<div class="sx-links">${out.join("")}</div>`:"";
}

/* ── Menu người dùng (dropdown Cài đặt / Đăng xuất) ─────────────────────── */
const sxIco=p=>`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const SX_GEAR='<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>';
const SX_OUT='<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>';

const themeBtnHtml=()=>window.AcademTheme?window.AcademTheme.toggleHtml(S.lang):"";
function userNavHtml(){
  sxInit();
  const u=S.user,L=sxT(),th=themeBtnHtml();
  if(u){
    return`${th}<div class="user-menu" id="user-menu">
      <button type="button" class="user-pill" data-umenu aria-haspopup="menu" aria-expanded="false" aria-label="${esc(L.umMenu)}" title="${esc(u.email||"")}">
        <span class="user-avatar">${esc((u.name||"U").charAt(0).toUpperCase())}</span>
        <span class="user-info-text">
          <span class="user-name">${esc(u.name)}</span>
          ${u.role==="admin"?'<span class="user-role">Admin</span>':""}
        </span>
        <svg class="um-caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
      <div class="um-list" role="menu">
        <div class="um-head"><b>${esc(u.name)}</b><small>${esc(u.email||"")}</small></div>
        <button type="button" class="um-item" role="menuitem" data-stab="scholar">${sxIco('<path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path>')}<span>${S.lang==="vi"?"Hồ sơ Scholar":"Scholar Profile"}</span></button>
        <button type="button" class="um-item" role="menuitem" data-settings>${sxIco(SX_GEAR)}<span>${S.lang==="vi"?"Cài đặt":"Settings"}</span></button>
        <button type="button" class="um-item um-danger" role="menuitem" data-out>${sxIco(SX_OUT)}<span>${esc(t().logout)}</span></button>
      </div>
    </div>`;
  }
  return`${th}<div class="lang-toggle" role="group" aria-label="Language">
      <button type="button" data-lang="vi" class="${S.lang==="vi"?"on":""}">VI</button>
      <button type="button" data-lang="en" class="${S.lang==="en"?"on":""}">EN</button>
    </div>
    <button class="btn-login-hd" data-v="auth">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
      <span>${esc(t().login)}</span>
    </button>`;
}
function sxToggleMenu(force){
  const m=$("user-menu");if(!m)return;
  const open=force===undefined?!m.classList.contains("open"):force;
  m.classList.toggle("open",open);
  const b=m.querySelector("[data-umenu]");
  if(b)b.setAttribute("aria-expanded",open?"true":"false");
}

/* ── Trang Cài đặt ──────────────────────────────────────────────────────── */
const sxSwitch=(key,on)=>`<button type="button" class="st-switch ${on?"on":""}" role="switch" aria-checked="${on?"true":"false"}" data-tg="${key}"><i></i></button>`;

function sxSearchPanel(){
  const L=sxT(),s=S.settings;
  return`<h3 class="st-h">${esc(L.tSearch)}</h3>
  <div class="st-row">
    <div class="st-txt"><b>${esc(L.perPage)}</b><small>${esc(L.perPageHint)}</small></div>
    <div class="st-ctl"><select data-set="perPage">${SX_PER_PAGE.map(n=>opt(n,s.perPage,n)).join("")}</select></div>
  </div>
  <div class="st-row">
    <div class="st-txt"><b>${esc(L.newTab)}</b><small>${esc(L.newTabHint)}</small></div>
    <div class="st-ctl st-ctl-sw">${sxSwitch("newTab",s.newTab)}</div>
  </div>
  <div class="st-block">
    <b>${esc(L.citeTitle)}</b><small>${esc(L.citeHint)}</small>
    <label class="st-radio"><input type="radio" name="cm" value="none" ${s.cite==="none"?"checked":""}><span>${esc(L.citeNone)}</span></label>
    <label class="st-radio"><input type="radio" name="cm" value="show" ${s.cite==="show"?"checked":""}><span>${esc(L.citeShow)}</span></label>
    ${s.cite==="show"?`<div class="st-sub"><label class="st-l">${esc(L.citeFmt)}</label><div class="st-ctl wide"><select data-set="citeFmt">${SX_FORMATS.map(([k,l])=>opt(k,s.citeFmt,l)).join("")}</select></div></div>`:""}
  </div>`;
}
function sxThemePanel(){
  const L=sxT(),cur=window.AcademTheme?window.AcademTheme.get():"night";
  const card=(id,name,desc)=>`<button type="button" class="th-card${cur===id?" on":""}" role="radio" aria-checked="${cur===id}" data-theme-set="${id}">
      <span class="th-prev th-prev-${id}" aria-hidden="true"></span>
      <span class="th-name">${esc(name)}<i class="th-check">✓</i></span>
      <span class="th-desc">${esc(desc)}</span>
    </button>`;
  return`<h3 class="st-h">${esc(L.themeTitle)}</h3>
  <p class="st-intro">${esc(L.themeHint)}</p>
  <div class="th-cards" role="radiogroup">${card("night",L.themeNight,L.themeNightDesc)}${card("light",L.themeLight,L.themeLightDesc)}</div>`;
}
function sxLangPanel(){
  const L=sxT(),s=S.settings;
  return`<h3 class="st-h">${esc(L.tLang)}</h3>
  <div class="st-row">
    <div class="st-txt"><b>${esc(L.uiLang)}</b><small>${esc(L.uiLangHint)}</small></div>
    <div class="st-ctl st-ctl-btns">
      <button type="button" class="btn${S.lang==="vi"?" p":""}" data-lang="vi">🇻🇳 Tiếng Việt</button>
      <button type="button" class="btn${S.lang==="en"?" p":""}" data-lang="en">🇬🇧 English</button>
    </div>
  </div>
  <div class="st-row">
    <div class="st-txt"><b>${esc(L.resLang)}</b><small>${esc(L.resLangHint)}</small></div>
    <div class="st-ctl"><select data-set="resultLang">${opt("all",s.resultLang,esc(L.rlAll))}${opt("vi",s.resultLang,esc(L.rlVi))}${opt("en",s.resultLang,esc(L.rlEn))}</select></div>
  </div>`;
}
function sxLibPanel(){
  const L=sxT(),libs=S.settings.libs;
  return`<h3 class="st-h">${esc(L.tLib)}</h3>
  <p class="st-intro">${esc(L.bIntro)}</p>
  <div class="st-liblist">
    ${libs.map((l,i)=>`<div class="st-lib"><div class="g"><b>${esc(l.name)}</b><small>${esc(l.url)}</small></div><button type="button" class="x" data-libdel="${i}">${esc(L.bRemove)}</button></div>`).join("")||`<div class="st-empty">${esc(L.bEmpty)}</div>`}
  </div>
  <div class="st-form st-sec">
    <label class="st-l" for="lib-name">${esc(L.bName)}</label>
    <input class="st-in" id="lib-name" maxlength="60" autocomplete="off" placeholder="${esc(L.bNamePh)}">
    <label class="st-l" for="lib-url">${esc(L.bUrl)}</label>
    <input class="st-in" id="lib-url" maxlength="300" autocomplete="off" inputmode="url" placeholder="${esc(L.bUrlPh)}">
    <small class="st-hint">${esc(L.bUrlHint)}</small>
    <div class="st-msg err" id="lib-msg"></div>
    <button type="button" class="btn p" id="lib-add" style="margin-top:6px">${esc(L.bAdd)}</button>
  </div>`;
}
function sxAccountPanel(){
  const L=sxT(),u=S.user;
  return`<h3 class="st-h">${esc(L.tAcc)}</h3>
  <div class="st-form st-sec first">
    <h4 class="st-h4">${esc(L.aInfo)}</h4>
    <label class="st-l" for="acc-name">${esc(L.aName)}</label>
    <input class="st-in" id="acc-name" maxlength="60" value="${esc(u.name)}" autocomplete="name">
    <label class="st-l">${esc(L.aEmail)}</label>
    <input class="st-in" value="${esc(u.email||"")}" readonly tabindex="-1">
    <label class="st-l">${esc(L.aRole)}</label>
    <input class="st-in" value="${esc(u.role==="admin"?L.roleAdmin:L.roleUser)}" readonly tabindex="-1">
    <div class="st-msg err" id="acc-msg"></div>
    <button type="button" class="btn p" id="acc-name-save">${esc(L.aSaveName)}</button>
  </div>
  <div class="st-form st-sec">
    <h4 class="st-h4">${esc(L.pwTitle)}</h4>
    <label class="st-l" for="pw-cur">${esc(L.pwCur)}</label>
    <input class="st-in" id="pw-cur" type="password" autocomplete="current-password">
    <label class="st-l" for="pw-new">${esc(L.pwNew)}</label>
    <input class="st-in" id="pw-new" type="password" autocomplete="new-password">
    <label class="st-l" for="pw-new2">${esc(L.pwNew2)}</label>
    <input class="st-in" id="pw-new2" type="password" autocomplete="new-password">
    <div class="st-msg err" id="pw-msg"></div>
    <button type="button" class="btn p" id="pw-save">${esc(L.pwSave)}</button>
  </div>
  <div class="st-sec">
    <h4 class="st-h4">${esc(L.exTitle)}</h4>
    <p class="st-intro">${esc(L.exHint)}</p>
    <button type="button" class="btn" id="acc-export">${esc(L.exBtn)}</button>
  </div>
  <div class="st-danger st-form">
    <h4 class="st-h4 st-h4-danger">${esc(L.dTitle)}</h4>
    <p class="st-intro">${esc(L.dText)}</p>
    <label class="st-l" for="del-pw">${esc(L.dPw)}</label>
    <input class="st-in" id="del-pw" type="password" autocomplete="current-password">
    <label class="st-l" for="del-word">${esc(L.dType)}</label>
    <input class="st-in" id="del-word" autocomplete="off" placeholder="${esc(L.dWord)}">
    <div class="st-msg err" id="del-msg"></div>
    <button type="button" class="btn btn-danger" id="acc-del">${esc(L.dBtn)}</button>
  </div>
  <div class="st-about"><b>${esc(L.about)}</b><p>${esc(L.aboutText)}</p></div>`;
}

function sxGetScholarCandidates(){
  const sc = S.scholar || {};
  const curArts = Array.isArray(sc.articles) ? sc.articles : [];
  const candidates = [
    ...curArts,
    ...(typeof FEATURED_PAPERS !== "undefined" ? FEATURED_PAPERS.slice(0, 15).map(p=>({
      id: "feat_"+p.id,
      title: p.t,
      authors: Array.isArray(p.a) ? p.a.join(", ") : String(p.a||""),
      venue: p.venue||"",
      year: p.y||"",
      citations: parseInt(String(p.cites||"0").replace(/\D/g,""))||20,
      url: p.url||""
    })) : [])
  ];
  const seen = new Set();
  const unique = [];
  candidates.forEach(c => {
    const k = (c.title||"").toLowerCase().trim();
    if(k && !seen.has(k)){ seen.add(k); unique.push(c); }
  });
  return unique;
}

function sxScholarPanel(){
  const L=sxT(), u=S.user, sc=S.scholar;
  if(!sc)return"";
  
  const banner=`<div class="sc-head-banner">
    <h4 class="sc-head-title">${esc(L.scSub)}</h4>
    <div class="sc-acc-bar">
      <span class="sc-acc-email">${esc(u.email||"user@example.com")}</span>
      <button type="button" class="sc-switch-acc" data-out>${esc(L.scSwitchAcc)}</button>
    </div>
  </div>`;

  if(sc.editing || !sc.created){
    const step = sc.step || 1;
    const stepper = `<div class="sc-stepper" role="tablist">
      <button type="button" class="sc-step-item ${step===1?'active':(step>1?'done':'')}" data-sc-goto="1">
        <span class="sc-step-num">${step>1?'✓':'1'}</span>
        <span class="sc-step-label">${esc(L.scStep1)}</span>
      </button>
      <button type="button" class="sc-step-item ${step===2?'active':(step>2?'done':'')}" data-sc-goto="2">
        <span class="sc-step-num">${step>2?'✓':'2'}</span>
        <span class="sc-step-label">${esc(L.scStep2)}</span>
      </button>
      <button type="button" class="sc-step-item ${step===3?'active':''}" data-sc-goto="3">
        <span class="sc-step-num">3</span>
        <span class="sc-step-label">${esc(L.scStep3)}</span>
      </button>
    </div>`;

    if(step === 1){
      const aliases = Array.isArray(sc.aliases) ? sc.aliases : [];
      const aliasPills = aliases.map((al,idx)=>`
        <span class="sc-alias-pill">
          <span>${esc(al)}</span>
          <button type="button" class="x" data-sc-del-alias="${idx}" title="Xóa">✕</button>
        </span>
      `).join("");

      const suggestedTags = [
        "thuyết tương đối rộng", "lý thuyết trường thống nhất", "Trí tuệ nhân tạo",
        "Học sâu", "Vật lý lý thuyết", "Kinh tế học", "Khoa học máy tính", "Xử lý ngôn ngữ tự nhiên"
      ];
      const tagsHtml = suggestedTags.map(tg=>`
        <button type="button" class="sc-suggest-chip" data-sc-pick-tag="${esc(tg)}">+ ${esc(tg)}</button>
      `).join("");

      return `<div class="sc-wrap">
        ${banner}
        ${stepper}
        <form class="sc-form" id="sc-form-step1" onsubmit="return false;">
          <div class="sc-fld">
            <label class="sc-label" for="sc-in-name">${esc(L.scNameLabel)}</label>
            <span class="sc-sublabel">${esc(L.scNameHint)}</span>
            <input class="st-in" id="sc-in-name" value="${esc(sc.name||u.name||"")}" placeholder="VD: Bách Xuân" autocomplete="name" required>
            <div class="sc-alias-sec">
              <button type="button" class="sc-add-alias-btn" id="sc-btn-show-alias">${esc(L.scAddAlias)}</button>
              <div id="sc-alias-input-wrap" style="display:none; margin:8px 0; align-items:center; gap:8px;">
                <input class="st-in" id="sc-alias-in" placeholder="VD: B. Xuan" style="max-width:260px; margin:0;" maxlength="60">
                <button type="button" class="btn p" id="sc-btn-add-alias" style="padding:6px 14px; font-size:0.86rem;">+ Thêm</button>
                <button type="button" class="btn" id="sc-btn-cancel-alias" style="padding:6px 12px; font-size:0.86rem;">✕</button>
              </div>
              <div class="sc-alias-list" id="sc-alias-container">${aliasPills}</div>
            </div>
          </div>

          <div class="sc-fld">
            <label class="sc-label" for="sc-in-affil">${esc(L.scAffilLabel)}</label>
            <span class="sc-sublabel">${esc(L.scAffilHint)}</span>
            <input class="st-in" id="sc-in-affil" value="${esc(sc.affiliation||"")}" placeholder="${esc(L.scAffilHint)}">
          </div>

          <div class="sc-fld">
            <label class="sc-label" for="sc-in-vemail">${esc(L.scEmailLabel)}</label>
            <span class="sc-sublabel">${esc(L.scEmailHint)}</span>
            <input class="st-in" id="sc-in-vemail" type="email" value="${esc(sc.verifyEmail||"")}" placeholder="${esc(L.scEmailHint)}">
            <small class="st-hint">${esc(L.scEmailNote)}</small>
          </div>

          <div class="sc-fld">
            <label class="sc-label" for="sc-in-interests">${esc(L.scInterestsLabel)}</label>
            <span class="sc-sublabel">${esc(L.scInterestsHint)}</span>
            <input class="st-in" id="sc-in-interests" value="${esc(Array.isArray(sc.interests)?sc.interests.join(", "):"")}" placeholder="${esc(L.scInterestsHint)}">
            <div class="sc-tags-suggest">
              ${tagsHtml}
            </div>
          </div>

          <div class="sc-fld">
            <label class="sc-label" for="sc-in-home">${esc(L.scHomeLabel)}</label>
            <span class="sc-sublabel">${esc(L.scHomeHint)}</span>
            <input class="st-in" id="sc-in-home" type="url" value="${esc(sc.homepage||"")}" placeholder="${esc(L.scHomeHint)}">
          </div>

          <div class="sc-actions-row">
            <div></div>
            <button type="button" class="sc-btn-next" id="sc-btn-next-1">${esc(L.scNext)} ➔</button>
          </div>
        </form>
      </div>`;
    }

    if(step === 2){
      const curArts = Array.isArray(sc.articles) ? sc.articles : [];
      const uniqueCandidates = sxGetScholarCandidates();

      const itemsHtml = uniqueCandidates.map((art, idx)=>{
        const isSelected = curArts.some(a=> (a.title||"").toLowerCase().trim() === (art.title||"").toLowerCase().trim());
        return `<div class="sc-art-item ${isSelected?'selected':''}" data-art-card data-sc-art-row="${idx}">
          <input type="checkbox" data-sc-art-check="${idx}" ${isSelected?'checked':''}>
          <div class="sc-art-body">
            <div class="sc-art-title">${esc(art.title)}</div>
            <div class="sc-art-meta">${esc(art.authors)} · <em>${esc(art.venue||"")}</em> ${art.year?`(${art.year})`:''}</div>
          </div>
          <span class="sc-art-badge">⭐ ${art.citations||0} trích dẫn</span>
        </div>`;
      }).join("");

      return `<div class="sc-wrap">
        ${banner}
        ${stepper}
        <div class="sc-art-sec">
          <div>
            <h4 class="st-h4">${esc(L.scArtTitle)}</h4>
            <p class="st-intro">${esc(L.scArtSub)}</p>
          </div>
          <div class="sc-art-search-box">
            <input class="st-in" id="sc-art-filter-in" placeholder="${esc(L.scArtSearch)}">
            <button type="button" class="btn" id="sc-btn-open-manual">${esc(L.scArtAddManual)}</button>
          </div>

          <div id="sc-manual-container" style="display:none;">
            <div class="sc-manual-box">
              <b>${esc(L.scArtAddManual)}</b>
              <input class="st-in" id="sc-m-title" placeholder="Tiêu đề bài viết / công trình học thuật *">
              <input class="st-in" id="sc-m-authors" placeholder="Các tác giả (VD: Nguyen Van A, Tran Van B)">
              <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
                <input class="st-in" id="sc-m-venue" placeholder="Tạp chí / Hội nghị">
                <input class="st-in" id="sc-m-year" type="number" placeholder="Năm (VD: 2024)">
                <input class="st-in" id="sc-m-cit" type="number" placeholder="Số trích dẫn (VD: 15)">
              </div>
              <input class="st-in" id="sc-m-url" placeholder="Đường dẫn bài gốc (URL / DOI)">
              <div style="display:flex; justify-content:flex-end; gap:8px;">
                <button type="button" class="btn" id="sc-btn-cancel-manual">${esc(L.cCancel)}</button>
                <button type="button" class="btn p" id="sc-btn-save-manual">Thêm bài viết</button>
              </div>
            </div>
          </div>

          <div class="sc-art-list" id="sc-art-list-items">
            ${itemsHtml}
          </div>

          <div class="sc-actions-row">
            <button type="button" class="btn" id="sc-btn-prev-2">‹ ${esc(L.scPrev)}</button>
            <div style="display:flex; gap:10px;">
              <button type="button" class="btn" id="sc-btn-skip-2">${esc(L.scSkip)}</button>
              <button type="button" class="sc-btn-next" id="sc-btn-next-2">${esc(L.scNext)} ➔</button>
            </div>
          </div>
        </div>
      </div>`;
    }

    if(step === 3){
      return `<div class="sc-wrap">
        ${banner}
        ${stepper}
        <div class="sc-form">
          <h4 class="st-h4">${esc(L.scUpdateTitle)}</h4>
          
          <div class="st-block">
            <b>Cập nhật bài viết</b>
            <label class="st-radio">
              <input type="radio" name="sc-auto-upd" value="auto" ${sc.autoUpdate!==false?'checked':''}>
              <div>
                <b>${esc(L.scUpdAuto)}</b>
                <small>Hệ thống tự động đồng bộ và thêm các công trình học thuật mới xuất hiện của bạn.</small>
              </div>
            </label>
            <label class="st-radio">
              <input type="radio" name="sc-auto-upd" value="review" ${sc.autoUpdate===false?'checked':''}>
              <div>
                <b>${esc(L.scUpdReview)}</b>
                <small>Nhận thông báo để bạn xác nhận trước khi bài viết xuất hiện trên hồ sơ.</small>
              </div>
            </label>
          </div>

          <div class="st-sec">
            <h4 class="st-h4">Quyền riêng tư & Hiển thị</h4>
            <label class="st-radio" style="margin-top:10px;">
              <input type="checkbox" id="sc-in-public" ${sc.isPublic!==false?'checked':''}>
              <div>
                <b>${esc(L.scPublic)}</b>
                <small>Hồ sơ công khai giúp đồng nghiệp, học giả toàn cầu có thể trích dẫn và tìm thấy bài viết của bạn.</small>
              </div>
            </label>
            <label class="st-radio" style="margin-top:10px;">
              <input type="checkbox" id="sc-in-alerts" ${sc.emailAlerts!==false?'checked':''}>
              <div>
                <b>${esc(L.scAlerts)}</b>
                <small>Nhận email thông báo khi có công trình mới trích dẫn bài viết của bạn.</small>
              </div>
            </label>
          </div>

          <div class="sc-actions-row">
            <button type="button" class="btn" id="sc-btn-prev-3">‹ ${esc(L.scPrev)}</button>
            <button type="button" class="sc-btn-next" id="sc-btn-finish">✓ ${esc(L.scFinish)}</button>
          </div>
        </div>
      </div>`;
    }
  }

  // Chế độ xem Hồ sơ Google Scholar (Dashboard)
  const idx = sxComputeIndices(sc.articles);
  const curArts = Array.isArray(sc.articles) ? sc.articles : [];
  const avatarLetter = (sc.name||u.name||"U").charAt(0).toUpperCase();
  const domain = sc.verifyEmail ? sc.verifyEmail.split("@")[1] : "";
  const aliasesStr = Array.isArray(sc.aliases) && sc.aliases.length ? sc.aliases.join(" • ") : "";

  const rows = curArts.map((a, i)=>`
    <tr>
      <td>
        <button type="button" class="sc-pub-title" data-o="${esc(a.title)}">${esc(a.title)}</button>
        <div class="sc-pub-authors">${esc(a.authors)}</div>
        ${a.venue?`<div class="sc-pub-venue">${esc(a.venue)}</div>`:''}
      </td>
      <td class="sc-pub-cites"><b>${a.citations||0}</b></td>
      <td class="sc-pub-year">${a.year||"—"}</td>
      <td style="text-align:right;">
        <button type="button" class="x" data-sc-rm-pub="${i}" title="${esc(L.scDeleteArt)}">🗑</button>
      </td>
    </tr>
  `).join("");

  return `<div class="sc-wrap">
    <!-- Hero Card Profile -->
    <div class="sc-profile-hero">
      <div class="sc-hero-avatar">${avatarLetter}</div>
      <div class="sc-hero-info">
        <h3 class="sc-hero-name">${esc(sc.name||u.name)}</h3>
        ${aliasesStr?`<div class="sc-hero-aliases">Tên khác: ${esc(aliasesStr)}</div>`:''}
        ${sc.affiliation?`<div class="sc-hero-affil">🏛 ${esc(sc.affiliation)}</div>`:''}
        ${sc.verifyEmail?`<div class="sc-hero-email">✓ ${esc(L.scVerifiedAt(domain||sc.verifyEmail))}</div>`:''}
        ${Array.isArray(sc.interests)&&sc.interests.length?`
          <div class="sc-hero-interests">
            ${sc.interests.map(t=>`<span class="sc-hero-tag">${esc(t)}</span>`).join("")}
          </div>
        `:''}
        ${sc.homepage?`<div style="margin-top:8px;"><a href="${esc(sc.homepage)}" target="_blank" rel="noopener noreferrer" class="lnk">🔗 ${esc(sc.homepage)}</a></div>`:''}
        
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;">
          <button type="button" class="btn p" id="sc-btn-edit">${esc(L.scEditProfile)}</button>
          <button type="button" class="btn" id="sc-btn-export-bib">📥 ${esc(L.scExportBib)}</button>
          <button type="button" class="btn" id="sc-btn-rewizard">🔄 ${S.lang==="vi"?"Mở luồng thiết lập 3 bước":"Run Setup Wizard"}</button>
          <span style="display:inline-flex; align-items:center; font-size:0.84rem; color:var(--l-mut); padding-left:6px;">
            ${sc.isPublic!==false?'🌐 '+L.scViewPublic:'🔒 '+L.scViewPrivate}
          </span>
        </div>
      </div>
    </div>

    <!-- Bảng Thống kê Chỉ số Trích dẫn Scholar -->
    <div class="sc-stats-card">
      <h4 class="st-h4">${esc(L.scStatsTitle)}</h4>
      <table class="sc-stats-table">
        <thead>
          <tr>
            <th></th>
            <th>${esc(L.scAll)}</th>
            <th>${esc(L.scSince)}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${esc(L.scCitations)}</td>
            <td><b>${idx.citAll}</b></td>
            <td><b>${idx.citSince}</b></td>
          </tr>
          <tr>
            <td>${esc(L.scHIndex)}</td>
            <td><b>${idx.h}</b></td>
            <td><b>${Math.min(idx.h, Math.ceil(idx.h * 0.75))}</b></td>
          </tr>
          <tr>
            <td>${esc(L.scI10Index)}</td>
            <td><b>${idx.i10}</b></td>
            <td><b>${Math.min(idx.i10, Math.ceil(idx.i10 * 0.7))}</b></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Danh sách bài viết -->
    <div class="st-sec">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
        <h4 class="st-h4" style="margin:0;">${esc(L.scArticlesList)} (${curArts.length})</h4>
        <button type="button" class="btn" id="sc-btn-add-art">+ Thêm bài viết mới</button>
      </div>

      <div id="sc-dash-manual-container" style="display:none; margin-bottom:16px;">
        <div class="sc-manual-box">
          <b>${esc(L.scArtAddManual)}</b>
          <input class="st-in" id="sc-dm-title" placeholder="Tiêu đề bài viết *">
          <input class="st-in" id="sc-dm-authors" placeholder="Các tác giả">
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
            <input class="st-in" id="sc-dm-venue" placeholder="Tạp chí / Hội nghị">
            <input class="st-in" id="sc-dm-year" type="number" placeholder="Năm">
            <input class="st-in" id="sc-dm-cit" type="number" placeholder="Số trích dẫn">
          </div>
          <input class="st-in" id="sc-dm-url" placeholder="URL bài gốc">
          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button type="button" class="btn" id="sc-btn-cancel-dash-manual">${esc(L.cCancel)}</button>
            <button type="button" class="btn p" id="sc-btn-save-dash-manual">Thêm vào hồ sơ</button>
          </div>
        </div>
      </div>

      ${curArts.length ? `
        <table class="sc-pub-table">
          <thead>
            <tr>
              <th>BÀI VIẾT</th>
              <th style="text-align:center;">TRÍCH DẪN</th>
              <th style="text-align:center;">NĂM</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      ` : `<div class="st-empty">${esc(L.scNoArticles)}</div>`}
    </div>
  </div>`;
}

function settingsView(){
  sxInit();
  if(!S.user)return gate();
  const L=sxT(),tab=S.setTab||"search";
  const tabs=[
    ["search",L.tSearch,sxIco('<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>')],
    ["scholar",L.tScholar,sxIco('<path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path>')],
    ["lang",L.tLang,sxIco('<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>')],
    ["lib",L.tLib,sxIco('<path d="M3 21h18"></path><path d="M5 21V8l7-5 7 5v13"></path><path d="M9 21v-6h6v6"></path>')],
    ["account",L.tAcc,sxIco('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>')]
  ];
  tabs.splice(2,0,["appearance",L.tTheme,sxIco('<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>')]);
  const body=tab==="scholar"?sxScholarPanel():tab==="appearance"?sxThemePanel():tab==="lang"?sxLangPanel():tab==="lib"?sxLibPanel():tab==="account"?sxAccountPanel():sxSearchPanel();
  return`<div class="content-container st-wrap">
    <h2>${esc(t().settingsTitle)}</h2>
    <div class="st-lay">
      <nav class="st-menu" role="tablist">${tabs.map(([k,l,i])=>`<button type="button" role="tab" class="st-tab ${tab===k?"on":""}" data-stab="${k}" aria-selected="${tab===k}">${i}<span>${esc(l)}</span></button>`).join("")}</nav>
      <section class="st-panel">${body}</section>
    </div>
  </div>`;
}

/* ── Hành động trong trang Cài đặt ──────────────────────────────────────── */
async function sxSaveName(){
  const L=sxT(),msg=$("acc-msg");msg.className="st-msg err";msg.textContent="";
  try{
    const j=await api("me/profile","POST",{name:$("acc-name").value});
    S.user.name=j.user.name;
    draw();showToast(L.aNameOk);
  }catch(e){msg.textContent=e.message}
}
async function sxSavePw(){
  const L=sxT(),msg=$("pw-msg"),cur=$("pw-cur").value,n1=$("pw-new").value,n2=$("pw-new2").value;
  msg.className="st-msg err";msg.textContent="";
  if(n1.length<6){msg.textContent=L.pwShort;return}
  if(n1!==n2){msg.textContent=L.pwMismatch;return}
  try{
    await api("me/password","POST",{current:cur,password:n1});
    ["pw-cur","pw-new","pw-new2"].forEach(i=>$(i).value="");
    msg.className="st-msg ok";msg.textContent=L.pwOk;showToast(L.pwOk);
  }catch(e){msg.textContent=e.message}
}
function sxExport(){
  const data={exportedAt:new Date().toISOString(),user:{name:S.user.name,email:S.user.email},
    saved:S.saved,collections:S.colls,history:S.hist,settings:{...S.settings,lang:S.lang}};
  sxDownload("academai-data.json",JSON.stringify(data,null,2),"application/json");
}
async function sxDelete(){
  const L=sxT(),msg=$("del-msg"),pw=$("del-pw").value,w=$("del-word").value.trim();
  msg.textContent="";
  if(w.toUpperCase()!==L.dWord){msg.textContent=L.dBadWord;return}
  if(!pw){msg.textContent=L.dNeedPw;return}
  if(!confirm(L.dConfirm))return;
  try{
    await api("me/delete","POST",{password:pw});
    S.user=null;Object.assign(S,blank());S.setTab="search";
    showToast(L.dDone);go("home");
  }catch(e){msg.textContent=e.message}
}
function sxAddLib(){
  const L=sxT(),msg=$("lib-msg"),name=$("lib-name").value.trim(),url=$("lib-url").value.trim();
  msg.textContent="";
  if(S.settings.libs.length>=SX_MAX_LIBS){msg.textContent=L.bMax;return}
  if(!name){msg.textContent=L.bErrName;return}
  if(!/^https?:\/\/\S+$/i.test(url)){msg.textContent=L.bErrUrl;return}
  S.settings.libs.push({name:name.slice(0,60),url:url.slice(0,300)});
  sxSave();draw();sxSaved();
}

/* ── Bộ sưu tập: xem, tạo, đổi tên, xóa ─────────────────────────────────── */
function collsView(){
  if(!S.user)return gate();
  const L=sxT(),entries=Object.entries(S.colls);
  const plus='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
  return`<div class="content-container">
    <h2 class="coll-h"><span>${esc(t().colls)}</span><button type="button" class="btn p" data-cnew>${plus}<span>${esc(L.cNew)}</span></button></h2>
    <div class="cols">
      ${entries.map(([k,v])=>{
        const lock=SX_PROTECTED.includes(k);
        return`<div class="col">
          <div class="col-top"><b>${esc(k)}</b>${lock?"":`<span class="col-act">
            <button type="button" class="x" data-cren="${esc(k)}" title="${esc(L.cRename)}">✎</button>
            <button type="button" class="x" data-cdel="${esc(k)}" title="${esc(L.cDelete)}">🗑</button></span>`}</div>
          <div class="meta" style="margin:4px 0 10px;">${v.length} ${esc(t().noDocs)}</div>
          <ul>${v.map(ti=>`<li><button type="button" class="lnk" data-o="${esc(ti)}">${esc(ti)}</button><button type="button" class="x col-rm" data-crm="${esc(k)}" data-ct="${esc(ti)}" title="${esc(L.cRm)}" aria-label="${esc(L.cRm)}">✕</button></li>`).join("")}</ul>
        </div>`;
      }).join("")}
      <button type="button" class="col col-new" data-cnew><span class="plus">＋</span><b>${esc(L.cNew)}</b></button>
    </div>
  </div>`;
}
function sxCollDialog(mode,old){
  const L=sxT();
  $("dlg").innerHTML=`<h3>${esc(mode==="new"?L.cNewTitle:L.cRenTitle)}</h3>
    <label class="dlg-l" for="cn-in">${esc(L.cName)}</label>
    <input id="cn-in" class="dlg-in" maxlength="60" autocomplete="off" value="${esc(old||"")}" placeholder="${esc(L.cPh)}">
    <div class="dlg-err" id="cn-err"></div>
    <div class="dlg-act">
      <button type="button" class="btn" data-dclose>${esc(L.cCancel)}</button>
      <button type="button" class="btn p" id="cn-ok" data-mode="${mode}" data-old="${esc(old||"")}">${esc(mode==="new"?L.cCreate:L.cSave)}</button>
    </div>`;
  $("dlg").showModal();
  const i=$("cn-in");i.focus();i.select();
  i.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();$("cn-ok").click()}};
}
function sxCollOk(btn){
  const L=sxT(),mode=btn.dataset.mode,old=btn.dataset.old,inp=$("cn-in"),err=$("cn-err");
  const name=inp.value.trim().replace(/\s+/g," "),names=Object.keys(S.colls);
  err.textContent="";
  if(!name){err.textContent=L.cEmptyErr;inp.focus();return}
  if(names.some(n=>n.toLowerCase()===name.toLowerCase()&&n!==old)){err.textContent=L.cDupErr;inp.focus();return}
  if(mode==="new"){
    if(names.length>=SX_MAX_COLLS){err.textContent=L.cMaxErr;return}
    S.colls[name]=[];
    showToast(L.cCreated(name));
  }else{
    if(name===old){$("dlg").close();return}
    const rebuilt={};
    for(const[k,v]of Object.entries(S.colls))rebuilt[k===old?name:k]=v; // giữ nguyên thứ tự
    S.colls=rebuilt;
    showToast(L.cRenamed(name));
  }
  persist();$("dlg").close();draw();
}
function sxCollDelete(name){
  if(SX_PROTECTED.includes(name))return;
  const L=sxT();
  if(!confirm(L.cDelConfirm(name)))return;
  delete S.colls[name];
  persist();draw();showToast(L.cDeleted(name));
}

/* ── Bắt sự kiện (pha capture, chạy trước các handler trong app.js) ─────── */
document.addEventListener("click",e=>{
  const tg=e.target;
  if(!(tg instanceof Element))return;
  sxInit();
  const um=$("user-menu");
  if(um&&um.classList.contains("open")&&!tg.closest("#user-menu"))sxToggleMenu(false);
  const stop=()=>e.stopPropagation();
  let el;

  if((el=tg.closest("[data-umenu]"))){stop();closeAllSelects();sxToggleMenu();return}
  if((el=tg.closest("[data-stab]"))){stop();S.setTab=el.dataset.stab;S.view="settings";sxToggleMenu(false);draw();return}

  // ── Điều hướng & Tương tác Hồ sơ Google Scholar ──
  if((el=tg.closest("[data-sc-goto]"))){
    stop();
    const st=+el.dataset.scGoto;
    if(S.scholar.step===1)sxScholarSyncStep1();
    if(S.scholar.step===3)sxScholarSyncStep3();
    S.scholar.step=st;
    draw();
    return;
  }
  // Bước 1: Thêm / Xóa tên khác (Alias)
  if(tg.closest("#sc-btn-show-alias")){
    stop();
    const w=$("sc-alias-input-wrap");
    if(w){
      w.style.display="flex";
      const inp=$("sc-alias-in");
      if(inp)inp.focus();
    }
    return;
  }
  if(tg.closest("#sc-btn-cancel-alias")){
    stop();
    const w=$("sc-alias-input-wrap");
    if(w)w.style.display="none";
    return;
  }
  if(tg.closest("#sc-btn-add-alias")){
    stop();
    const inp=$("sc-alias-in");
    const val=(inp?inp.value:"").trim();
    if(val){
      if(!Array.isArray(S.scholar.aliases))S.scholar.aliases=[];
      if(!S.scholar.aliases.includes(val))S.scholar.aliases.push(val);
      if(inp)inp.value="";
      sxScholarSyncStep1();
      draw();
    }
    return;
  }
  if((el=tg.closest("[data-sc-del-alias]"))){
    stop();
    const idx=+el.dataset.scDelAlias;
    if(Array.isArray(S.scholar.aliases)){
      S.scholar.aliases.splice(idx,1);
      sxScholarSyncStep1();
      draw();
    }
    return;
  }
  // Bước 1: Gợi ý lĩnh vực quan tâm
  if((el=tg.closest("[data-sc-pick-tag]"))){
    stop();
    const tag=el.dataset.scPickTag;
    const inp=$("sc-in-interests");
    if(inp){
      const cur=inp.value.split(",").map(s=>s.trim()).filter(Boolean);
      if(!cur.includes(tag)){
        cur.push(tag);
        inp.value=cur.join(", ");
        sxScholarSyncStep1();
      }
    }
    return;
  }
  // Bước 1 -> Bước 2
  if(tg.closest("#sc-btn-next-1")){
    stop();
    sxScholarSyncStep1();
    if(!S.scholar.name){
      showToast(S.lang==="vi"?"Vui lòng nhập họ và tên của bạn!":"Please enter your name!");
      if($("sc-in-name"))$("sc-in-name").focus();
      return;
    }
    S.scholar.step=2;
    draw();
    return;
  }
  // Bước 2: Thêm bài viết thủ công
  if(tg.closest("#sc-btn-open-manual")){
    stop();
    const c=$("sc-manual-container");
    if(c){
      c.style.display="block";
      if($("sc-m-title"))$("sc-m-title").focus();
    }
    return;
  }
  if(tg.closest("#sc-btn-cancel-manual")){
    stop();
    const c=$("sc-manual-container");
    if(c)c.style.display="none";
    return;
  }
  if(tg.closest("#sc-btn-save-manual")){
    stop();
    const title=($("sc-m-title")?$("sc-m-title").value:"").trim();
    if(!title){
      showToast(S.lang==="vi"?"Vui lòng nhập tiêu đề bài viết!":"Please enter article title!");
      if($("sc-m-title"))$("sc-m-title").focus();
      return;
    }
    const authors=($("sc-m-authors")?$("sc-m-authors").value:"").trim()||(S.scholar.name||(S.user&&S.user.name)||"");
    const venue=($("sc-m-venue")?$("sc-m-venue").value:"").trim();
    const year=parseInt($("sc-m-year")?$("sc-m-year").value:"")||new Date().getFullYear();
    const citations=parseInt($("sc-m-cit")?$("sc-m-cit").value:"")||0;
    const url=($("sc-m-url")?$("sc-m-url").value:"").trim();
    if(!Array.isArray(S.scholar.articles))S.scholar.articles=[];
    S.scholar.articles.unshift({
      id:"manual_"+Date.now(),
      title,
      authors,
      venue,
      year,
      citations,
      url
    });
    showToast(S.lang==="vi"?"✓ Đã thêm bài viết vào danh sách!":"✓ Article added!");
    draw();
    return;
  }
  // Click vào hàng bài viết (toggle checkbox)
  if((el=tg.closest("[data-sc-art-row]"))&&!tg.closest("input[type='checkbox']")){
    stop();
    const cb=el.querySelector("input[type='checkbox']");
    if(cb){
      cb.checked=!cb.checked;
      cb.dispatchEvent(new Event("change",{bubbles:true}));
    }
    return;
  }
  // Bước 2 -> Bước 1
  if(tg.closest("#sc-btn-prev-2")){
    stop();
    S.scholar.step=1;
    draw();
    return;
  }
  // Bước 2 -> Bước 3
  if(tg.closest("#sc-btn-next-2")||tg.closest("#sc-btn-skip-2")){
    stop();
    S.scholar.step=3;
    draw();
    return;
  }
  // Bước 3 -> Bước 2
  if(tg.closest("#sc-btn-prev-3")){
    stop();
    sxScholarSyncStep3();
    S.scholar.step=2;
    draw();
    return;
  }
  // Hoàn tất Bước 3 -> Lưu hồ sơ Scholar
  if(tg.closest("#sc-btn-finish")){
    stop();
    sxScholarSyncStep3();
    S.scholar.created=true;
    S.scholar.editing=false;
    S.scholar.step=1;
    sxScholarSave();
    draw();
    return;
  }
  // Dashboard Scholar: Sửa thông tin & Mở lại luồng
  if(tg.closest("#sc-btn-edit")||tg.closest("#sc-btn-rewizard")){
    stop();
    S.scholar.editing=true;
    S.scholar.step=1;
    draw();
    return;
  }
  // Dashboard Scholar: Xuất BibTeX
  if(tg.closest("#sc-btn-export-bib")){
    stop();
    sxExportScholarBib();
    return;
  }
  // Dashboard Scholar: Mở / đóng / lưu bài viết mới
  if(tg.closest("#sc-btn-add-art")){
    stop();
    const c=$("sc-dash-manual-container");
    if(c){
      c.style.display=(c.style.display==="none"||!c.style.display)?"block":"none";
      if(c.style.display==="block"&&$("sc-dm-title"))$("sc-dm-title").focus();
    }
    return;
  }
  if(tg.closest("#sc-btn-cancel-dash-manual")){
    stop();
    const c=$("sc-dash-manual-container");
    if(c)c.style.display="none";
    return;
  }
  if(tg.closest("#sc-btn-save-dash-manual")){
    stop();
    const title=($("sc-dm-title")?$("sc-dm-title").value:"").trim();
    if(!title){
      showToast(S.lang==="vi"?"Vui lòng nhập tiêu đề bài viết!":"Please enter article title!");
      if($("sc-dm-title"))$("sc-dm-title").focus();
      return;
    }
    const authors=($("sc-dm-authors")?$("sc-dm-authors").value:"").trim()||(S.scholar.name||(S.user&&S.user.name)||"");
    const venue=($("sc-dm-venue")?$("sc-dm-venue").value:"").trim();
    const year=parseInt($("sc-dm-year")?$("sc-dm-year").value:"")||new Date().getFullYear();
    const citations=parseInt($("sc-dm-cit")?$("sc-dm-cit").value:"")||0;
    const url=($("sc-dm-url")?$("sc-dm-url").value:"").trim();
    if(!Array.isArray(S.scholar.articles))S.scholar.articles=[];
    S.scholar.articles.unshift({
      id:"sc_dash_"+Date.now(),
      title,
      authors,
      venue,
      year,
      citations,
      url
    });
    sxScholarSave();
    draw();
    return;
  }
  if((el=tg.closest("[data-sc-rm-pub]"))){
    stop();
    const idx=+el.dataset.scRmPub;
    if(Array.isArray(S.scholar.articles)&&S.scholar.articles[idx]){
      S.scholar.articles.splice(idx,1);
      sxScholarSave();
      draw();
      showToast(S.lang==="vi"?"Đã xóa bài viết khỏi hồ sơ.":"Removed article from profile.");
    }
    return;
  }

  if((el=tg.closest("[data-tg]"))){
    stop();
    const k=el.dataset.tg;
    S.settings[k]=!S.settings[k];
    el.classList.toggle("on",S.settings[k]);
    el.setAttribute("aria-checked",S.settings[k]?"true":"false");
    sxSave();sxSaved();return;
  }
  if((el=tg.closest("[data-pg]"))){
    stop();
    const pp=S.settings.perPage,pages=Math.max(1,Math.ceil(filteredResults().length/pp)),v=el.dataset.pg;
    S.page=Math.min(pages,Math.max(1,v==="prev"?S.page-1:v==="next"?S.page+1:+v));
    draw();scrollTo({top:0,behavior:"smooth"});return;
  }
  if((el=tg.closest("[data-imp]"))){stop();sxImport(el.dataset.imp);return}
  if(tg.closest("#lib-add")){stop();sxAddLib();return}
  if((el=tg.closest("[data-libdel]"))){stop();S.settings.libs.splice(+el.dataset.libdel,1);sxSave();draw();sxSaved();return}
  if(tg.closest("#acc-name-save")){stop();sxSaveName();return}
  if(tg.closest("#pw-save")){stop();sxSavePw();return}
  if(tg.closest("#acc-export")){stop();sxExport();return}
  if(tg.closest("#acc-del")){stop();sxDelete();return}

  // Bộ sưu tập
  if(tg.closest("[data-cnew]")){stop();
    if(Object.keys(S.colls).length>=SX_MAX_COLLS){showToast(sxT().cMaxErr);return}
    sxCollDialog("new","");return}
  if((el=tg.closest("[data-cren]"))){stop();sxCollDialog("ren",el.dataset.cren);return}
  if((el=tg.closest("[data-cdel]"))){stop();sxCollDelete(el.dataset.cdel);return}
  if((el=tg.closest("[data-crm]"))){
    stop();
    const k=el.dataset.crm,ti=el.dataset.ct;
    if(S.colls[k]){S.colls[k]=S.colls[k].filter(x=>x!==ti);persist();draw()}
    return;
  }
  if((el=tg.closest("#cn-ok"))){stop();sxCollOk(el);return}
  if(tg.closest("[data-dclose]")){stop();$("dlg").close();return}

  // Mở kết quả trong tab mới (khi bật trong Cài đặt)
  if((el=tg.closest("[data-o]"))&&S.settings.newTab&&["results","saved","colls"].includes(S.view)){
    const d=get(el.dataset.o);
    if(d&&d.url){stop();window.open(d.url,"_blank","noopener,noreferrer");return}
  }

  // Lưu ngôn ngữ giao diện (app.js sẽ đổi S.lang ngay sau đó)
  if(tg.closest("[data-lang]"))setTimeout(sxSave,0);

  // Trích dẫn [n] nằm ở trang khác: chuyển trang trước, analysis.js sẽ cuộn tới thẻ ngay sau đó
  if((el=tg.closest("[data-ref]"))&&!document.getElementById("res-"+el.dataset.ref)){
    const i=filteredResults().findIndex(d=>String(d.n)===el.dataset.ref);
    if(i>=0){S.page=Math.floor(i/S.settings.perPage)+1;draw()}
  }
},true);

document.addEventListener("change",e=>{
  const el=e.target;
  if(!(el instanceof Element))return;
  sxInit();
  const d=el.dataset||{};
  if(d.scArtCheck!==undefined){
    const idx=+d.scArtCheck;
    const candList=sxGetScholarCandidates();
    const target=candList[idx];
    if(!target)return;
    if(!Array.isArray(S.scholar.articles))S.scholar.articles=[];
    const norm=s=>(s||"").toLowerCase().trim();
    const foundIdx=S.scholar.articles.findIndex(a=>norm(a.title)===norm(target.title));
    if(el.checked){
      if(foundIdx===-1)S.scholar.articles.push(target);
    }else{
      if(foundIdx!==-1)S.scholar.articles.splice(foundIdx,1);
    }
    const row=el.closest("[data-sc-art-row]");
    if(row)row.classList.toggle("selected",el.checked);
    return;
  }
  if(d.set){
    const k=d.set;
    S.settings[k]=k==="perPage"?+el.value:el.value;
    S.page=1;sxSave();sxSaved();return;
  }
  if(el.name==="cm"){S.settings.cite=el.value==="show"?"show":"none";sxSave();draw();sxSaved();return}
  if(d.f||("sort" in d))S.page=1; // đổi bộ lọc / sắp xếp thì quay về trang 1
},true);

document.addEventListener("input",e=>{
  const el=e.target;
  if(!(el instanceof Element))return;
  if(el.id==="sc-art-filter-in"){
    const q=el.value.toLowerCase().trim();
    const rows=document.querySelectorAll("#sc-art-list-items [data-art-card]");
    rows.forEach(r=>{
      const txt=r.textContent.toLowerCase();
      r.style.display=(!q||txt.includes(q))?"":"none";
    });
  }
});

document.addEventListener("keydown",e=>{
  if(e.key==="Enter"&&document.activeElement&&document.activeElement.id==="sc-alias-in"){
    e.preventDefault();
    const b=$("sc-btn-add-alias");
    if(b)b.click();
    return;
  }
  const m=$("user-menu");
  if(!m)return;
  const open=m.classList.contains("open");
  if(e.key==="Escape"&&open){sxToggleMenu(false);const b=m.querySelector("[data-umenu]");if(b)b.focus();return}
  if((e.key==="ArrowDown"||e.key==="ArrowUp")&&m.contains(document.activeElement)){
    e.preventDefault();
    if(!open)sxToggleMenu(true);
    const items=[...m.querySelectorAll(".um-item")],i=items.indexOf(document.activeElement);
    const next=e.key==="ArrowDown"?items[(i+1)%items.length]:items[(i<=0?items.length:i)-1];
    if(next)next.focus();
  }
});
