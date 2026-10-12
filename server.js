// AcademAI Resource Discovery: máy chủ không cần cài thêm thư viện (Node 18+). Chạy: node server.js
const http=require("http"),fs=require("fs"),path=require("path"),zlib=require("zlib");
const S=require("./server/store"),AI=require("./server/ai"),SRC=require("./server/sources"),SEARCH=require("./server/search");
const PORT=process.env.PORT||3000,MIME={
  ".html":"text/html; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",
  ".json":"application/json; charset=utf-8",
  ".png":"image/png",
  ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg",
  ".webp":"image/webp",
  ".svg":"image/svg+xml",
  ".ico":"image/x-icon"
};
const { FEATURED_PAPERS } = require("./js/featured");
class E extends Error{constructor(c,m){super(m);this.c=c}}
const pub=u=>({id:u.id,email:u.email,name:u.name,role:u.role,settings:u.settings||null,scholar:u.scholar||null});
const cookies=(h="")=>Object.fromEntries(h.split(";").map(p=>p.trim().split(/=(.*)/s)).filter(p=>p[0]));
const setSession=(res,uid)=>res.setHeader("Set-Cookie",`sl=${S.sign({uid,ca:(S.users.get(uid)||{}).createdAt})}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7*86400}`); // ca: thời điểm tạo tài khoản, để phiên của tài khoản đã xóa không dính sang tài khoản mới có cùng id
const keyView=(k,i,rows)=>{const kind=AI.PROVIDERS[k.provider]?AI.PROVIDERS[k.provider].kind:"ai";return{id:k.id,provider:k.provider,model:k.model,hint:k.hint,createdAt:k.createdAt,kind,inUse:rows.filter(x=>(AI.PROVIDERS[x.provider]||{kind:"ai"}).kind===kind)[0]===k}};
const keyList=()=>S.keys.rows.map((k,i,r)=>keyView(k,i,r));
// Key lấy từ giao diện Quản trị (mã hóa trong data/) + key đặt qua biến môi trường (tùy chọn).
const ENV=[["GEMINI_API_KEY","Gemini","gemini-2.5-flash"],["GROQ_API_KEY","Groq","llama-3.3-70b-versatile"],["ANTHROPIC_API_KEY","Claude","claude-sonnet-5"],["OPENAI_API_KEY","OpenAI","gpt-4o-mini"],["OPENALEX_API_KEY","OpenAlex","api"]];
function allKeys(){
  const rows=S.keys.rows.map(k=>({provider:k.provider,model:k.model,key:S.dec(k)}));
  for(const[e,provider,model]of ENV)if(process.env[e])rows.push({provider,model,key:process.env[e].trim()});
  return{ai:rows.filter(k=>AI.isAI(k.provider)),oa:(rows.find(k=>k.provider==="OpenAlex")||{}).key||""};
}
const arr=(v,n)=>Array.isArray(v)?v.slice(0,n):[];

// File tĩnh: nén gzip (cache trong RAM) + ETag/304 + cache dài cho ảnh -> tải trang nhanh, ít tốn CPU/mạng (nhất là khi chạy qua cloudflared)
const STATIC=new Map();
function serveStatic(req,res,f,send){
  const file=path.join(__dirname,f);
  fs.stat(file,(e,st)=>{
    if(e||!st.isFile())return send(404,"Not found","text/plain");
    const type=MIME[path.extname(f)]||"text/plain";
    const etag='W/"'+st.size+"-"+Math.floor(st.mtimeMs)+'"';
    const headers={"content-type":type,etag,"cache-control":f.startsWith("/assets/")?"public, max-age=86400":"no-cache",vary:"Accept-Encoding"};
    if(req.headers["if-none-match"]===etag){res.writeHead(304,headers);return res.end()}
    const done=c=>{
      const gz=c.gz&&/\bgzip\b/.test(req.headers["accept-encoding"]||"");
      if(gz)headers["content-encoding"]="gzip";
      res.writeHead(200,headers);res.end(gz?c.gz:c.raw);
    };
    const c=STATIC.get(f);
    if(c&&c.etag===etag)return done(c);
    fs.readFile(file,(e2,raw)=>{
      if(e2)return send(404,"Not found","text/plain");
      const n={etag,raw,gz:/^text\/|json|javascript/.test(type)?zlib.gzipSync(raw):null};
      STATIC.set(f,n);done(n);
    });
  });
}

http.createServer(async(req,res)=>{
  const send=(c,b,t="application/json")=>{res.writeHead(c,{"content-type":t});res.end(b)};
  const json=(c,o)=>send(c,JSON.stringify(o));
  const p=req.url.split("?")[0];
  if(!p.startsWith("/api/")){
    const f=p==="/"?"/index.html":p;
    if(!/^\/(index\.html|favicon\.ico|css\/[\w.-]+|js\/[\w.-]+|assets\/[\w.-]+)$/.test(f))return send(404,"Not found","text/plain"); // KHÔNG phục vụ data/: chứa .secret, users.json, api-keys.json
    return serveStatic(req,res,f,send);
  }
  try{
    let body={};
    if(req.method==="POST"||req.method==="PUT"){let s="";for await(const c of req){s+=c;if(s.length>2e6)throw new E(413,"Dữ liệu quá lớn")}try{body=s?JSON.parse(s):{}}catch{throw new E(400,"JSON không hợp lệ")}}
    const tk=S.verify(cookies(req.headers.cookie).sl),u0=tk?S.users.get(tk.uid):null,user=u0&&u0.createdAt===tk.ca?u0:null;
    const need=()=>{if(!user)throw new E(401,"Bạn cần đăng nhập.");return user};
    const admin=()=>{if(need().role!=="admin")throw new E(403,"Chỉ Admin mới có quyền này.")};
    let m;
    if(p==="/api/featured"&&req.method==="GET"){
      return json(200,{papers:FEATURED_PAPERS});
    }
    if(p==="/api/auth/login"&&req.method==="POST"){
      const u=S.users.find(x=>x.email===String(body.email||"").trim().toLowerCase());
      if(!u||!S.check(String(body.password||""),u.passwordHash))throw new E(401,"Email hoặc mật khẩu không đúng.");
      setSession(res,u.id);return json(200,{user:pub(u)});
    }
    if(p==="/api/auth/register"&&req.method==="POST"){
      const name=String(body.name||"").trim(),email=String(body.email||"").trim().toLowerCase(),pw=String(body.password||"");
      if(name.length<2||name.length>60)throw new E(400,"Họ tên phải từ 2 đến 60 ký tự.");
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new E(400,"Email không hợp lệ.");
      if(pw.length<6)throw new E(400,"Mật khẩu tối thiểu 6 ký tự.");
      if(S.users.find(x=>x.email===email))throw new E(409,"Email này đã được đăng ký.");
      const u=S.users.insert({email,name,role:"user",passwordHash:S.hash(pw),createdAt:new Date().toISOString(),data:S.blank()});
      setSession(res,u.id);return json(201,{user:pub(u)});
    }
    if(p==="/api/auth/logout"&&req.method==="POST"){res.setHeader("Set-Cookie","sl=; HttpOnly; Path=/; Max-Age=0");return json(200,{ok:true})}
    if(p==="/api/auth/me")return json(200,{user:user?pub(user):null});
    if(p==="/api/me/data"&&req.method==="GET")return json(200,need().data||S.blank());
    if(p==="/api/me/data"&&req.method==="PUT"){
      const u=need(),colls={};
      Object.entries(body.colls&&typeof body.colls==="object"?body.colls:{}).slice(0,20).forEach(([k,v])=>colls[k.slice(0,60)]=arr(v,200).map(String));
      S.users.update(u.id,{data:{saved:arr(body.saved,200),colls,hist:arr(body.hist,100)}});return json(200,{ok:true});
    }
    if(p==="/api/me/settings"&&req.method==="PUT"){
      const u=need(),o=body&&typeof body==="object"?body:{};
      const PER=[10,20,50,100],FMT=["bibtex","endnote","refman","refworks"];
      const libs=arr(o.libs,5).map(l=>({name:String(l&&l.name||"").trim().slice(0,60),url:String(l&&l.url||"").trim().slice(0,300)})).filter(l=>l.name&&/^https?:\/\//i.test(l.url));
      const settings={perPage:PER.includes(+o.perPage)?+o.perPage:10,newTab:!!o.newTab,cite:o.cite==="show"?"show":"none",citeFmt:FMT.includes(o.citeFmt)?o.citeFmt:"bibtex",
        resultLang:["all","vi","en"].includes(o.resultLang)?o.resultLang:"all",lang:o.lang==="en"?"en":"vi",libs};
      S.users.update(u.id,{settings});return json(200,{settings});
    }
    if(p==="/api/me/profile"&&req.method==="POST"){
      const u=need(),name=String(body.name||"").trim();
      if(name.length<2||name.length>60)throw new E(400,"Họ tên phải từ 2 đến 60 ký tự.");
      return json(200,{user:pub(S.users.update(u.id,{name}))});
    }
    if(p==="/api/me/scholar"&&req.method==="GET")return json(200,{scholar:need().scholar||null});
    if(p==="/api/me/scholar"&&req.method==="POST"){
      const u=need(),sc=body&&typeof body==="object"?body:{};
      const scholar={
        name:String(sc.name||u.name||"").trim().slice(0,100),
        aliases:arr(sc.aliases,10).map(s=>String(s).trim().slice(0,100)).filter(Boolean),
        affiliation:String(sc.affiliation||"").trim().slice(0,200),
        verifyEmail:String(sc.verifyEmail||"").trim().slice(0,100),
        interests:arr(sc.interests,20).map(s=>String(s).trim().slice(0,80)).filter(Boolean),
        homepage:String(sc.homepage||"").trim().slice(0,300),
        autoUpdate:sc.autoUpdate!==false,
        isPublic:sc.isPublic!==false,
        emailAlerts:sc.emailAlerts!==false,
        created:true,
        articles:arr(sc.articles,200).map(a=>({
          id:String(a.id||Date.now()+"_"+Math.random().toString(36).slice(2,7)),
          title:String(a.title||a.t||"").trim().slice(0,300),
          authors:String(a.authors||(Array.isArray(a.a)?a.a.join(", "):"")).trim().slice(0,300),
          venue:String(a.venue||a.v||"").trim().slice(0,200),
          year:+a.year||+a.y||"",
          citations:+a.citations||+a.cit||0,
          url:String(a.url||"").trim().slice(0,500)
        })).filter(a=>a.title)
      };
      S.users.update(u.id,{scholar});
      return json(200,{ok:true,scholar});
    }
    if(p==="/api/me/password"&&req.method==="POST"){
      const u=need(),cur=String(body.current||""),pw=String(body.password||"");
      if(!S.check(cur,u.passwordHash))throw new E(400,"Mật khẩu hiện tại không đúng.");
      if(pw.length<6)throw new E(400,"Mật khẩu mới tối thiểu 6 ký tự.");
      if(pw===cur)throw new E(400,"Mật khẩu mới phải khác mật khẩu hiện tại.");
      S.users.update(u.id,{passwordHash:S.hash(pw)});return json(200,{ok:true});
    }
    if(p==="/api/me/delete"&&req.method==="POST"){
      const u=need();
      if(!S.check(String(body.password||""),u.passwordHash))throw new E(400,"Mật khẩu không đúng.");
      if(u.role==="admin"&&S.users.rows.filter(x=>x.role==="admin").length<=1)throw new E(400,"Không thể xóa tài khoản Admin cuối cùng.");
      S.users.remove(u.id);res.setHeader("Set-Cookie","sl=; HttpOnly; Path=/; Max-Age=0");return json(200,{ok:true});
    }
    if(p==="/api/search"&&req.method==="POST"){
      const q=String(body.q||"").trim().slice(0,300);if(!q)throw new E(400,"Thiếu câu hỏi");
      const k=allKeys();
      try{return json(200,await SEARCH.run(q,k.ai,k.oa))}catch(e){throw new E(502,e.message)}
    }
    // Tìm kiếm chuyên sâu: AI tổng hợp tổng quan / khoảng trống nghiên cứu / danh mục đọc trên kết quả đã có
    if(p==="/api/analyze"&&req.method==="POST"){
      const q=String(body.q||"").trim().slice(0,300);
      const items=arr(body.items,14).filter(x=>x&&typeof x==="object").map(x=>({n:Math.trunc(+x.n)||0,t:String(x.t||"").slice(0,300),a:arr(x.a,3).map(x2=>String(x2).slice(0,80)),
        y:+x.y||"",type:String(x.type||"").slice(0,20),venue:String(x.venue||"").slice(0,120),cit:Math.max(0,+x.cit||0),d:String(x.d||"").slice(0,600)})).filter(x=>x.n>0&&x.t);
      if(!q||!items.length)throw new E(400,"Thiếu câu hỏi hoặc danh sách tài liệu");
      const k=allKeys();
      try{return json(200,await SEARCH.analyze(q,items,k.ai))}catch(e){throw new E(502,e.message)}
    }
    if(p==="/api/admin/keys"&&req.method==="GET"){admin();return json(200,{keys:keyList(),providers:AI.PROVIDERS})}
    if(p==="/api/admin/keys"&&req.method==="POST"){
      admin();const pv=AI.PROVIDERS[body.provider],key=String(body.key||"").trim();
      if(!pv)throw new E(400,"Nhà cung cấp không hợp lệ.");
      if(key.length<10||key.length>300||/\s/.test(key))throw new E(400,"API Key không hợp lệ.");
      const model=String(body.model||pv.models[0].id);if(!pv.models.some(x=>x.id===model))throw new E(400,"Model không hợp lệ.");
      S.keys.insert({provider:body.provider,model,...S.enc(key),hint:key.slice(0,6)+"…"+key.slice(-4),createdAt:new Date().toISOString()});
      return json(201,{keys:keyList()});
    }
    if((m=p.match(/^\/api\/admin\/keys\/(\d+)(\/test)?$/))){
      admin();const k=S.keys.get(+m[1]);if(!k)throw new E(404,"Không tìm thấy API Key.");
      if(m[2]&&req.method==="POST"){
        try{
          const key=S.dec(k),msg=AI.isAI(k.provider)?await AI.test({provider:k.provider,model:k.model,key}):await SRC.testOpenAlex(key);
          return json(200,{ok:true,msg});
        }catch(e){return json(200,{ok:false,error:e.message})}
      }
      if(req.method==="DELETE"){S.keys.remove(k.id);return json(200,{keys:keyList()})}
    }
    throw new E(404,"Không tìm thấy.");
  }catch(e){json(e.c||500,{error:e.c?e.message:"Lỗi máy chủ"});if(!e.c)console.error(e)}
}).listen(PORT,()=>console.log("AcademAI Resource Discovery: http://localhost:"+PORT+"\nTài khoản demo: admin@academai.vn / admin123  |  sinhvien@academai.vn / user123"));
