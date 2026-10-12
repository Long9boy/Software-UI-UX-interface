// Tìm tài liệu THẬT trong các cơ sở dữ liệu học thuật công khai (không cần key AI, không cần tìm web).
// - OpenAlex: hơn 250 triệu bài báo, sách, luận văn. Chạy được không cần key; có key miễn phí thì hạn mức x10.
// - Crossref: siêu dữ liệu bài báo/sách (không cần key).
// - Google Sách: sách (không cần key, hạn mức nhỏ).
// Mỗi nguồn lỗi độc lập; nguồn nào lỗi thì bỏ qua, các nguồn còn lại vẫn trả kết quả.
const UA="ScholarLens/3.0 (student project)";
const YEAR=new Date().getFullYear();

async function getJSON(url,ms=12000){
  let r;
  try{r=await fetch(url,{headers:{accept:"application/json","user-agent":UA},signal:AbortSignal.timeout(ms)})}
  catch(e){const er=new Error(e.name==="TimeoutError"?"quá thời gian chờ":"không kết nối được");er.status=0;throw er}
  if(!r.ok){let m="";try{m=(await r.text()).replace(/\s+/g," ").slice(0,100)}catch{}const er=new Error("lỗi "+r.status+(m?": "+m:""));er.status=r.status;throw er}
  return r.json();
}
const clean=s=>String(s||"").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g," ").trim();
const httpUrl=u=>/^https?:\/\//i.test(u||"")?u:"";
const cut=(s,n)=>s.length>n?s.slice(0,n).replace(/\s+\S*$/,"")+"…":s;

// ── OpenAlex ─────────────────────────────────────────────────────────────────────────
const OA_TYPE={"Bài báo":"article|preprint","Sách":"book|book-chapter","Luận văn":"dissertation","Luận án":"dissertation","Review":"review"};
const OA_MAP={article:"Bài báo",preprint:"Bài báo",review:"Review",book:"Sách","book-chapter":"Sách",dissertation:"Luận văn"};
function abstractOf(ix){ // OpenAlex trả tóm tắt dạng chỉ mục đảo {từ:[vị trí]}
  if(!ix||typeof ix!=="object")return"";
  const w=[];for(const[k,ps]of Object.entries(ix))for(const p of ps)if(p<5000)w[p]=k;
  return clean(w.filter(Boolean).join(" "));
}
function oaUrl(q,o,key){
  const u=new URL("https://api.openalex.org/works");
  u.searchParams.set("search",q);u.searchParams.set("per_page","25");
  u.searchParams.set("filter",[o.from?"publication_year:>"+(o.from-1):"","type:"+(OA_TYPE[o.type]||"article|preprint|review|book|book-chapter|dissertation")].filter(Boolean).join(","));
  u.searchParams.set("select","id,display_name,publication_year,type,authorships,primary_location,open_access,abstract_inverted_index,doi,cited_by_count,language,best_oa_location");
  if(key)u.searchParams.set("api_key",key);
  return u;
}
async function openalex(q,o,key){
  let j;
  try{j=await getJSON(oaUrl(q,o,key))}
  catch(e){
    if(key&&(e.status===401||e.status===403))j=await getJSON(oaUrl(q,o,"")); // key sai: thử không key
    else if(e.status===409)throw new Error("hết lượt dùng miễn phí không cần key; hãy thêm OpenAlex API key (miễn phí) ở mục Quản trị");
    else if(e.status===429)throw new Error("hết hạn mức trong ngày; thêm OpenAlex API key (miễn phí) để tăng gấp 10 lần");
    else throw e;
  }
  return(j.results||[]).map(w=>{
    const loc=w.primary_location||{},best=w.best_oa_location||{};
    return{t:clean(w.display_name),a:(w.authorships||[]).slice(0,6).map(x=>x.author&&x.author.display_name).filter(Boolean),y:w.publication_year||"",
      type:OA_MAP[w.type]||"Bài báo",venue:(loc.source&&loc.source.display_name)||"OpenAlex",oa:!!(w.open_access&&w.open_access.is_oa),
      abs:abstractOf(w.abstract_inverted_index),url:httpUrl(best.landing_page_url)||httpUrl(w.doi)||httpUrl(loc.landing_page_url)||httpUrl(w.id),
      cit:w.cited_by_count||0,lang:w.language||"",src:"OpenAlex",doi:(w.doi||"").replace(/^https?:\/\/doi\.org\//i,"").toLowerCase()};
  });
}
async function testOpenAlex(key){
  const j=await getJSON("https://api.openalex.org/rate-limit?api_key="+encodeURIComponent(key));
  const r=j.rate_limit||{};
  return"key hợp lệ"+(r.daily_remaining_usd!=null?`, hôm nay còn khoảng ${Math.floor(r.daily_remaining_usd*1000)} lượt tìm`:"");
}

// ── Crossref ─────────────────────────────────────────────────────────────────────────
const CR_MAP={"journal-article":"Bài báo","proceedings-article":"Bài báo","posted-content":"Bài báo",book:"Sách",monograph:"Sách","edited-book":"Sách","book-chapter":"Sách",dissertation:"Luận văn"};
async function crossref(q,o){
  const u=new URL("https://api.crossref.org/works");
  u.searchParams.set("query",q);u.searchParams.set("rows","20");
  const f=[];if(o.from)f.push("from-pub-date:"+o.from);
  const ty={"Bài báo":"journal-article","Sách":"book","Luận văn":"dissertation","Luận án":"dissertation"}[o.type];if(ty)f.push("type:"+ty);
  if(f.length)u.searchParams.set("filter",f.join(","));
  if(process.env.CONTACT_EMAIL)u.searchParams.set("mailto",process.env.CONTACT_EMAIL);
  const j=await getJSON(u);
  return(((j.message||{}).items)||[]).filter(w=>CR_MAP[w.type]&&w.title&&w.title[0]).map(w=>({
    t:clean(w.title[0]),a:(w.author||[]).slice(0,6).map(x=>[x.given,x.family].filter(Boolean).join(" ")||x.name).filter(Boolean),
    y:(((w.issued||{})["date-parts"]||[[]])[0]||[])[0]||"",type:CR_MAP[w.type],venue:clean((w["container-title"]||[])[0])||"Crossref",oa:false,
    abs:clean(w.abstract).replace(/^abstract\s*/i,""),url:httpUrl(w.URL)||(w.DOI?"https://doi.org/"+w.DOI:""),cit:w["is-referenced-by-count"]||0,
    lang:w.language||"",src:"Crossref",doi:String(w.DOI||"").toLowerCase()}));
}

// ── Google Sách ──────────────────────────────────────────────────────────────────────
async function gbooks(q,o){
  const u=new URL("https://www.googleapis.com/books/v1/volumes");
  u.searchParams.set("q",q);u.searchParams.set("maxResults","6");u.searchParams.set("printType","books");u.searchParams.set("orderBy","relevance");
  const j=await getJSON(u);
  return(j.items||[]).map(b=>b.volumeInfo||{}).filter(v=>v.title).map(v=>({
    t:clean(v.title+(v.subtitle?": "+v.subtitle:"")),a:(v.authors||[]).slice(0,6),y:parseInt(v.publishedDate)||"",type:"Sách",venue:v.publisher||"Google Sách",
    oa:false,abs:clean(v.description),url:httpUrl(v.infoLink),cit:0,lang:v.language||"",src:"Google Sách",doi:""})).filter(b=>!o.from||!b.y||b.y>=o.from);
}

module.exports={openalex,crossref,gbooks,testOpenAlex,cut,YEAR};
