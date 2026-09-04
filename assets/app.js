(() => {
const cfg=window.BEING_CONFIG||{}, $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const session=()=>window.BEING_MYBEING?.getSession?.();
function api(action,payload={},method="GET"){
  const url=cfg.API_URL||"";
  if(!url||url.includes("PASTE_")) return Promise.reject(new Error("API Admin V7 TEST belum diisi di assets/config.js"));
  return new Promise((resolve,reject)=>{
    const cb="beingcb_"+Date.now()+"_"+Math.random().toString(36).slice(2);
    const sc=document.createElement("script");
    const cleanup=()=>{try{delete window[cb]}catch(e){} sc.remove()};
    window[cb]=x=>{cleanup();x?.ok?resolve(x):reject(new Error(x?.message||"Permintaan gagal."))};
    sc.onerror=()=>{cleanup();reject(new Error("API tidak dapat dihubungi."))};
    const p=encodeURIComponent(JSON.stringify(payload));
    sc.src=url+"?action="+encodeURIComponent(action)+"&payload="+p+"&callback="+cb;
    document.body.appendChild(sc);
  });
}
function cid(){return session()?.contactId||""}
async function profile(){
  const id=cid(); if(!id) throw new Error("Halaman ini harus dibuka dari akun MyBeing.");
  const r=await api("consultation.profile",{contactId:id}); return r.client;
}
function setProfile(p){
  ["nama","email","wa","instansi"].forEach(k=>{const el=$("#"+k);if(el&&p)el.value=p[k]||""});
}
function go(path,id=""){location.href=path+(id?"?id="+encodeURIComponent(id):"")}
function statusClass(s){return `<span class="status">${esc(s||"-")}</span>`}
async function loadServices(){
  const r=await api("consultation.services",{});
  const box=$("#services"); if(!box)return;
  box.innerHTML=(r.services||[]).map(s=>`<label class="service"><input type="checkbox" value="${esc(s.layananId)}"><b>${esc(s.nama)}</b><div class="muted" style="margin-top:6px;font-size:12px">${esc(s.deskripsi)}</div></label>`).join("");
}
function selected(){return [...document.querySelectorAll("#services input:checked")].map(x=>x.value)}
async function submit(){
  const p=await profile(), ids=selected(), m=document.querySelector('input[name="method"]:checked')?.value;
  if(!ids.length) throw new Error("Pilih minimal satu layanan.");
  if(!m) throw new Error("Pilih metode layanan.");
  const peserta=m==="PRIVATE"?1:Number($("#jumlahPeserta")?.value||1);
  if(m==="KELOMPOK" && (peserta<1||peserta>9)) throw new Error("Jumlah peserta kelompok 1–9 orang.");
  const r=await api("consultation.submit",{contactId:p.contactId,method:m,jumlahPeserta:peserta,serviceIds:ids,catatan:$("#catatan").value.trim()});
  localStorage.setItem("being_last_consultation",JSON.stringify(r));
  go("dashboard.html");
}
async function history(){
  const id=cid(); if(!id) throw new Error("Buka dari akun MyBeing.");
  const r=await api("consultation.history",{contactId:id});
  const box=$("#history"); if(!box)return;
  box.innerHTML=(r.items||[]).length?(r.items||[]).map(x=>`<div class="item" onclick="location.href='detail.html?id=${encodeURIComponent(x.konsultasiId)}'"><div class="row"><b>${esc(x.konsultasiId)}</b>${statusClass(x.statusPengajuan)}</div><div style="margin-top:8px">${esc(x.layananNama)}</div><div class="muted" style="margin-top:5px">${esc(x.method)} · ${esc(x.tanggalPengajuan||"")}</div></div>`).join(""):`<div class="muted">Belum ada pengajuan konsultasi.</div>`;
}
async function detail(){
  const id=cid(),kid=new URLSearchParams(location.search).get("id");
  if(!id||!kid)throw new Error("Pengajuan tidak ditemukan.");
  const r=await api("consultation.detail",{contactId:id,konsultasiId:kid}),x=r.consultation;
  $("#detail").innerHTML=`
    <div class="row"><div><h2 style="margin:0">${esc(x.konsultasiId)}</h2><div class="muted">${esc(x.tanggalPengajuan||"")}</div></div>${statusClass(x.statusPengajuan)}</div>
    <div style="margin-top:18px"><b>Layanan</b><p>${esc(x.layananNama)}</p><b>Metode</b><p>${esc(x.method)} · Minimal ${x.minimalPertemuan||5} pertemuan${x.method==="KELOMPOK"?` · Maksimal ${x.maksimalPeserta||9} peserta`:""}</p></div>
    <div class="steps">${["PENGAJUAN BARU","DISETUJUI","MENUNGGU PEMBAYARAN","MENUNGGU VERIFIKASI","LUNAS","TERJADWAL","SELESAI"].map(s=>`<span class="step ${s===x.statusPengajuan||s===x.statusPembayaran?"on":""}">${s}</span>`).join("")}</div>
    ${x.statusPengajuan==="DISETUJUI"&&x.statusPembayaran==="MENUNGGU_PEMBAYARAN"?`<div class="paybox" style="margin-top:18px"><h3>Pembayaran tersedia</h3><p>Admin telah menyetujui pengajuan. Silakan lanjutkan pembayaran melalui instruksi yang diberikan BEING.</p><p><b>Status:</b> ${esc(x.statusPembayaran)}</p></div>`:""}
    ${x.statusPembayaran==="MENUNGGU_VERIFIKASI"?`<div class="alert ok" style="margin-top:18px">Bukti pembayaran sudah diterima dan sedang diverifikasi admin.</div>`:""}
    ${x.statusPembayaran==="LUNAS"?`<div class="paybox" style="margin-top:18px"><h3>Pembayaran LUNAS</h3><p>Selanjutnya BEING menyiapkan psikolog dan jadwal konsultasi.</p></div>`:""}
    ${x.psikologNama?`<div class="card" style="margin-top:16px"><b>Psikolog</b><p>${esc(x.psikologNama)}</p>${x.linkRuang?`<a class="btn" href="${esc(x.linkRuang)}" target="_blank" rel="noopener">Buka Ruang Konsultasi</a>`:""}</div>`:""}
  `;
}
async function init(){
  try{
    if($("#profileStatus")){const p=await profile();setProfile(p);$("#profileStatus").textContent="Identitas MyBeing terhubung";}
    if($("#services")) await loadServices();
    if($("#history")) await history();
    if($("#detail")) await detail();
  }catch(e){const m=$("#message");if(m)m.innerHTML=`<div class="alert err">${esc(e.message)}</div>`;else document.body.insertAdjacentHTML("afterbegin",`<div class="alert err" style="margin:16px">${esc(e.message)}</div>`)}
}
window.BEING_KONSULTASI={submit,history,detail};
document.addEventListener("DOMContentLoaded",()=>{
  const f=$("#consultForm"); if(f)f.addEventListener("submit",async e=>{e.preventDefault();const b=$("#submitBtn");try{b.disabled=true;b.textContent="Mengirim...";await submit();}catch(x){$("#message").innerHTML=`<div class="alert err">${esc(x.message)}</div>`;b.disabled=false;b.textContent="Kirim Pengajuan"}});
  const n=$("#jumlahPeserta"),m=document.querySelectorAll('input[name="method"]');m.forEach(x=>x.addEventListener("change",()=>{n.closest(".field").classList.toggle("hidden",x.value!=="KELOMPOK")}));
  init();
});
})();