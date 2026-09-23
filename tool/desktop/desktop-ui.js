'use strict';
(()=>{
 const dt=key=>DesktopTexts[I18N.language]?.[key]||DesktopTexts.de[key];
 // Native credentials and a private, ephemeral child service replace protocol links.
 sessionStorage.removeItem('dayrivo.clockodo.session');clockodoSession=null;clockodoAccount=null;
 const help=document.querySelector('#clockodoConnectionDialog .clockodo-help');if(help)help.hidden=true;
 const intro=document.querySelector('#clockodoConnectionStatus+p');
 const welcome=$('welcomeDialog'),importButton=document.createElement('button'),hint=document.createElement('p');
 importButton.type='button';importButton.id='desktopImport';hint.className='dialog-note';
 importButton.onclick=()=>$('restoreFile').click();welcome.querySelector('form').append(hint,importButton);
 const restore=$('restoreForm').onsubmit;
 $('restoreForm').onsubmit=event=>{restore(event);if(!pendingRestore&&!$('restoreDialog').open&&welcome.open)welcome.close();};
 const request=async(type,args)=>{try{return await DayrivoDesktop.request(type,args);}catch{notify(dt('error'),true);return null;}};
 const connect=async()=>{
  $('clockodoStart').disabled=true;$('clockodoConnectionStatus').textContent=dt('connecting');
  try{
   const result=await DayrivoDesktop.request('clockodoConnect',{language:I18N.language});
   if(!result.connected){$('clockodoConnectionStatus').textContent=dt('cancelled');return;}
   clockodoSession={port:1,token:'0'.repeat(64)};
   await clockodoRequest('/status');$('clockodoConnectionStatus').textContent=dt('connected');$('clockodoDisconnect').disabled=false;updateClockodoEntry();
  }catch(error){clockodoSession=null;clockodoAccount=null;await DayrivoDesktop.request('clockodoDisconnect').catch(()=>{});$('clockodoConnectionStatus').textContent=t(error.message)||dt('error');}
  finally{$('clockodoStart').disabled=!!clockodoSession;}
 };
 $('clockodoStart').onclick=connect;
 $('backupButton').onclick=async()=>{if(loadError)return;const result=await request('backup');if(result)notify(dt('backup')+result.path);};
 $('menuFolder').onclick=async()=>{closeMenu();await request('openData');};
 // The shared browser folder initialization finishes asynchronously; keep its label native.
 folderStatus=()=>{$('folderStatus').textContent=dt('folderHint');};
 function labels(){importButton.textContent=dt('import');hint.textContent=dt('importHint');$('menuFolder').textContent=dt('folder');$('clockodoStart').textContent=dt('connect');if(intro)intro.textContent=dt('connectHint');folderStatus();DayrivoDesktop.request('language',{language:I18N.language}).catch(()=>{});}
 $('languageSelect').addEventListener('change',labels);labels();
 window.desktopReady=true;
})();

// Native chrome revision 2026-09-21 supplies the persistent creator link.
(()=>{if(!window.chrome?.webview)return;const hide=()=>document.querySelectorAll('a').forEach(a=>{if(a.textContent.trim().toLowerCase()==='created by jona fynn schlegelmilch')a.style.display='none';});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hide,{once:true});else hide();})();
