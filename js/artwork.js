/* ═══════════════════════════════════════════════════════════════════════════
   AcademAI: ảnh minh họa riêng cho từng bài ở tab "Nổi bật"
   Mỗi bài có một hình vẽ SVG mô tả đúng nội dung công trình (cơ chế Attention,
   chuỗi xoắn kép ADN, đồ thị PageRank, mạng thế giới nhỏ…) nên không bao giờ
   trùng ảnh, không phụ thuộc mạng và không bị lỗi link.
   Nạp sau featured.js: ghi đè trường `img` của từng bài bằng ảnh data-URI.
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
if(typeof FEATURED_PAPERS==="undefined")return;

/* ── Hàm vẽ cơ bản ─────────────────────────────────────────────────────── */
const n=v=>Math.round(v*10)/10;
const o=(x,y,rr=8,op=1,fill="#fff",st="none")=>`<circle cx="${n(x)}" cy="${n(y)}" r="${rr}" fill="${fill}" stroke="${st}" stroke-width="3" opacity="${op}"/>`;
const l=(x1,y1,x2,y2,w=3,op=.9,dash="")=>`<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="#fff" stroke-width="${w}" stroke-linecap="round" opacity="${op}"${dash?` stroke-dasharray="${dash}"`:""}/>`;
const r=(x,y,w,h,f=0,rx=10,op=1,sw=3)=>`<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${rx}" fill="#fff" fill-opacity="${f}" stroke="#fff" stroke-width="${sw}" opacity="${op}"/>`;
const p=(d,sw=3,f=0,op=1,dash="")=>`<path d="${d}" fill="#fff" fill-opacity="${f}" stroke="#fff" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"${dash?` stroke-dasharray="${dash}"`:""}/>`;
const t=(x,y,s,size=24,op=1)=>`<text x="${n(x)}" y="${n(y)}" text-anchor="middle" font-size="${size}" font-weight="800" fill="#fff" opacity="${op}" font-family="Segoe UI,Arial,sans-serif">${s}</text>`;
const pts=a=>"M"+a.map(q=>n(q[0])+" "+n(q[1])).join(" L");
const pl=(a,sw=3,f=0,op=1,dash="")=>p(pts(a),sw,f,op,dash);
const ar=(x1,y1,x2,y2,w=3,h=11)=>{const a=Math.atan2(y2-y1,x2-x1);return l(x1,y1,x2,y2,w)+p(`M${n(x2-h*Math.cos(a-.5))} ${n(y2-h*Math.sin(a-.5))} L${n(x2)} ${n(y2)} L${n(x2-h*Math.cos(a+.5))} ${n(y2-h*Math.sin(a+.5))}`,w)};
const mk=s=>()=>(s=(s*16807)%2147483647)/2147483647;

// Mạng nơ-ron: L = số nút mỗi lớp; drop = tập "lớp,nút" bị loại bỏ (dropout)
const net=(L,x0,x1,cy,gap,drop)=>{
  const D=drop||new Set();
  const P=L.map((c,i)=>Array.from({length:c},(_,j)=>[x0+(x1-x0)*i/(L.length-1),cy+(j-(c-1)/2)*gap,D.has(i+","+j)]));
  let s="";
  for(let i=0;i<P.length-1;i++)P[i].forEach(a=>P[i+1].forEach(b=>{if(!a[2]&&!b[2])s+=l(a[0],a[1],b[0],b[1],1.3,.3)}));
  P.forEach(c=>c.forEach(a=>{
    s+=a[2]?o(a[0],a[1],9,.22)+l(a[0]-6,a[1]-6,a[0]+6,a[1]+6,2.5,.8)+l(a[0]+6,a[1]-6,a[0]-6,a[1]+6,2.5,.8):o(a[0],a[1],9);
  }));
  return s;
};
// Cây quyết định nhị phân
const tree=(x,y,d,sp,k)=>{
  let s=o(x,y,k?6:7,k?1:.85);
  if(k)[-1,1].forEach(m=>{s=l(x,y,x+m*sp,y+d,2.5,.8)+tree(x+m*sp,y+d,d,sp*.55,k-1)+s});
  return s;
};
// Nhiễm sắc thể (hình thanh)
const cap=a=>`<g transform="rotate(${a} 300 160)">`+r(272,62,56,196,.22,28)+[96,124,196,222].map(y=>l(278,y,322,y,3,.55)).join("")+`</g>`;

/* ── 50 hình minh họa, khóa theo id của bài ────────────────────────────── */
const M={
  // 1. Transformer: ma trận Attention giữa các token
  1:()=>{let s="";const xs=[0,1,2,3,4,5].map(i=>135+i*66);
    xs.forEach((a,i)=>xs.forEach((b,j)=>{const w=Math.exp(-Math.abs(i-j)*.6);s+=l(a,98,b,222,1.5+3*w,.1+.65*w)}));
    xs.forEach(a=>{s+=r(a-22,72,44,26,.35,8)+r(a-22,222,44,26,.35,8)});return s},
  // 2. ResNet: khối phần dư có liên kết tắt
  2:()=>o(105,160,9)+l(114,160,172,160)+r(172,128,84,64,.25,12)+t(214,166,"conv",17)+l(256,160,292,160)+r(292,128,84,64,.25,12)+t(334,166,"conv",17)+l(376,160,430,160)+o(452,160,22,.25,"#fff","#fff")+t(452,171,"+",32)+ar(474,160,508,160)+p("M105 150 C105 55 452 55 452 120",3,0,.95,"9 8")+ar(452,112,452,134)+t(280,92,"identity",18,.9),
  // 3. GAN: bộ sinh G và bộ phân biệt D đối kháng
  3:()=>r(90,112,116,96,.2,18)+t(148,172,"G",54)+r(394,112,116,96,.2,18)+t(452,172,"D",54)+ar(206,148,258,148)+r(262,120,76,56,.3,8)+t(300,160,"?",34)+ar(342,148,392,148)+p("M452 104 C452 40 148 40 148 90",3,0,.85,"8 8")+ar(148,82,148,106),
  // 4. AlexNet: các lớp tích chập thu nhỏ dần rồi tới lớp kết nối đầy đủ
  4:()=>{let s="";[[78,96,104],[196,112,80],[296,126,60],[376,138,42]].forEach(([x,y,w])=>{s+=r(x+12,y-12,w,w,.1,8,.55,2.5)+r(x,y,w,w,.22,8)});
    const A=[110,145,180,215].map(y=>[455,y]),B=[[525,145],[525,185]];
    A.forEach(a=>B.forEach(b=>{s+=l(a[0],a[1],b[0],b[1],1.5,.4)}));A.concat(B).forEach(a=>{s+=o(a[0],a[1],8)});return s},
  // 5. BERT: từ bị che [MASK] được dự đoán từ cả hai phía
  5:()=>{let s="";const xs=[0,1,2,3,4].map(i=>110+i*95);
    xs.forEach((x,i)=>{if(i!==2)s+=p(`M${x} 188 C${x} 112 300 112 300 186`,2.5,0,.75)});
    xs.forEach((x,i)=>{s+=r(x-38,190,76,42,i===2?.55:.15,12)+(i===2?t(x,218,"[MASK]",16):l(x-20,211,x+20,211,4,.7))});
    return s+t(300,100,"← →",34,.9)},
  // 6. GPT-3: mạng khổng lồ 175 tỷ tham số
  6:()=>net([3,5,6,5,3],110,490,162,28)+t(300,76,"175B",28,.95),
  // 7. AlphaFold: dải xoắn protein
  7:()=>{const a=[];for(let i=0;i<=44;i++){const u=i/44;a.push([85+u*430,160+Math.sin(u*Math.PI*4)*58*(1-.2*Math.cos(u*7))])}
    let s=pl(a,16,0,.28)+pl(a,4);a.forEach((q,i)=>{if(i%4===0)s+=o(q[0],q[1],7)});return s},
  // 8. AlphaGo: bàn cờ vây và các quân cờ
  8:()=>{let s="";const x0=212,y0=78,c=35;
    for(let i=0;i<6;i++)s+=l(x0+i*c,y0,x0+i*c,y0+5*c,2,.55)+l(x0,y0+i*c,x0+5*c,y0+i*c,2,.55);
    [[1,1,0],[2,2,1],[3,1,1],[1,3,1],[4,3,0],[3,4,0],[2,3,0],[4,1,1]].forEach(([i,j,w])=>{s+=o(x0+i*c,y0+j*c,14,1,w?"#fff":"#0b1226","#fff")});return s},
  // 9. Chuỗi xoắn kép ADN
  9:()=>{const A=[],B=[];let s="";for(let i=0;i<=26;i++){const x=85+i*(430/26),y=Math.sin(i*.5)*62;A.push([x,160+y]);B.push([x,160-y]);if(i%2===0)s+=l(x,160+y,x,160-y,2.5,.5)}
    return s+pl(A,6,0,.95)+pl(B,6,0,.65)},
  // 10. CRISPR-Cas9: kéo cắt gen dẫn đường bởi RNA
  10:()=>{let s="";[148,188].forEach(y=>{s+=l(90,y,262,y,5)+l(338,y,510,y,5)});
    for(let x=106;x<=250;x+=18)s+=l(x,148,x,188,2,.4);for(let x=352;x<=496;x+=18)s+=l(x,148,x,188,2,.4);
    s+=l(250,70,336,150,4)+l(350,70,264,150,4)+o(246,62,13,1,"none","#fff")+o(354,62,13,1,"none","#fff");
    return s+p("M200 238 q13 -24 26 0 t26 0 t26 0 t26 0 t26 0 t26 0 t26 0",4,0,.9)+t(300,266,"gRNA",16,.9)},
  // 11. Thuyết tương đối hẹp: nón ánh sáng
  11:()=>l(300,160,198,62,3.5)+l(300,160,402,62,3.5)+l(300,160,198,258,3.5)+l(300,160,402,258,3.5)+`<ellipse cx="300" cy="62" rx="102" ry="16" fill="#fff" fill-opacity=".15" stroke="#fff" stroke-width="3"/><ellipse cx="300" cy="258" rx="102" ry="16" fill="#fff" fill-opacity=".15" stroke="#fff" stroke-width="3"/>`+o(300,160,10)+t(495,172,"E = mc²",30)+l(90,160,196,160,2,.5,"6 6"),
  // 12. Sóng hấp dẫn LIGO: tín hiệu "chirp" của hai lỗ đen hợp nhất
  12:()=>{const a=[];for(let i=0;i<=200;i++){const u=i/200,amp=u<.8?10+54*Math.pow(u/.8,3):64*Math.exp(-(u-.8)*18);a.push([80+u*430,172+amp*Math.sin(2*Math.PI*(2.2*u+10*u*u*u))])}
    return l(80,172,510,172,1.5,.4,"6 6")+pl(a,3.5)+o(150,88,17,1,"#0b1226","#fff")+o(188,88,17,1,"#0b1226","#fff")},
  // 13. Higgs: va chạm hạt trong máy gia tốc LHC
  13:(R)=>{let s=`<ellipse cx="300" cy="160" rx="195" ry="88" fill="none" stroke="#fff" stroke-width="4" opacity=".6"/><ellipse cx="300" cy="160" rx="170" ry="68" fill="none" stroke="#fff" stroke-width="2" opacity=".3"/>`;
    for(let i=0;i<14;i++){const a=i*Math.PI*2/14+R()*.3,len=34+R()*52,x=300+Math.cos(a)*len,y=160+Math.sin(a)*len*.9;s+=l(300,160,x,y,2.6,.85)+o(x,y,3.5)}
    return s+ar(110,160,262,160,3.5)+ar(490,160,338,160,3.5)+o(300,160,12)},
  // 14. PageRank: đồ thị liên kết, nút lớn = trang quan trọng
  14:()=>{const V=[[300,150,30],[170,105,17],[430,100,20],[185,218,13],[405,218,24],[105,165,10],[500,170,12],[300,238,11],[300,72,10],[240,200,9]];
    const E=[[1,0],[2,0],[3,0],[4,0],[5,1],[6,2],[7,4],[8,2],[9,0],[3,4],[0,4],[1,3],[8,1],[7,3],[4,6],[2,6]];
    let s="";E.forEach(([a,b])=>{s+=l(V[a][0],V[a][1],V[b][0],V[b][1],1.6,.4)});V.forEach(([x,y,rr])=>{s+=o(x,y,rr,.95)});return s},
  // 15. Bitcoin: đồng xu và chuỗi khối
  15:()=>r(232,66,136,136,.2,68,1,5)+t(300,166,"B",84)+l(286,84,286,104,5)+l(314,84,314,104,5)+l(286,172,286,192,5)+l(314,172,314,192,5)+[140,265,390].map((x,i)=>r(x,220,70,30,.3,8)+(i<2?l(x+70,235,x+125,235,3):"")).join(""),
  // 16. RSA: ổ khóa và cặp khóa công khai
  16:()=>r(238,146,124,100,.3,18,1,4)+p("M264 146 V118 a36 36 0 0 1 72 0 V146",6)+o(300,190,13)+l(300,197,300,222,7)+t(130,200,"p × q",32)+t(470,200,"e, n",32)+l(180,190,232,190,2,.5,"5 5")+l(368,190,420,190,2,.5,"5 5"),
  // 17. Shannon: nguồn tin → kênh truyền → tín hiệu nhiễu
  17:(R)=>{const A=[],B=[];for(let i=0;i<=40;i++){const x=i/40;A.push([80+x*150,160+Math.sin(x*Math.PI*4)*34]);B.push([370+x*150,160+Math.sin(x*Math.PI*4)*34+(R()-.5)*22])}
    return pl(A,4)+pl(B,4,0,.8)+r(252,112,96,96,.2,16)+t(300,172,"H",52)+t(300,244,"0110",22,.8)},
  // 18. Phép thử Turing: cuộc trò chuyện người – máy
  18:()=>r(92,82,250,76,.22,34)+p("M138 158 L124 186 L168 160",3,.22)+t(217,128,"Are you human?",22)+r(258,178,250,76,.35,34)+p("M462 254 L478 280 L430 256",3,.35)+t(383,224,"I think so.",22),
  // 19. Cân bằng Nash: ma trận lợi ích 2×2
  19:()=>r(170,82,260,160,.08,10)+r(300,162,130,80,.4,0,1,0)+l(300,82,300,242,3)+l(170,162,430,162,3)+t(235,132,"3, 3",28)+t(365,132,"0, 5",28)+t(235,212,"5, 0",28)+t(365,212,"1, 1",28),
  // 20. Lý thuyết triển vọng: hàm giá trị hình chữ S, sợ mất mát hơn
  20:()=>{const a=[];for(let i=-40;i<=40;i++){const x=i/40,v=x>=0?Math.pow(x,.62):-1.7*Math.pow(-x,.62);a.push([300+x*190,160-v*56])}
    return l(95,160,505,160,2,.5)+l(300,64,300,256,2,.5)+pl(a,5)+t(462,184,"Gains",18,.85)+t(138,146,"Losses",18,.85)},
  // 21. Vắc-xin mRNA: ống tiêm, hiệu quả 95%
  21:()=>`<g transform="rotate(-32 300 160)">`+r(185,138,190,44,.22,10)+l(185,160,140,160,4)+r(130,142,14,36,.7,3)+l(200,126,200,194,5)+l(375,160,448,160,3.5)+l(240,148,240,172,2,.5)+l(280,148,280,172,2,.5)+l(320,148,320,172,2,.5)+`</g>`+p("M92 100 q12 -26 24 0 t24 0 t24 0 t24 0 t24 0",4,0,.9)+t(470,236,"95%",40),
  // 22. Bộ gen người hoàn chỉnh: nhiễm sắc thể
  22:()=>cap(32)+cap(-32)+o(300,160,9)+t(118,166,"T2T",34)+t(494,166,"3.055 Gb",26),
  // 23. Jiuzhang: mạng giao thoa quang, các photon
  23:()=>{let s="";const Y=[100,140,180,220];Y.forEach(y=>{s+=l(110,y,490,y,3,.7)+o(92,y,7)+r(500,y-9,18,18,.5,4,1,2)});
    [[190,0],[250,1],[310,0],[370,2],[430,1]].forEach(([x,i])=>{s+=l(x-20,Y[i],x+20,Y[i+1],3)+l(x-20,Y[i+1],x+20,Y[i],3)});
    [150,215,280,340,400,460].forEach((x,i)=>{s+=o(x,Y[i%4],5,.9)});return s},
  // 24. Sycamore: chip siêu dẫn với lưới qubit
  24:()=>{let s=r(140,66,320,196,.1,18,1,4);const P=[];
    for(let j=0;j<4;j++)for(let i=0;i<6;i++)P.push([190+i*44,112+j*44,i,j]);
    P.forEach(a=>{if(a[2]<5)s+=l(a[0],a[1],a[0]+44,a[1],2,.5);if(a[3]<3)s+=l(a[0],a[1],a[0],a[1]+44,2,.5)});
    P.forEach((a,k)=>{s+=o(a[0],a[1],8,k%5===0?1:.8);if(k%7===0)s+=o(a[0],a[1],14,1,"none","#fff")});
    [112,156,200,244].forEach(y=>{s+=l(126,y,140,y,3,.7)+l(460,y,474,y,3,.7)});return s},
  // 25. IPCC 1.5°C: nhiệt kế và đường nhiệt độ tăng
  25:()=>r(134,62,32,146,.18,16,1,4)+r(144,112,12,100,1,6,1,0)+o(150,226,26)+l(235,215,515,215,2,.5)+l(235,215,235,70,2,.5)+l(235,120,515,120,2,.7,"7 7")+pl([[240,206],[280,200],[320,192],[360,170],[400,150],[440,118],[480,94],[510,84]],5)+t(375,246,"+1.5°C",34),
  // 26. Dấu ấn ung thư: tế bào và 10 đặc điểm xung quanh
  26:()=>{let s=o(300,162,52,1,"none","#fff")+o(300,162,19,.9);
    for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,x=300+Math.cos(a)*108,y=162+Math.sin(a)*86;s+=l(300+Math.cos(a)*52,162+Math.sin(a)*52,x,y,2,.45,"4 5")+o(x,y,i%2?9:13,i%2?.7:.95)}return s},
  // 27. Lan truyền ngược: sai số chạy ngược qua mạng
  27:()=>net([3,4,4,2],130,470,138,34)+p("M470 232 H140",3,0,.95,"9 7")+ar(150,232,126,232)+t(300,222,"∂L/∂w",22),
  // 28. LSTM: ô nhớ với các cổng
  28:()=>r(168,100,264,122,.1,18,1,3)+l(110,76,490,76,4,.95)+ar(480,76,502,76)+[[222,"σ"],[300,"σ"],[378,"tanh"]].map(([x,s])=>l(x,76,x,145,2.5,.6)+o(x,170,25,.3)+t(x,s==="tanh"?176:179,s,s==="tanh"?15:24)).join("")+o(222,76,13,1,"#0b1226","#fff")+t(222,83,"×",20)+o(300,76,13,1,"#0b1226","#fff")+t(300,84,"+",22)+ar(300,262,300,226),
  // 29. Adam: đường đi tối ưu hóa trên mặt đồng mức
  29:()=>{let s="";[[165,95],[115,70],[70,42],[30,18]].forEach(([rx,ry],i)=>{s+=`<ellipse cx="385" cy="160" rx="${rx}" ry="${ry}" fill="none" stroke="#fff" stroke-width="2" opacity="${.25+i*.12}" transform="rotate(-18 385 160)"/>`});
    const a=[[120,92],[185,196],[250,118],[305,184],[345,142],[372,170],[385,160]];
    return s+pl(a,4)+a.map(q=>o(q[0],q[1],6)).join("")+o(385,160,10)+o(120,92,10,.6)},
  // 30. SIFT: điểm đặc trưng bất biến thang đo và hướng
  30:()=>{let s=r(140,76,320,170,.1,14);
    [[215,130,28,.5],[330,108,20,2.2],[392,188,36,1.2],[262,200,22,3.6],[318,162,13,5]].forEach(([x,y,rr,a])=>{s+=o(x,y,rr,1,"none","#fff")+l(x,y,x+rr*Math.cos(a),y+rr*Math.sin(a),3)+o(x,y,3.5)});return s},
  // 31. Random Forest: ba cây quyết định bỏ phiếu
  31:()=>tree(150,82,46,34,3)+tree(300,82,46,34,3)+tree(450,82,46,34,3),
  // 32. Gradient Boosting: xấp xỉ hàm số bằng các bậc thang
  32:()=>{const f=x=>Math.sin(x*Math.PI*2)*.9+.2*x,c=[];for(let i=0;i<=80;i++){const x=i/80;c.push([90+x*420,160-f(x)*62])}
    let d="";for(let k=0;k<10;k++){const xa=k/10,xb=(k+1)/10,y=160-f((xa+xb)/2)*62;d+=(k?"L":"M")+n(90+xa*420)+" "+n(y)+" L"+n(90+xb*420)+" "+n(y)+" "}
    return pl(c,3,0,.5,"8 7")+p(d,5)},
  // 33. Faster R-CNN: khung đề xuất vùng và hộp bao
  33:()=>r(128,70,344,184,.08,14)+r(168,118,116,112,.2,6,1,4)+r(168,100,52,18,.9,4,1,0)+r(322,138,112,78,.2,6,1,4)+r(322,120,52,18,.9,4,1,0)+p("M150 140 h50 v70 h-50 Z",2,0,.5,"6 5")+p("M296 92 h90 v40 h-90 Z",2,0,.5,"6 5")+p("M232 190 h70 v56 h-70 Z",2,0,.5,"6 5"),
  // 34. YOLO: lưới ô vuông, mỗi ô dự đoán một hộp bao
  34:()=>{let s=r(150,72,300,185,.06,10);
    for(let i=1;i<7;i++)s+=l(150+i*300/7,72,150+i*300/7,257,1.5,.4);
    for(let j=1;j<5;j++)s+=l(150,72+j*37,450,72+j*37,1.5,.4);
    return s+r(150+3*300/7,72+2*37,300/7,37,.5,0,1,0)+r(205,104,180,118,0,8,1,4)+o(150+3.5*300/7,72+2.5*37,5)},
  // 35. Double Q-learning: hai bảng Q và đường đi tới đích
  35:()=>{let s="";[[104,"QA"],[336,"QB"]].forEach(([x0,lab],g)=>{
      for(let i=0;i<=4;i++)s+=l(x0+i*40,92,x0+i*40,252,2,.5)+l(x0,92+i*40,x0+160,92+i*40,2,.5);
      const path=g?[[0,3],[1,3],[1,2],[2,2],[2,1],[3,1],[3,0]]:[[0,3],[0,2],[1,2],[1,1],[2,1],[2,0],[3,0]];
      s+=pl(path.map(([i,j])=>[x0+i*40+20,92+j*40+20]),4)+o(x0+20,92+3*40+20,8)+t(x0+3*40+20,92+29,"★",24)+t(x0+80,80,lab,20)});
    return s},
  // 36. Constitutional AI: khiên bảo vệ và dấu kiểm
  36:()=>p("M300 70 L395 105 V170 C395 215 350 245 300 262 C250 245 205 215 205 170 V105 Z",4,.2)+p("M255 165 L290 200 L350 130",9),
  // 37. InstructGPT / RLHF: con người xếp hạng đầu ra
  37:()=>[270,200,130].map((w,i)=>{const y=92+i*46;return r(200,y,w,32,.3,10)+o(160,y+16,16,1,"none","#fff")+t(160,y+23,String(i+1),20)}).join("")+t(500,118,"★",34),
  // 38. LLaMA: họ mô hình 7B → 65B
  38:()=>{let s=l(110,170,450,170,2,.4,"6 6");
    [[110,22,"7B"],[200,32,"13B"],[312,46,"33B"],[452,66,"65B"]].forEach(([x,rr,lab])=>{s+=o(x,170,rr,1,"#0b1226","#fff")+o(x,170,rr,.18)+t(x,176,lab,rr>30?20:15)});return s},
  // 39. Chain-of-Thought: các bước suy luận từ câu hỏi tới đáp án
  39:()=>{let s="";["Q","1","2","A"].forEach((lab,i)=>{const x=105+i*100,y=196-i*34;s+=r(x,y,80,42,i===3?.5:.2,12)+t(x+40,y+29,lab,24);if(i<3)s+=ar(x+84,y+21,x+98,y-13,2.5,8)});return s},
  // 40. DDPM: ảnh bị thêm nhiễu dần qua từng bước
  40:(R)=>{let s="";
    for(let i=0;i<5;i++){const x=72+i*100,y=120;
      s+=r(x,y,84,84,.1,10)+o(x+42,y+42,22-i*2,[.9,.77,.54,.32,0][i]);
      for(let k=0;k<i*22;k++)s+=o(x+6+R()*72,y+6+R()*72,2.2,.85);
      if(i<4)s+=ar(x+86,162,x+99,162,2.5,7)}
    return s+t(300,246,"x0 → xT",22,.9)},
  // 41. Stable Diffusion: nén ảnh vào không gian tiềm ẩn
  41:(R)=>{let s=p("M88 96 L206 134 V190 L88 228 Z",3,.2)+p("M512 96 L394 134 V190 L512 228 Z",3,.2)+r(255,115,90,90,.25,10);
    for(let k=0;k<40;k++)s+=o(262+R()*76,122+R()*76,2,.8);
    return s+ar(210,162,250,162)+ar(350,162,390,162)+t(300,100,"z",24)+p("M262 106 C262 66 338 66 338 106",3,0,.8,"7 6")},
  // 42. Sức mạnh của mối quan hệ yếu: hai cụm nối bằng một cây cầu
  42:()=>{let s="";
    const cl=(cx,off)=>{const q=[];for(let i=0;i<7;i++){const a=off+i*Math.PI*2/7;q.push([cx+Math.cos(a)*58,160+Math.sin(a)*58])}
      q.forEach((a,i)=>{const b=q[(i+1)%7];s+=l(a[0],a[1],b[0],b[1],2,.55)+l(a[0],a[1],cx,160,1.5,.35)});
      q.forEach(a=>{s+=o(a[0],a[1],9)});s+=o(cx,160,12);return q};
    const A=cl(165,0),B=cl(435,Math.PI);
    return s+l(A[0][0],A[0][1],B[0][0],B[0][1],5,1,"3 9")+o(300,160,7)},
  // 43. Mạng thế giới nhỏ: vòng tròn kèm vài đường tắt
  43:()=>{let s="";const q=[],N=18;
    for(let i=0;i<N;i++){const a=i*Math.PI*2/N-Math.PI/2;q.push([300+Math.cos(a)*92,160+Math.sin(a)*86])}
    q.forEach((a,i)=>{[1,2].forEach(k=>{const b=q[(i+k)%N];s+=l(a[0],a[1],b[0],b[1],2,.5)})});
    [[0,9],[4,12],[6,15],[2,10]].forEach(([i,j])=>{s+=l(q[i][0],q[i][1],q[j][0],q[j][1],3.5,.95,"2 8")});
    q.forEach(a=>{s+=o(a[0],a[1],8)});return s},
  // 44. Mạng không tỉ lệ: vài nút trung tâm rất nhiều liên kết
  44:()=>{const H=[[222,152,24,11,.3],[410,176,17,7,1],[334,92,12,4,2]];
    let s=l(222,152,410,176,3,.7)+l(222,152,334,92,3,.7)+l(410,176,334,92,3,.7);
    H.forEach(([x,y,rr,k,off])=>{for(let i=0;i<k;i++){const a=off+i*Math.PI*2/k,d=rr*2.3+10,lx=x+Math.cos(a)*d,ly=y+Math.sin(a)*d;s+=l(x,y,lx,ly,1.8,.5)+o(lx,ly,5.5,.9)}});
    H.forEach(([x,y,rr])=>{s+=o(x,y,rr,1)});return s},
  // 45. NSGA-II: biên Pareto của bài toán đa mục tiêu
  45:(R)=>{let s=l(112,242,112,76,2.5,.7)+l(112,242,505,242,2.5,.7);
    for(let i=0;i<30;i++){const f=R(),g=Math.min(1,1-Math.sqrt(f)+.06+R()*.5);s+=o(122+f*370,242-g*150,4.5,.5)}
    const F=[];for(let i=0;i<=9;i++){const f=i/9;F.push([122+f*370,242-(1-Math.sqrt(f))*150])}
    return s+pl(F,3.5,0,.95)+F.map(a=>o(a[0],a[1],7)).join("")},
  // 46. Cấu trúc các cuộc cách mạng khoa học: chuyển dịch hình mẫu
  46:()=>{let s=r(92,100,134,134,.12,14);
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)s+=o(121+i*38,129+j*38,8);
    s+=ar(246,166,354,166,4)+t(300,148,"!",34)+p("M440 92 L510 166 L440 240 L370 166 Z",3,.18);
    for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)s+=o(440+(i-j)*27,166+(i+j)*27,8,.95);
    return s},
  // 47. ELU: hàm kích hoạt mượt ở phía âm so với ReLU
  47:()=>{const X=x=>300+x*62,Y=y=>170-y*34,E=[];
    for(let i=-30;i<=30;i++){const x=i/10;E.push([X(x),Y(x>=0?x:Math.exp(x)-1)])}
    return l(95,170,505,170,2,.5)+l(300,60,300,250,2,.5)+pl([[X(-3),Y(0)],[X(0),Y(0)],[X(2.6),Y(2.6)]],3,0,.6,"8 7")+pl(E,5)+t(165,116,"ELU",24)+t(165,144,"ReLU",18,.6)},
  // 48. Batch Normalization: phân phối lệch được chuẩn hóa về μ=0, σ=1
  48:()=>{const g=(c,s,a)=>{const q=[];for(let x=70;x<=530;x+=4)q.push([x,236-a*Math.exp(-Math.pow(x-c,2)/(2*s*s))]);return q};
    return l(70,236,530,236,2.5,.6)+pl(g(185,58,92),4,.12,.65,"9 7")+pl(g(415,30,138),5,.2)+ar(285,150,345,150,3.5)+t(415,262,"μ = 0, σ = 1",20)},
  // 49. Dropout: một số nơ-ron bị loại ngẫu nhiên khi huấn luyện
  49:()=>net([4,5,5,3],120,480,162,34,new Set(["1,1","1,3","2,0","2,2","2,4","0,2"])),
  // 50. MapReduce: các tác vụ Map phân phối rồi gom lại bằng Reduce
  50:()=>{let s="";const A=[0,1,2,3].map(i=>[170,96+i*42]),B=[0,1,2].map(i=>[430,110+i*50]);
    A.forEach(a=>B.forEach(b=>{s+=l(a[0],a[1],b[0],b[1],1.6,.35)}));
    A.forEach(a=>{s+=r(100,a[1]-14,70,28,.3,8)});B.forEach(b=>{s+=r(430,b[1]-16,74,32,.45,8)});
    return s+ar(55,160,96,160)+ar(506,160,548,160)+t(135,76,"Map",18)+t(467,86,"Reduce",18)}
};

/* ── Nền: gradient theo lĩnh vực + chút khác biệt theo từng bài ────────── */
const HUE={ai:[238,196],bio:[158,188],physics:[268,214],cs:[208,236],econ:[24,44],soc:[326,352]};
function bg(id,cat){
  const h=HUE[cat]||HUE.ai,sh=((id*37)%36)-18;
  const a=`hsl(${(h[0]+sh+360)%360},70%,22%)`,b=`hsl(${(h[1]+sh+360)%360},80%,38%)`;
  return `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`
    +`<radialGradient id="r" cx=".5" cy=".46" r=".55"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`
    +`<pattern id="d" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="#fff" fill-opacity=".14"/></pattern></defs>`
    +`<rect width="600" height="340" fill="url(#g)"/><rect width="600" height="340" fill="url(#d)"/><rect width="600" height="340" fill="url(#r)"/>`;
}

function paperArt(pp){
  let body="";
  try{body=M[pp.id]?M[pp.id](mk(pp.id*7919+13)):""}catch(e){console.warn("artwork",pp.id,e)}
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340" width="600" height="340">${bg(pp.id,pp.category)}${body}</svg>`;
  return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
}

FEATURED_PAPERS.forEach(pp=>{pp.img=paperArt(pp)});
window.paperArt=paperArt;
if(typeof module!=="undefined"&&module.exports)module.exports={paperArt,M};
})();
