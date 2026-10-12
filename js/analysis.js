/* ═══════════════════════════════════════════════════════════════════════════
   AcademAI: "Tìm kiếm chuyên sâu" (phân tích kiểu Google Scholar)
   Khi người dùng tích ô "Tìm kiếm chuyên sâu", trang kết quả có thêm bảng phân tích:
     · Tổng quan  : bản nháp tổng quan có trích dẫn [n], phát hiện chính, khoảng trống nghiên cứu, bảng nguồn
     · Xu hướng   : số liệu thống kê + biểu đồ (theo năm, trích dẫn, loại tài liệu, nơi xuất bản, nguồn, từ khóa)
     · Danh mục đọc: lộ trình đọc từ dễ đến khó
     · So sánh bài: đặt cạnh nhau tối đa 3 tài liệu
   Số liệu và biểu đồ được tính ngay trên trình duyệt từ danh sách kết quả (không cần AI).
   Phần văn bản tổng quan do AI viết qua /api/analyze; chưa có key AI thì tự dựng bản tổng quan từ số liệu.
   File này được nạp trước app.js và dùng các biến chung: S, t, esc, $, api, showToast.
   ═══════════════════════════════════════════════════════════════════════════ */

const DL={
  vi:{
    title:"Phân tích chuyên sâu",
    sub:n=>`Tổng hợp từ ${n} tài liệu cho truy vấn của bạn`,
    tabs:[["overview","Tổng quan"],["trends","Xu hướng"],["reading","Danh mục đọc"],["compare","So sánh bài"]],
    docs:"Tài liệu",range:"Giai đoạn",cites:"Tổng trích dẫn",avgCites:"Trích dẫn TB",oa:"Open Access",
    byYear:"Số tài liệu theo năm",citeYear:"Trích dẫn theo năm xuất bản",byType:"Loại tài liệu",topVenues:"Nơi xuất bản nổi bật",
    bySource:"Nguồn dữ liệu",keywords:"Chủ đề & từ khóa nổi bật",
    draft:"Bản nháp tổng quan",copy:"Sao chép đoạn văn",copied:"✓ Đã sao chép đoạn tổng quan!",
    findings:"Phát hiện chính",gaps:"Khoảng trống nghiên cứu",sources:"Nguồn",
    colPaper:"Bài báo",colVenue:"Nơi đăng",colYear:"Năm",colCites:"Trích dẫn",colLevel:"Độ khó",
    loading:"Đang tổng hợp phân tích bằng AI…",
    autoNote:"Đây là tổng quan tự động dựa trên số liệu. Thêm key AI ở mục Quản trị để có bản tổng quan, phát hiện chính và khoảng trống nghiên cứu viết bằng ngôn ngữ tự nhiên.",
    errNote:"AI chưa phân tích được, đang hiển thị tổng quan tự động: ",
    lv:{E:"Dễ",M:"Trung bình",H:"Khó"},
    step:["Bước 1 · Nền tảng, dễ tiếp cận","Bước 2 · Nội dung cốt lõi","Bước 3 · Chuyên sâu, nâng cao"],
    readingHint:"Thứ tự đọc gợi ý từ dễ đến khó. Bấm tên tài liệu để xem chi tiết.",
    why:{E:"Tổng quan hoặc giáo trình, phù hợp để nắm nền tảng.",M:"Nghiên cứu cốt lõi, nên đọc sau khi đã nắm nền tảng.",H:"Nghiên cứu chuyên sâu hoặc rất mới, cần có kiến thức nền."},
    cmpHint:"Chọn tối đa 3 tài liệu để so sánh:",
    cmpRows:["Năm xuất bản","Loại","Nơi đăng","Trích dẫn","Open Access","Độ khó","Tóm tắt","Từ khóa"],
    yes:"Có",no:"Không",none:"Chưa có dữ liệu",
    recent:(p,y)=>`${p}% tài liệu được công bố trong ${y} năm gần đây`,
    trendHot:"cho thấy chủ đề đang được quan tâm mạnh.",trendOld:"cho thấy chủ đề đã có nền tảng tích lũy lâu năm."
  },
  en:{
    title:"Deep analysis",
    sub:n=>`Synthesized from ${n} documents for your query`,
    tabs:[["overview","Overview"],["trends","Trends"],["reading","Reading list"],["compare","Compare"]],
    docs:"Documents",range:"Period",cites:"Total citations",avgCites:"Avg. citations",oa:"Open Access",
    byYear:"Documents per year",citeYear:"Citations by publication year",byType:"Document types",topVenues:"Top venues",
    bySource:"Data sources",keywords:"Key topics & keywords",
    draft:"Draft overview",copy:"Copy paragraph",copied:"✓ Overview copied!",
    findings:"Key findings",gaps:"Research gaps",sources:"Sources",
    colPaper:"Paper",colVenue:"Venue",colYear:"Year",colCites:"Cited by",colLevel:"Difficulty",
    loading:"Generating AI analysis…",
    autoNote:"This is an automatic overview built from the numbers. Add an AI key in Admin to get a written overview, key findings and research gaps.",
    errNote:"AI analysis unavailable, showing the automatic overview: ",
    lv:{E:"Easy",M:"Medium",H:"Hard"},
    step:["Step 1 · Foundations, easy to start","Step 2 · Core contributions","Step 3 · Advanced, in-depth"],
    readingHint:"Suggested reading order from easy to hard. Click a title for details.",
    why:{E:"Survey or textbook, good for building foundations.",M:"Core research, read after the basics.",H:"Specialized or very recent work, background needed."},
    cmpHint:"Pick up to 3 documents to compare:",
    cmpRows:["Year","Type","Venue","Citations","Open Access","Difficulty","Summary","Keywords"],
    yes:"Yes",no:"No",none:"No data",
    recent:(p,y)=>`${p}% of documents were published in the last ${y} years`,
    trendHot:"suggesting the topic is attracting strong interest.",trendOld:"suggesting a long-established body of work."
  }
};
const dl=()=>DL[S.lang]||DL.vi;

/* ── Tiện ích ───────────────────────────────────────────────────────────── */
const citOf=d=>typeof d.cit==="number"?d.cit:(parseInt(String(d.cites||"").replace(/\D/g,""))||0);
const fmtN=n=>Number(n||0).toLocaleString(S.lang==="en"?"en-US":"vi-VN");
const fmtShort=n=>n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?(n/1e3).toFixed(n>=1e4?0:1)+"k":String(n);
const cutS=(s,n)=>{s=String(s||"");return s.length>n?s.slice(0,n-1)+"…":s};
const lastName=a=>String(a||"").trim().split(/\s+/).pop();
const GENERIC_VENUE=/^(OpenAlex|Crossref|Google Sách|Dữ liệu mẫu|Dữ liệu học thuật|Nguồn)$/i;

function sortRes(arr){
  const a=arr.slice();
  if(S.sort==="cit")a.sort((x,y)=>citOf(y)-citOf(x));
  else if(S.sort==="year")a.sort((x,y)=>(+y.y||0)-(+x.y||0));
  return a;
}

function dStats(rs){
  const ys=rs.map(d=>+d.y).filter(y=>y>1000),sum=rs.reduce((a,d)=>a+citOf(d),0);
  return{n:rs.length,ymin:ys.length?Math.min(...ys):0,ymax:ys.length?Math.max(...ys):0,sum,
    avg:rs.length?Math.round(sum/rs.length):0,oa:rs.length?Math.round(rs.filter(d=>d.oa).length*100/rs.length):0};
}
function countBy(rs,fn){
  const m=new Map();
  rs.forEach(d=>{const k=fn(d);if(k)m.set(k,(m.get(k)||0)+1)});
  return[...m.entries()].sort((a,b)=>b[1]-a[1]);
}
function yearBuckets(rs,val){
  const ys=rs.map(d=>+d.y).filter(y=>y>1000);
  if(!ys.length)return[];
  const lo=Math.min(...ys),hi=Math.max(...ys),span=hi-lo+1,step=span<=14?1:Math.ceil(span/12),out=[];
  for(let s=lo;s<=hi;s+=step){
    const e=Math.min(hi,s+step-1);
    out.push({l:step===1?String(s):`${s}–${String(e).slice(-2)}`,v:val(rs.filter(d=>+d.y>=s&&+d.y<=e))});
  }
  return out;
}

/* ── Độ khó đọc: AI đánh giá nếu có, không thì ước lượng theo loại tài liệu ──── */
const lvKey=s=>/khó|hard/i.test(s)?"H":/dễ|easy/i.test(s)?"E":"M";
function lvOf(d){
  const dd=S.deepData;
  if(dd&&dd.reading){const x=dd.reading.find(r=>r.n===d.n);if(x)return{k:lvKey(x.level),why:x.why||""}}
  const ty=d.type||"",c=citOf(d),cur=new Date().getFullYear();
  if(ty==="Review"||ty==="Sách")return{k:"E",why:""};
  if(ty==="Luận văn"||ty==="Luận án")return{k:"H",why:""};
  if(c>=300)return{k:"M",why:""};
  return{k:(+d.y>=cur-2)?"H":"M",why:""};
}
const lvBadge=d=>{const k=lvOf(d).k;return`<span class="lv lv-${k}">${esc(dl().lv[k])}</span>`};

/* ── Trích dẫn [n] trong văn bản: biến thành nút bấm nhảy tới tài liệu ──────── */
const withRefs=(txt,valid)=>esc(txt).replace(/\[(\d{1,2})\]/g,(m,k)=>valid.has(+k)?`<button type="button" class="cite-ref" data-ref="${k}">[${k}]</button>`:"");

/* ── Biểu đồ SVG thuần (không cần thư viện) ─────────────────────────────── */
const PAL=["#38bdf8","#818cf8","#34d399","#fbbf24","#f472b6","#fb7185"];
function barSvg(data,color){
  if(!data.length)return`<div class="dp-empty">${esc(dl().none)}</div>`;
  const W=560,H=190,pl=8,pr=8,pt=22,pb=34,n=data.length,max=Math.max(...data.map(x=>x.v),1);
  const bw=(W-pl-pr)/n,gap=Math.min(10,bw*0.25);
  const bars=data.map((x,i)=>{
    const h=Math.round((H-pt-pb)*x.v/max),xx=pl+i*bw+gap/2,y=H-pb-h,cx=(xx+(bw-gap)/2).toFixed(1);
    return`<g><title>${esc(x.l)}: ${fmtN(x.v)}</title>
      <rect x="${xx.toFixed(1)}" y="${y}" width="${Math.max(2,bw-gap).toFixed(1)}" height="${x.v?Math.max(h,2):0}" rx="5" fill="${color}"></rect>
      <text x="${cx}" y="${y-6}" text-anchor="middle" class="ch-val">${x.v?fmtShort(x.v):""}</text>
      <text x="${cx}" y="${H-12}" text-anchor="middle" class="ch-lbl">${esc(x.l)}</text></g>`;
  }).join("");
  return`<svg viewBox="0 0 ${W} ${H}" class="ch-svg" role="img">${bars}</svg>`;
}
function donutSvg(entries){
  const total=entries.reduce((a,e)=>a+e[1],0);
  if(!total)return`<div class="dp-empty">${esc(dl().none)}</div>`;
  const R=54,C=2*Math.PI*R;let off=0;
  const segs=entries.map(([k,v],i)=>{
    const len=C*v/total,
      s=`<circle cx="70" cy="70" r="${R}" fill="none" stroke="${PAL[i%PAL.length]}" stroke-width="22" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 70 70)"><title>${esc(k)}: ${v}</title></circle>`;
    off+=len;return s;
  }).join("");
  const legend=entries.map(([k,v],i)=>`<li><i style="background:${PAL[i%PAL.length]}"></i><span>${esc(k)}</span><b>${v}</b></li>`).join("");
  return`<div class="dn"><svg viewBox="0 0 140 140" class="dn-svg">${segs}<text x="70" y="68" text-anchor="middle" class="dn-n">${total}</text><text x="70" y="86" text-anchor="middle" class="ch-lbl">${esc(dl().docs.toLowerCase())}</text></svg><ul class="dn-leg">${legend}</ul></div>`;
}
function hbars(entries,color){
  if(!entries.length)return`<div class="dp-empty">${esc(dl().none)}</div>`;
  const max=Math.max(...entries.map(e=>e[1]),1);
  return`<ul class="hb">${entries.map(([k,v])=>`<li><span class="hb-l" title="${esc(k)}">${esc(cutS(k,34))}</span><span class="hb-t"><span style="width:${Math.max(6,Math.round(v*100/max))}%;background:${color}"></span></span><b>${v}</b></li>`).join("")}</ul>`;
}

/* ── Từ khóa nổi bật ────────────────────────────────────────────────────── */
const KW_STOP=new Set("the and for with from that this into using use based study analysis review approach towards toward their about between through under over among when what which have been were are was its not can may more than also new one two how why who your you our les des und der die das una los del para con por".split(" "));
function keywords(rs){
  const dd=S.deepData;
  if(dd&&dd.themes&&dd.themes.length)return dd.themes.map(x=>[x,0]);
  const m=new Map();
  rs.forEach(d=>{
    const tags=(d.tags||[]).filter(x=>typeof x==="string"&&x);
    const words=tags.length?tags:String(d.t||"").toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w=>w.length>3&&!KW_STOP.has(w));
    new Set(words.map(w=>String(w).toLowerCase())).forEach(w=>m.set(w,(m.get(w)||0)+1));
  });
  return[...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10);
}

/* ── Nhận định xu hướng + tổng quan tự động (dùng khi chưa có AI) ──────────── */
function trendLine(rs){
  const ys=rs.map(d=>+d.y).filter(y=>y>1000);
  if(ys.length<4)return"";
  const L=dl(),cur=new Date().getFullYear(),rec=ys.filter(y=>y>=cur-5).length,pct=Math.round(rec*100/ys.length);
  return L.recent(pct,5)+", "+(pct>=50?L.trendHot:L.trendOld);
}
function autoOverview(rs){
  const vi=S.lang!=="en",st=dStats(rs),cur=new Date().getFullYear();
  const top=[...rs].sort((a,b)=>citOf(b)-citOf(a))[0];
  const types=countBy(rs,d=>d.type).slice(0,3).map(([k,v])=>`${k} (${v})`).join(", ");
  const venues=countBy(rs,d=>GENERIC_VENUE.test(d.venue||"")?"":d.venue).slice(0,2).map(e=>e[0]).join(", ");
  const rec=rs.filter(d=>+d.y>=cur-5).length;
  const range=st.ymin?(st.ymin===st.ymax?` (${st.ymin})`:` (${st.ymin}–${st.ymax})`):"";
  let s=vi?`Truy vấn “${S.q}” trả về ${st.n} tài liệu${range}, gồm ${types}. `:`The query “${S.q}” returned ${st.n} documents${range}, including ${types}. `;
  if(top&&citOf(top)>0){
    const who=lastName(Array.isArray(top.a)?top.a[0]:top.a);
    s+=vi?`Công trình được trích dẫn nhiều nhất là “${cutS(top.t,90)}” (${who}${top.y?", "+top.y:""}) với ${fmtN(citOf(top))} lượt trích dẫn [${top.n}]. `
         :`The most cited work is “${cutS(top.t,90)}” (${who}${top.y?", "+top.y:""}) with ${fmtN(citOf(top))} citations [${top.n}]. `;
  }
  if(rec&&st.n>=4)s+=vi?`${rec}/${st.n} tài liệu được công bố trong 5 năm gần đây. `:`${rec}/${st.n} documents were published in the last 5 years. `;
  if(venues)s+=vi?`Các nơi xuất bản xuất hiện nhiều: ${venues}.`:`Most frequent venues: ${venues}.`;
  return s.trim();
}

/* ── Tab: Tổng quan ─────────────────────────────────────────────────────── */
function tabOverview(rs){
  const L=dl(),dd=S.deepData,valid=new Set((S.results||[]).map(d=>d.n));
  let top="",extra="",note="";
  const listBlock=(title,arr)=>arr&&arr.length?`<h4 class="dp-h">${esc(title)}</h4><ul class="dp-list">${arr.map(x=>`<li>${withRefs(x,valid)}</li>`).join("")}</ul>`:"";
  if(dd&&dd.status==="loading"){
    top=`<div class="dp-loading"><div class="spin" style="margin:0 14px 0 0;width:26px;height:26px"></div>${esc(L.loading)}</div>`;
    S._ovText="";
  }else{
    let txt;
    if(dd&&dd.status==="done"&&dd.overview){
      txt=dd.overview;
      extra=listBlock(L.findings,dd.findings)+listBlock(L.gaps,dd.gaps);
    }else{
      txt=autoOverview(rs);
      note=`<p class="dp-note">${esc(dd&&dd.status==="error"?L.errNote+dd.err:L.autoNote)}</p>`;
    }
    S._ovText=txt;
    top=`<div class="dp-draft"><div class="dp-draft-t">${esc(L.draft)}</div><p>${withRefs(txt,valid)}</p></div>
      <button type="button" class="btn p dp-copy" data-copyov>📋 ${esc(L.copy)}</button>${note}`;
  }
  const table=`<h4 class="dp-h">${esc(L.sources)}</h4><div class="dp-tw"><table class="dp-table"><thead><tr>
    <th>#</th><th>${esc(L.colPaper)}</th><th>${esc(L.colVenue)}</th><th>${esc(L.colYear)}</th><th>${esc(L.colCites)}</th><th>${esc(L.colLevel)}</th></tr></thead><tbody>
    ${rs.map(d=>`<tr><td class="mono">[${d.n}]</td><td><button type="button" class="lnk" data-o="${esc(d.t)}">${esc(cutS(d.t,90))}</button></td>
      <td>${esc(cutS(d.venue,38))}</td><td class="mono">${esc(String(d.y||"–"))}</td><td class="mono">${fmtN(citOf(d))}</td><td>${lvBadge(d)}</td></tr>`).join("")}
    </tbody></table></div>`;
  return top+extra+table;
}

/* ── Tab: Xu hướng ──────────────────────────────────────────────────────── */
function tabTrends(rs){
  const L=dl(),st=dStats(rs),tl=trendLine(rs);
  const range=st.ymin?(st.ymin===st.ymax?String(st.ymin):st.ymin+"–"+st.ymax):"–";
  const stats=[[L.docs,fmtN(st.n)],[L.range,range],[L.cites,fmtN(st.sum)],[L.avgCites,fmtN(st.avg)],[L.oa,st.oa+"%"]]
    .map(([l,v])=>`<div class="dp-stat"><b>${esc(String(v))}</b><span>${esc(l)}</span></div>`).join("");
  const venues=countBy(rs,d=>GENERIC_VENUE.test(d.venue||"")?"":d.venue).slice(0,6);
  const kw=keywords(rs);
  return`<div class="dp-stats">${stats}</div>${tl?`<p class="dp-trend">📈 ${esc(tl)}</p>`:""}
  <div class="dp-grid">
    <div class="dp-card"><h4>${esc(L.byYear)}</h4>${barSvg(yearBuckets(rs,b=>b.length),"#38bdf8")}</div>
    <div class="dp-card"><h4>${esc(L.citeYear)}</h4>${barSvg(yearBuckets(rs,b=>b.reduce((a,d)=>a+citOf(d),0)),"#818cf8")}</div>
    <div class="dp-card"><h4>${esc(L.byType)}</h4>${donutSvg(countBy(rs,d=>d.type))}</div>
    <div class="dp-card"><h4>${esc(L.topVenues)}</h4>${hbars(venues,"#34d399")}</div>
    <div class="dp-card"><h4>${esc(L.bySource)}</h4>${hbars(countBy(rs,d=>d.src||"Demo"),"#fbbf24")}</div>
    <div class="dp-card"><h4>${esc(L.keywords)}</h4><div class="dp-kw">${kw.map(([k,v])=>`<span>${esc(String(k))}${v?` <em>${v}</em>`:""}</span>`).join("")||`<div class="dp-empty">${esc(L.none)}</div>`}</div></div>
  </div>`;
}

/* ── Tab: Danh mục đọc (từ dễ đến khó) ─────────────────────────────────── */
function tabReading(rs){
  const L=dl(),groups={E:[],M:[],H:[]};
  rs.forEach(d=>groups[lvOf(d).k].push(d));
  const html=["E","M","H"].map((k,i)=>{
    const list=groups[k].sort((a,b)=>citOf(b)-citOf(a));
    if(!list.length)return"";
    return`<div class="rd-step"><div class="rd-step-t"><span class="lv lv-${k}">${esc(L.lv[k])}</span>${esc(L.step[i])}</div>
      ${list.map(d=>{
        const w=lvOf(d).why||L.why[k],au=(Array.isArray(d.a)?d.a:[d.a]).filter(Boolean).slice(0,3).join(", ");
        return`<div class="rd-item"><span class="ref-badge">[${d.n}]</span><div class="rd-main">
          <button type="button" class="lnk" data-o="${esc(d.t)}">${esc(cutS(d.t,120))}</button>
          <div class="meta">${esc(cutS(au,60))}${au?" · ":""}${esc(cutS(d.venue,40))} · ${esc(String(d.y||"–"))}${citOf(d)?" · 📚 "+fmtN(citOf(d)):""}</div>
          <div class="rd-why">${esc(w)}</div></div></div>`;
      }).join("")}</div>`;
  }).join("");
  return`<p class="meta" style="margin-bottom:14px">${esc(L.readingHint)}</p>${html}`;
}

/* ── Tab: So sánh bài ───────────────────────────────────────────────────── */
function cmpSel(rs){
  const ok=new Set(rs.map(d=>d.n));
  let cur=(S.cmp||rs.slice(0,3).map(d=>d.n)).filter(n=>ok.has(n));
  if(!cur.length)cur=rs.slice(0,3).map(d=>d.n);
  return cur;
}
function tabCompare(rs){
  const L=dl(),sel=cmpSel(rs),docs=sel.map(n=>rs.find(d=>d.n===n)).filter(Boolean);
  const picks=rs.map(d=>`<label class="cmp-pick ${sel.includes(d.n)?"on":""}"><input type="checkbox" data-cmp="${d.n}" ${sel.includes(d.n)?"checked":""}><span>[${d.n}] ${esc(cutS(d.t,52))}</span></label>`).join("");
  const rows=[
    d=>String(d.y||"–"),
    d=>d.type||"–",
    d=>d.venue||"–",
    d=>fmtN(citOf(d)),
    d=>d.oa?L.yes:L.no,
    d=>L.lv[lvOf(d).k],
    d=>cutS(d.d||"",260),
    d=>(d.tags||[]).slice(0,4).join(", ")||"–"
  ];
  const table=docs.length?`<div class="dp-tw"><table class="dp-table cmp"><thead><tr><th></th>${docs.map(d=>`<th><button type="button" class="lnk" data-o="${esc(d.t)}">[${d.n}] ${esc(cutS(d.t,70))}</button></th>`).join("")}</tr></thead><tbody>
    ${L.cmpRows.map((lab,i)=>`<tr><th>${esc(lab)}</th>${docs.map(d=>`<td>${esc(rows[i](d))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`:`<div class="dp-empty">${esc(L.none)}</div>`;
  return`<p class="meta" style="margin-bottom:10px">${esc(L.cmpHint)}</p><div class="cmp-picks">${picks}</div>${table}`;
}

/* ── Khung bảng phân tích ──────────────────────────────────────────────── */
function deepInner(rs){
  const L=dl(),tab=S.deepTab||"overview",dd=S.deepData;
  const body=tab==="trends"?tabTrends(rs):tab==="reading"?tabReading(rs):tab==="compare"?tabCompare(rs):tabOverview(rs);
  return`<div class="dp-head"><div><h3>🔎 ${esc(L.title)}</h3><p class="meta">${esc(L.sub(rs.length))}</p></div>
    ${dd&&dd.ai?`<span class="b2">🤖 ${esc(dd.ai)}</span>`:""}</div>
    <div class="dp-tabs" role="tablist">${L.tabs.map(([k,l])=>`<button type="button" role="tab" class="dp-tab ${tab===k?"on":""}" data-dtab="${k}">${esc(l)}</button>`).join("")}</div>
    <div class="dp-body">${body}</div>`;
}
function deepPanel(rs){
  S._dr=rs;
  return`<section class="dp" id="deep-panel">${deepInner(rs)}</section>`;
}
function redrawDeep(){
  const el=$("deep-panel");
  if(el&&S._dr)el.innerHTML=deepInner(S._dr);
}

/* ── Gọi AI tổng hợp (chạy nền, số liệu/biểu đồ hiện ngay không cần chờ) ───── */
async function loadDeep(){
  const items=(S.results||[]).slice(0,14);
  if(!items.length||!S.q){S.deepData=null;return}
  const tok=S.deepTok=(S.deepTok||0)+1;
  S.deepData={status:"loading"};
  redrawDeep();
  let res;
  try{
    const j=await api("analyze","POST",{q:S.q,items:items.map(d=>({n:d.n,t:d.t,a:(d.a||[]).slice(0,3),y:d.y,type:d.type,venue:d.venue,cit:citOf(d),d:d.d}))});
    res={status:"done",...j};
  }catch(e){res={status:"error",err:e.message}}
  if(tok!==S.deepTok)return; // đã có truy vấn mới hơn
  S.deepData=res;
  redrawDeep();
}

/* ── Ô tích "Tìm kiếm chuyên sâu" ──────────────────────────────────────── */
function deepToggle(){
  return`<label class="deep-toggle ${S.deep?"on":""}">
    <input type="checkbox" id="deep-cb" ${S.deep?"checked":""}>
    <span class="deep-box"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
    <span class="deep-text"><b>${esc(t().deepLabel)}</b><small>${esc(t().deepHint)}</small></span>
  </label>`;
}
function toggleDeep(on){
  S.deep=!!on;
  try{localStorage.setItem("academai.deep",S.deep?"1":"0")}catch(e){}
  document.querySelectorAll(".deep-toggle").forEach(l=>l.classList.toggle("on",S.deep));
  if(S.view==="results"){
    const qi=$("qi");if(qi)S.q=qi.value;
    draw();
    if(S.deep&&S.results.length&&!S.deepData)loadDeep();
  }
}

/* ── Sự kiện của bảng phân tích (tab, trích dẫn [n], sao chép, so sánh) ────── */
document.addEventListener("click",e=>{
  const tab=e.target.closest("[data-dtab]");
  if(tab){S.deepTab=tab.dataset.dtab;redrawDeep();return}
  const ref=e.target.closest("[data-ref]");
  if(ref){
    const el=document.getElementById("res-"+ref.dataset.ref);
    if(el){el.scrollIntoView({behavior:"smooth",block:"center"});el.classList.add("flash");setTimeout(()=>el.classList.remove("flash"),1700)}
    return;
  }
  if(e.target.closest("[data-copyov]")){
    const txt=S._ovText||"";
    if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=>showToast(dl().copied)).catch(()=>showToast(txt));
    else showToast(txt);
  }
});
document.addEventListener("change",e=>{
  const c=e.target.closest&&e.target.closest("[data-cmp]");
  if(!c||!S._dr)return;
  let cur=cmpSel(S._dr).slice();const n=+c.dataset.cmp;
  if(c.checked){cur=cur.filter(x=>x!==n);cur.push(n);if(cur.length>3)cur.shift()}
  else cur=cur.filter(x=>x!==n);
  S.cmp=cur;redrawDeep();
});
