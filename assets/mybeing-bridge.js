/* BEING MyBeing Bridge
   The consultation UI never asks the user to type ContactID.
   MyBeing should expose the current authenticated identity to this page.

   Supported handoff:
   1) window.BEING_MYBEING_SESSION = {contactId:"..."}
   2) URL query ?contactId=... (hidden technical handoff; not a form field)
   3) localStorage keys: BEING_MYBEING_SESSION / MYBEING_SESSION / being_mybeing_session

   For the real MyBeing portal, prefer #1 or a server-generated link containing
   the ContactID as a technical parameter.
*/
window.BEING_MYBEING = {
  getSession(){
    try{
      if(window.BEING_MYBEING_SESSION && window.BEING_MYBEING_SESSION.contactId)
        return window.BEING_MYBEING_SESSION;
    }catch(e){}
    const q=new URLSearchParams(location.search);
    const cid=q.get("contactId")||q.get("cid")||"";
    if(cid) return {contactId:cid};
    const keys=["BEING_MYBEING_SESSION","MYBEING_SESSION","being_mybeing_session"];
    for(const k of keys){
      try{
        const v=JSON.parse(localStorage.getItem(k)||"null");
        if(v && (v.contactId||v.ContactID)) return {contactId:v.contactId||v.ContactID,...v};
      }catch(e){}
    }
    return null;
  }
};