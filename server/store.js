// Lưu trữ JSON trong data/ + mật khẩu (scrypt) + phiên (HMAC) + mã hóa API key (AES-256-GCM).
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const DIR=path.join(__dirname,"..","data");fs.mkdirSync(DIR,{recursive:true});
class Col{
  constructor(n){this.f=path.join(DIR,n+".json");this.rows=fs.existsSync(this.f)?JSON.parse(fs.readFileSync(this.f,"utf8")||"[]"):[]}
  save(){fs.writeFileSync(this.f+".tmp",JSON.stringify(this.rows,null,1));fs.renameSync(this.f+".tmp",this.f)}
  get(id){return this.rows.find(r=>r.id===id)||null}
  find(p){return this.rows.find(p)||null}
  insert(r){const rec={id:this.rows.reduce((m,x)=>Math.max(m,x.id),0)+1,...r};this.rows.push(rec);this.save();return rec}
  update(id,p){const r=this.get(id);if(r){Object.assign(r,p);this.save()}return r}
  remove(id){const i=this.rows.findIndex(r=>r.id===id);if(i<0)return false;this.rows.splice(i,1);this.save();return true}
}
const SF=path.join(DIR,".secret");
const SECRET=process.env.SESSION_SECRET||(fs.existsSync(SF)?fs.readFileSync(SF,"utf8").trim():(()=>{const s=crypto.randomBytes(32).toString("hex");fs.writeFileSync(SF,s,{mode:0o600});return s})());
const EK=crypto.createHash("sha256").update("enc:"+SECRET).digest();
const hash=p=>{const s=crypto.randomBytes(16);return s.toString("hex")+":"+crypto.scryptSync(p,s,64).toString("hex")};
const check=(p,st)=>{const[s,h]=String(st||"").split(":");if(!s||!h)return false;const e=Buffer.from(h,"hex");return crypto.timingSafeEqual(e,crypto.scryptSync(p,Buffer.from(s,"hex"),e.length))};
const sign=(o,days=7)=>{const b=Buffer.from(JSON.stringify({...o,exp:Date.now()+days*864e5})).toString("base64url");return b+"."+crypto.createHmac("sha256",SECRET).update(b).digest("base64url")};
const verify=t=>{if(!t)return null;const[b,s]=String(t).split(".");if(!b||!s)return null;const e=crypto.createHmac("sha256",SECRET).update(b).digest("base64url");if(s.length!==e.length||!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(e)))return null;try{const p=JSON.parse(Buffer.from(b,"base64url").toString());return p.exp>Date.now()?p:null}catch{return null}};
const enc=t=>{const iv=crypto.randomBytes(12),c=crypto.createCipheriv("aes-256-gcm",EK,iv),d=Buffer.concat([c.update(t,"utf8"),c.final()]);return{iv:iv.toString("hex"),tag:c.getAuthTag().toString("hex"),data:d.toString("hex")}};
const dec=({iv,tag,data})=>{const d=crypto.createDecipheriv("aes-256-gcm",EK,Buffer.from(iv,"hex"));d.setAuthTag(Buffer.from(tag,"hex"));return Buffer.concat([d.update(Buffer.from(data,"hex")),d.final()]).toString()};
const users=new Col("users"),keys=new Col("api-keys");
const blank=()=>({saved:[],colls:{"Đọc sau":[],"Tham khảo luận văn":[]},hist:[]});
if(!users.rows.length){ // tài khoản demo
  users.insert({email:"admin@academai.vn",name:"Quản trị viên",role:"admin",passwordHash:hash("admin123"),createdAt:new Date().toISOString(),data:blank()});
  users.insert({email:"sinhvien@academai.vn",name:"Sinh viên Demo",role:"user",passwordHash:hash("user123"),createdAt:new Date().toISOString(),data:blank()});
  users.insert({email:"admin@scholarlens.vn",name:"Quản trị viên",role:"admin",passwordHash:hash("admin123"),createdAt:new Date().toISOString(),data:blank()});
  users.insert({email:"sinhvien@scholarlens.vn",name:"Sinh viên Demo",role:"user",passwordHash:hash("user123"),createdAt:new Date().toISOString(),data:blank()});
}
module.exports={users,keys,hash,check,sign,verify,enc,dec,blank};
