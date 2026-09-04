/**
 * BEING ADMIN V7 TEST — PUBLIC CONSULTATION ROUTER
 * APPEND THIS FILE TO THE EXISTING BEING-Admin-v7-Code.gs.
 *
 * IMPORTANT:
 * - Do NOT create a second Admin.
 * - Keep all existing V7 functions.
 * - Replace only doGet(e) and doPost(e) with the versions below.
 * - The router calls the consultation functions already present in V7.
 *
 * Client identity is NOT entered in the form. MyBeing hands off ContactID
 * technically to the consultation page.
 */

function BEING7_publicJson_(obj, cb){
  var text=JSON.stringify(obj);
  if(cb && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(String(cb))){
    return ContentService.createTextOutput(cb+'('+text+')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(text)
    .setMimeType(ContentService.MimeType.JSON);
}

function BEING7_publicPayload_(e){
  var p=(e&&e.parameter)||{};
  if(p.payload){
    try{return JSON.parse(p.payload)||{};}catch(_){}
  }
  return p;
}

function BEING7_publicHistory_(cid){
  cid=String(cid||'').trim();
  if(!cid) throw new Error('Akun MyBeing tidak valid.');
  var all=getConsultations_();
  return {ok:true,items:all.filter(function(x){return String(x.contactId||'')===cid;})};
}

function BEING7_publicDetail_(cid,kid){
  cid=String(cid||'').trim(); kid=String(kid||'').trim();
  var k=getConsultations_().find(function(x){
    return String(x.contactId||'')===cid && String(x.konsultasiId||'')===kid;
  });
  if(!k) throw new Error('Pengajuan konsultasi tidak ditemukan.');
  var services=getConsultationServices_();
  var items=rows_(localSheet_('KONSULTASI_LAYANAN')).filter(function(r){
    return String(r.KonsultasiID||'')===kid;
  }).map(function(r){return {layananId:String(r.LayananID||''),layananNama:String(r.LayananNama||''),urutan:Number(r.Urutan||0)};});
  var pays=getConsultationPayments_().filter(function(p){return String(p.konsultasiId||'')===kid;});
  var sessions=getConsultationSessions_().filter(function(s){return String(s.konsultasiId||'')===kid;});
  return {ok:true,consultation:Object.assign({},k,{services:items,payments:pays,sessions:sessions,serviceMaster:services})};
}

function BEING7_publicProfile_(cid){
  cid=String(cid||'').trim();
  if(!cid) throw new Error('Akun MyBeing tidak valid.');
  var c=getContacts_().find(function(x){return String(x.contactId||'')===cid;});
  if(!c) throw new Error('Identitas MyBeing tidak ditemukan.');
  return {ok:true,client:c};
}

/* REPLACE existing doGet(e) */
function doGet(e){
  var p=(e&&e.parameter)||{}, a=String(p.action||'').trim(), cb=String(p.callback||'').trim();
  try{
    if(a==='ping') return BEING7_publicJson_({ok:true,service:'BEING Admin v7 TEST',version:BEING_V7.VERSION},cb);
    if(a==='consultation.services') return BEING7_publicJson_({ok:true,services:getConsultationServices_()},cb);
    if(a==='consultation.profile') return BEING7_publicJson_(BEING7_publicProfile_(BEING7_publicPayload_(e).contactId),cb);
    if(a==='consultation.submit'){
      var b=BEING7_publicPayload_(e);
      return BEING7_publicJson_(registerConsultationPublic(b),cb);
    }
    if(a==='consultation.history') return BEING7_publicJson_(BEING7_publicHistory_(BEING7_publicPayload_(e).contactId),cb);
    if(a==='consultation.detail'){
      var q=BEING7_publicPayload_(e);
      return BEING7_publicJson_(BEING7_publicDetail_(q.contactId,q.konsultasiId),cb);
    }

    /* Existing V7 Admin page remains the default. */
    return HtmlService.createTemplateFromFile('Index')
      .evaluate().setTitle('BEING Admin v7 TEST')
      .addMetaTag('viewport','width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }catch(err){
    return BEING7_publicJson_({ok:false,message:String(err&&err.message||err)},cb);
  }
}

/* REPLACE existing doPost(e) only if V7 has no doPost.
   If V7 later gets another doPost, merge this consultation branch into it. */
function doPost(e){
  try{
    var p=(e&&e.parameter)||{};
    var raw=String((e&&e.postData&&e.postData.contents)||'');
    if(!Object.keys(p).length && raw){
      try{p=JSON.parse(raw)||{};}catch(_){
        raw.split('&').forEach(function(part){
          var i=part.indexOf('='),k=decodeURIComponent((i<0?part:part.slice(0,i)).replace(/\+/g,' '));
          var v=decodeURIComponent((i<0?'':part.slice(i+1)).replace(/\+/g,' '));
          if(k)p[k]=v;
        });
      }
    }
    var a=String(p.action||'');
    var payload=p.payload||{};
    if(typeof payload==='string'){try{payload=JSON.parse(payload)||{};}catch(_){}}

    if(a==='consultation.payment.proof'){
      /* File upload is supported by submitConsultationPaymentPublic().
         payload must contain paymentId,fileData,fileName,mimeType. */
      return BEING7_publicJson_(submitConsultationPaymentPublic(payload));
    }
    return BEING7_publicJson_({ok:false,message:'Aksi POST tidak dikenal.'});
  }catch(err){
    return BEING7_publicJson_({ok:false,message:String(err&&err.message||err)});
  }
}
