const KEY='signoff-demo-v1';
const uid=()=>Math.random().toString(36).slice(2,10);
const now=()=>new Date().toISOString();
const fmt=t=>{const d=new Date(t);return d.toLocaleString('zh-TW',{hour12:false,month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})};
function seed(){
 const P=[['p_admin','系統管理員'],['p_staff','工務人員'],['p_sup','工務主管'],['p_mgr','工務經理'],['p_acc','會計'],['p_gm','總經理']].map(([id,name])=>({id,name}));
 const U=[['u_admin','admin','系統管理員','p_admin',true],['u_yang','yang','楊英杰','p_staff'],['u_chen','chen','陳志明','p_sup'],['u_lin','lin','林美華','p_mgr'],['u_wu','wu','吳淑芬','p_acc'],['u_hung','hung','洪健薰','p_gm']]
  .map(([id,account,name,positionId,isAdmin])=>({id,account,name,positionId,isAdmin:!!isAdmin}));
 const F=[
  {id:'f_daily',name:'施工日報表',fields:[{k:'project',l:'工程名稱'},{k:'orderNo',l:'派任單號'},{k:'date',l:'日期',t:'date'},{k:'weather',l:'天氣',t:'select',o:['晴','陰','雨']},{k:'work',l:'施工內容',t:'textarea'},{k:'issue',l:'異常事項',t:'textarea'}],chain:['p_sup','p_mgr']},
  {id:'f_po',name:'請購單',fields:[{k:'item',l:'品名規格'},{k:'qty',l:'數量',t:'number'},{k:'amount',l:'預估金額（元）',t:'number'},{k:'project',l:'用途／工程'},{k:'note',l:'說明',t:'textarea'}],chain:['p_sup','p_acc','p_gm']},
  {id:'f_leave',name:'請假單',fields:[{k:'type',l:'假別',t:'select',o:['特休','事假','病假','公假']},{k:'from',l:'開始日期',t:'date'},{k:'to',l:'結束日期',t:'date'},{k:'reason',l:'事由',t:'textarea'}],chain:['p_sup']}];
 const d={id:'d_1',formId:'f_daily',submitterId:'u_yang',status:'pending',currentStep:1,
  data:{project:'台北某大樓機電統包工程',orderNo:'A1130512',date:'2026-10-12',weather:'晴',work:'3F 電纜架安裝、弱電管路配置',issue:'無'},
  createdAt:now(),updatedAt:now(),history:[{at:now(),userId:'u_yang',action:'submit',step:null,comment:''},{at:now(),userId:'u_chen',action:'approve',step:0,comment:'OK'}]};
 return {schemaVersion:1,positions:P,users:U,forms:F,documents:[d]};
}
let db=JSON.parse(localStorage.getItem(KEY)||'null')||seed();
let me=localStorage.getItem(KEY+'-me');let view='inbox',sel=null,edit=null;
const save=()=>localStorage.setItem(KEY,JSON.stringify(db));save();
const U=id=>db.users.find(u=>u.id===id)||{name:'?'},P=id=>db.positions.find(p=>p.id===id)||{name:'(已刪除)'},F=id=>db.forms.find(f=>f.id===id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ST={draft:'草稿',pending:'簽核中',approved:'已核准',rejected:'已退回'};
const user=()=>U(me);
const canSign=d=>d.status==='pending'&&d.chain[d.currentStep]===user().positionId&&d.submitterId!==me;
function chainOf(d){return d.chain||F(d.formId).chain}
db.documents.forEach(d=>d.chain=d.chain||F(d.formId).chain);save();
const $=s=>document.querySelector(s);
function render(){
 if(!me||!db.users.find(u=>u.id===me))return renderLogin();
 const pend=db.documents.filter(canSign).length;
 const tabs=[['inbox','✍️','待我簽核'],['mine','📄','我的申請'],['done','✅','已簽核'],['new','➕','新增']].concat(user().isAdmin?[['admin','⚙️','後台']]:[]);
 $('#app').innerHTML=`<header><div class="hrow"><h1>翔天簽核</h1><div class="who"><span class="sub">${esc(user().name)}・${esc(P(user().positionId).name)}</span>
 <select id="sw" style="width:auto">${db.users.map(u=>`<option value="${u.id}" ${u.id===me?'selected':''}>切換：${esc(u.name)}</option>`).join('')}</select></div></div></header>
 <main>${sel?docView():edit?editView():({inbox:listView,mine:listView,done:listView,all:listView,new:newView,admin:adminView})[view]()}</main>
 <nav>${tabs.map(([k,i,l])=>`<a href="#" data-tab="${k}" class="${view===k&&!sel&&!edit?'on':''}"><b>${i}</b>${l}${k==='inbox'&&pend?`<span class="cnt">${pend}</span>`:''}</a>`).join('')}</nav>`;
 $('#sw').onchange=e=>{me=e.target.value;localStorage.setItem(KEY+'-me',me);sel=edit=null;if(view==='admin'&&!user().isAdmin)view='inbox';render()};
 document.querySelectorAll('[data-tab]').forEach(a=>a.onclick=e=>{e.preventDefault();view=a.dataset.tab;sel=edit=null;render()});
 bind();scrollTo(0,0);
}
function renderLogin(){
 $('#app').innerHTML=`<div class="login"><h2>翔天線上簽核</h2><p class="sub">示範版：點選帳號即可登入（不需密碼）</p>
 <div class="card">${db.users.map(u=>`<div class="row" data-login="${u.id}"><div class="who"><div class="av">${esc(u.name[0])}</div><div>${esc(u.name)}<div class="sub">${esc(u.account)}・${esc(P(u.positionId).name)}</div></div></div>›</div>`).join('')}</div>
 <div class="card"><label>或輸入帳號</label><div class="fld" style="display:flex;gap:8px"><input id="acc" placeholder="例如 yang"><button id="go">登入</button></div></div></div>`;
 const login=id=>{me=id;localStorage.setItem(KEY+'-me',id);view=U(id).isAdmin?'all':'inbox';if(U(id).isAdmin)view='admin';render()};
 document.querySelectorAll('[data-login]').forEach(r=>r.onclick=()=>login(r.dataset.login));
 $('#go').onclick=()=>{const u=db.users.find(u=>u.account===$('#acc').value.trim());u?login(u.id):alert('查無此帳號')};
}
function docRow(d){const f=F(d.formId);const step=d.status==='pending'?`・等待 ${P(chainOf(d)[d.currentStep]).name}`:'';
 return `<div class="row" data-open="${d.id}"><div><div>${esc(f?.name)}｜${esc(d.data.project||d.data.item||d.data.type||'')}</div><div class="sub">${esc(U(d.submitterId).name)}・${fmt(d.updatedAt)}${step}</div></div><span class="badge b-${d.status}">${ST[d.status]}</span></div>`}
function listView(){
 const T={inbox:'待我簽核',mine:'我的申請',done:'已簽核',all:'全部文件'}[view];
 let L=db.documents;
 if(view==='inbox')L=L.filter(canSign);
 if(view==='mine')L=L.filter(d=>d.submitterId===me);
 if(view==='done')L=L.filter(d=>d.history.some(h=>h.userId===me&&(h.action==='approve'||h.action==='reject')));
 L=[...L].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
 return `<h2>${T}</h2>${user().isAdmin&&view!=='all'?'':''}<div class="card">${L.map(docRow).join('')||'<div class="row sub">目前沒有文件</div>'}</div>`;
}
function newView(){return `<h2>新增申請</h2><div class="card">${db.forms.map(f=>`<div class="row" data-newform="${f.id}"><div>${esc(f.name)}<div class="sub">流程：${f.chain.map(p=>P(p).name).join(' → ')||'（未設定，送出即核准）'}</div></div>›</div>`).join('')}</div>`}
function field(fd,v){const n=`name="${fd.k}"`;
 if(fd.t==='textarea')return `<textarea ${n}>${esc(v)}</textarea>`;
 if(fd.t==='select')return `<select ${n}>${fd.o.map(o=>`<option ${o===v?'selected':''}>${o}</option>`).join('')}</select>`;
 return `<input ${n} type="${fd.t||'text'}" value="${esc(v)}">`}
function editView(){const f=F(edit.formId);
 return `<h2>${edit.id?'修改並重新送出':'填寫'}・${esc(f.name)}</h2><form id="ef" class="card">${f.fields.map(fd=>`<label>${fd.l}</label><div class="fld">${field(fd,edit.data[fd.k]??(fd.t==='date'?new Date().toISOString().slice(0,10):''))}</div>`).join('')}
 <div class="btns"><button type="submit">送出簽核</button><button type="button" class="sec" id="cancel">取消</button></div></form>`}
function docView(){const d=db.documents.find(x=>x.id===sel),f=F(d.formId),ch=chainOf(d);
 const signer=i=>{const h=[...d.history].reverse().find(h=>h.step===i&&h.action==='approve');return h};
 return `<p><a href="#" id="back" style="color:var(--ac)">‹ 返回</a></p><h2>${esc(f.name)} <span class="badge b-${d.status}">${ST[d.status]}</span></h2>
 <div class="card"><div class="steps"><span class="step done">填表 ${esc(U(d.submitterId).name)}</span>${ch.map((p,i)=>`<span class="step ${d.status==='approved'||i<d.currentStep&&d.status!=='rejected'?'done':i===d.currentStep&&d.status==='pending'?'cur':''}">${esc(P(p).name)}${signer(i)&&(d.status==='approved'||i<d.currentStep)?' '+esc(U(signer(i).userId).name):''}</span>`).join('')}</div></div>
 <div class="card">${f.fields.map(fd=>`<div class="row" style="cursor:default"><span class="sub">${fd.l}</span><span style="text-align:right;white-space:pre-wrap">${esc(d.data[fd.k])}</span></div>`).join('')}</div>
 ${canSign(d)?`<div class="card"><label>簽核意見</label><div class="fld"><textarea id="cm" placeholder="選填，退回時建議填寫原因"></textarea></div><div class="btns"><button class="ok" id="ap">核准</button><button class="ng" id="rj">退回</button></div></div>`:''}
 <div class="btns" style="padding:0 0 12px">${d.submitterId===me&&d.status==='rejected'?'<button id="re">修改並重新送出</button>':''}
 <button class="sec" id="pr" ${d.status==='approved'?'':'disabled'}>輸出 PDF／列印</button>${d.status!=='approved'?'<span class="sub" style="align-self:center">全部核准後才能輸出</span>':''}</div>
 <h3>簽核紀錄</h3><div class="card tl" style="padding-top:14px">${d.history.map(h=>`<div class="${h.action==='reject'?'r':h.action==='approve'?'a':''}"><b>${esc(U(h.userId).name)}</b> ${({submit:'送出',resubmit:'修改後重新送出',approve:'核准',reject:'退回'})[h.action]}${h.step!=null?`（${esc(P(ch[h.step]).name)}）`:''}<div class="sub">${fmt(h.at)}${h.comment?'・'+esc(h.comment):''}</div></div>`).join('')}</div>`}
function adminView(){
 const po=db.positions.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
 return `<h2>後台管理</h2><div class="btns" style="padding:0"><button class="sec" data-tab2="all">查看全部文件（${db.documents.length}）</button><button class="ng" id="reset">重設示範資料</button></div>
 <h3>使用者與職位</h3><div class="card">${db.users.map(u=>`<div class="row" style="cursor:default"><div>${esc(u.name)}<div class="sub">${esc(u.account)}</div></div><select data-upos="${u.id}" style="width:150px">${db.positions.map(p=>`<option value="${p.id}" ${p.id===u.positionId?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>`).join('')}
 <div class="row" style="cursor:default;gap:6px"><input id="nuName" placeholder="姓名"><input id="nuAcc" placeholder="帳號"><button class="sm" id="addU">新增</button></div></div>
 <h3>職位</h3><div class="card">${db.positions.map(p=>`<div class="row" style="cursor:default"><span>${esc(p.name)}</span><span class="sub">${db.users.filter(u=>u.positionId===p.id).map(u=>u.name).join('、')||'無人'}</span></div>`).join('')}
 <div class="row" style="cursor:default;gap:6px"><input id="npName" placeholder="新職位名稱"><button class="sm" id="addP">新增</button></div></div>
 <h3>表單與簽核流程</h3>${db.forms.map(f=>`<div class="card"><div class="row" style="cursor:default"><b>${esc(f.name)}</b><span class="sub">${f.fields.length} 個欄位</span></div>
 <div class="steps">${f.chain.map((p,i)=>`<span class="step">${i+1}. ${esc(P(p).name)} <a href="#" data-up="${f.id}:${i}" title="上移">↑</a> <a href="#" data-del="${f.id}:${i}" style="color:var(--ng)">✕</a></span>`).join('')||'<span class="sub">尚無關卡</span>'}</div>
 <div class="row" style="cursor:default;gap:6px"><select id="add_${f.id}">${po}</select><button class="sm" data-addstep="${f.id}">加入關卡</button></div></div>`).join('')}
 <p class="sub">流程變更只影響之後送出的文件，已在簽核中的文件沿用送出當時的流程。</p>`}
function act(d,action,comment){d.history.push({at:now(),userId:me,action,step:d.currentStep,comment});d.updatedAt=now();
 if(action==='reject'){d.status='rejected'}else{d.currentStep++;if(d.currentStep>=chainOf(d).length)d.status='approved'}save();render()}
function bind(){
 document.querySelectorAll('[data-open]').forEach(r=>r.onclick=()=>{sel=r.dataset.open;render()});
 document.querySelectorAll('[data-newform]').forEach(r=>r.onclick=()=>{edit={formId:r.dataset.newform,data:{}};render()});
 document.querySelectorAll('[data-tab2]').forEach(b=>b.onclick=()=>{view=b.dataset.tab2;render()});
 const b=$('#back');if(b)b.onclick=e=>{e.preventDefault();sel=null;render()};
 const c=$('#cancel');if(c)c.onclick=()=>{edit=null;render()};
 const ef=$('#ef');if(ef)ef.onsubmit=e=>{e.preventDefault();const data=Object.fromEntries(new FormData(ef));
  let d=edit.id&&db.documents.find(x=>x.id===edit.id);
  if(d){Object.assign(d,{data,status:'pending',currentStep:0,chain:[...F(d.formId).chain],updatedAt:now()});d.history.push({at:now(),userId:me,action:'resubmit',step:null,comment:''})}
  else{d={id:'d_'+uid(),formId:edit.formId,submitterId:me,status:'pending',currentStep:0,chain:[...F(edit.formId).chain],data,createdAt:now(),updatedAt:now(),history:[{at:now(),userId:me,action:'submit',step:null,comment:''}]};db.documents.push(d)}
  if(!d.chain.length)d.status='approved';
  save();edit=null;sel=d.id;render()};
 const doc=sel&&db.documents.find(x=>x.id===sel);
 if($('#ap'))$('#ap').onclick=()=>act(doc,'approve',$('#cm').value.trim());
 if($('#rj'))$('#rj').onclick=()=>{const c=$('#cm').value.trim();if(!c&&!confirm('沒有填退回原因，確定退回？'))return;act(doc,'reject',c)};
 if($('#re'))$('#re').onclick=()=>{edit={id:doc.id,formId:doc.formId,data:{...doc.data}};sel=null;render()};
 if($('#pr'))$('#pr').onclick=()=>printDoc(doc);
 if($('#reset'))$('#reset').onclick=()=>{if(confirm('確定清除所有資料並還原示範資料？')){db=seed();save();render()}};
 document.querySelectorAll('[data-upos]').forEach(s=>s.onchange=()=>{U(s.dataset.upos).positionId=s.value;save();render()});
 if($('#addU'))$('#addU').onclick=()=>{const n=$('#nuName').value.trim(),a=$('#nuAcc').value.trim();if(!n||!a)return alert('請填姓名與帳號');if(db.users.some(u=>u.account===a))return alert('帳號重複');db.users.push({id:'u_'+uid(),account:a,name:n,positionId:'p_staff',isAdmin:false});save();render()};
 if($('#addP'))$('#addP').onclick=()=>{const n=$('#npName').value.trim();if(!n)return;db.positions.push({id:'p_'+uid(),name:n});save();render()};
 document.querySelectorAll('[data-addstep]').forEach(b=>b.onclick=()=>{F(b.dataset.addstep).chain.push($('#add_'+b.dataset.addstep).value);save();render()});
 document.querySelectorAll('[data-del]').forEach(a=>a.onclick=e=>{e.preventDefault();const[f,i]=a.dataset.del.split(':');F(f).chain.splice(+i,1);save();render()});
 document.querySelectorAll('[data-up]').forEach(a=>a.onclick=e=>{e.preventDefault();const[f,i]=a.dataset.up.split(':'),c=F(f).chain;if(+i>0)[c[i-1],c[i]]=[c[i],c[i-1]];save();render()});
}
function printDoc(d){const f=F(d.formId),ch=chainOf(d);
 const st=ch.map((p,i)=>{const h=[...d.history].reverse().find(h=>h.step===i&&h.action==='approve');return `<div class="stamp"><div>${esc(P(p).name)}</div><b style="font-size:16pt">${esc(U(h?.userId).name)}</b><div style="font-size:9pt">核准 ${h?fmt(h.at):''}</div></div>`}).join('');
 $('#print').innerHTML=`<h2 style="text-align:center">翔天科技　${esc(f.name)}</h2><p>填表人：${esc(U(d.submitterId).name)}　送出：${fmt(d.createdAt)}　文件編號：${d.id}</p>
 <table>${f.fields.map(fd=>`<tr><th style="width:25%">${fd.l}</th><td style="white-space:pre-wrap">${esc(d.data[fd.k])}</td></tr>`).join('')}</table><div class="stamps">${st}</div>`;
 window.print()}
render();
