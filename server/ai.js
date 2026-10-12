// Gọi mô hình ngôn ngữ (LLM). Từ bản 3.0, AI KHÔNG cần tìm web: việc tìm tài liệu do server.js/sources.js làm
// trực tiếp trên các cơ sở dữ liệu học thuật. AI chỉ dùng để (1) hiểu câu hỏi, (2) tóm tắt tiếng Việt.
const sleep=ms=>new Promise(f=>setTimeout(f,ms));

const PROVIDERS={
  Gemini:{kind:"ai",label:"Google Gemini (miễn phí, khuyên dùng)",link:"https://aistudio.google.com/app/apikey",
    steps:["Bấm “lấy key” bên dưới, đăng nhập tài khoản Google.","Bấm Create API key, chọn hoặc tạo một project.","Sao chép key rồi dán vào ô API Key."],
    models:[{id:"gemini-2.5-flash",label:"Gemini 2.5 Flash (khuyên dùng)"},{id:"gemini-2.5-flash-lite",label:"Gemini 2.5 Flash-Lite (hạn mức cao hơn)"},{id:"gemini-flash-latest",label:"Gemini Flash (mới nhất)"}]},
  Groq:{kind:"ai",label:"Groq (miễn phí, nhanh)",link:"https://console.groq.com/keys",
    steps:["Bấm “lấy key”, đăng ký/đăng nhập Groq Console.","Bấm Create API Key, đặt tên bất kỳ.","Sao chép key (bắt đầu bằng gsk_) rồi dán vào ô API Key."],
    models:[{id:"llama-3.3-70b-versatile",label:"Llama 3.3 70B (khuyên dùng)"},{id:"openai/gpt-oss-120b",label:"GPT-OSS 120B"},{id:"llama-3.1-8b-instant",label:"Llama 3.1 8B (nhanh, nhẹ)"}]},
  Claude:{kind:"ai",label:"Anthropic Claude (trả phí)",link:"https://console.anthropic.com/settings/keys",
    steps:["Bấm “lấy key”, đăng nhập Anthropic Console và nạp tín dụng.","Bấm Create Key, sao chép key (sk-ant-…) rồi dán vào ô API Key."],
    models:[{id:"claude-sonnet-5",label:"Claude Sonnet 5 (cân bằng)"},{id:"claude-haiku-4-5-20251001",label:"Claude Haiku 4.5 (nhanh, rẻ)"}]},
  OpenAI:{kind:"ai",label:"OpenAI (trả phí)",link:"https://platform.openai.com/api-keys",
    steps:["Bấm “lấy key”, đăng nhập OpenAI Platform và nạp tín dụng.","Bấm Create new secret key, sao chép key (sk-…) rồi dán vào ô API Key."],
    models:[{id:"gpt-4o-mini",label:"GPT-4o Mini"}]},
  OpenAlex:{kind:"source",label:"OpenAlex (nguồn dữ liệu học thuật, miễn phí, nên thêm)",link:"https://openalex.org/settings/api",
    steps:["Bấm “lấy key”, tạo tài khoản OpenAlex (khoảng 30 giây, miễn phí).","Vào openalex.org/settings/api, sao chép API key.","Dán vào ô API Key. Có key thì hạn mức tìm kiếm mỗi ngày tăng gấp 10 lần so với không key."],
    models:[{id:"api",label:"OpenAlex API"}]}
};
const isAI=p=>!!PROVIDERS[p]&&PROVIDERS[p].kind==="ai";

async function post(url,headers,body,key,tries=2){
  let r,j;
  for(let i=0;i<tries;i++){
    try{r=await fetch(url,{method:"POST",headers:{"content-type":"application/json",...headers},body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});j=await r.json().catch(()=>({}))}
    catch(e){const er=new Error("Không kết nối được nhà cung cấp AI: "+(e.name==="TimeoutError"?"quá thời gian chờ":e.message));er.status=0;throw er}
    if(r.ok)return j;
    if(![429,503].includes(r.status)||i===tries-1)break;
    await sleep(1500); // quá tải tạm thời: chờ rồi thử lại
  }
  const er=new Error(String((j.error&&(j.error.message||j.error))||r.status).split(key).join("***").slice(0,200));
  er.status=r.status;throw er;
}

async function call(provider,key,model,text){
  if(provider==="Gemini"){
    const j=await post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{"x-goog-api-key":key},
      {contents:[{role:"user",parts:[{text}]}],generationConfig:{temperature:0.2}},key),c=(j.candidates||[])[0]||{};
    return((c.content&&c.content.parts)||[]).filter(p=>!p.thought).map(p=>p.text||"").join("");
  }
  if(provider==="Claude"){
    const j=await post("https://api.anthropic.com/v1/messages",{"x-api-key":key,"anthropic-version":"2023-06-01"},
      {model,max_tokens:4000,temperature:0.2,messages:[{role:"user",content:text}]},key);
    return(j.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
  }
  const url=provider==="Groq"?"https://api.groq.com/openai/v1/chat/completions":"https://api.openai.com/v1/chat/completions";
  const j=await post(url,{authorization:"Bearer "+key},{model,temperature:0.2,messages:[{role:"user",content:text}]},key);
  return(j.choices&&j.choices[0]&&j.choices[0].message.content)||"";
}

// Thứ tự model thử cho một key: model Admin chọn trước, rồi các model còn lại của nhà cung cấp (tối đa 3).
// Hạn mức (quota) tính riêng từng model nên model sau vẫn có thể chạy khi model đầu hết quota.
const chain=k=>{const ids=PROVIDERS[k.provider].models.map(m=>m.id);return(ids.includes(k.model)?[k.model,...ids.filter(x=>x!==k.model)]:ids).slice(0,3)};

// Thử lần lượt các key AI (theo thứ tự) và các model của từng key, dừng ở lần đầu thành công.
async function llm(keys,text){
  const list=keys.filter(k=>isAI(k.provider)),errs=[];
  if(!list.length)throw new Error("chưa có key AI");
  for(const k of list){
    for(const model of chain(k)){
      try{
        const out=await call(k.provider,k.key,model,text);
        if(!out.trim())throw new Error("AI trả về nội dung rỗng");
        return{text:out,provider:k.provider,model};
      }catch(e){
        const m=`${k.provider}: ${e.message}`.slice(0,110);
        if(!errs.includes(m))errs.push(m);
        if(e.status===401||e.status===403||(e.status===400&&/api key|invalid/i.test(e.message)))break; // key sai: đổi model cũng vô ích
      }
    }
  }
  throw new Error(errs.slice(0,3).join(" | "));
}

function jsonObj(t){
  const s=String(t).replace(/```(?:json)?/gi,""),a=s.indexOf("{"),b=s.lastIndexOf("}");
  if(a<0||b<a)throw new Error("AI không trả về JSON");
  return JSON.parse(s.slice(a,b+1));
}

async function test(k){
  const r=await llm([k],"Trả lời đúng một từ: OK");
  return"model "+r.model+(r.model!==k.model?" (model đã chọn không dùng được, tự chuyển sang model này)":"");
}

module.exports={PROVIDERS,isAI,llm,jsonObj,test};
