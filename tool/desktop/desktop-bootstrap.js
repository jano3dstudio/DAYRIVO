'use strict';
// Loaded only inside the packaged app, before the shared planner.
(()=>{
 const native=chrome.webview.hostObjects.sync.dayrivoStore;
 const keys=new Set(['jsOfficeWeek_v1','jsOfficeWeek_v1_beforeRestore','jsOfficeWeek_v1_beforeReset']);
 for(const [method,call] of [['getItem','Read'],['setItem','Save'],['removeItem','Remove']]){
  const original=Storage.prototype[method];
  Storage.prototype[method]=function(key,value){
   if(this!==localStorage||!keys.has(String(key)))return original.apply(this,arguments);
   if(method==='setItem'){native.Save(String(key),String(value));return;}
   if(method==='removeItem'){native.Remove(String(key));return;}
   const result=native.Read(String(key));return result==null?null:String(result);
  };
 }
 let next=0;const pending=new Map();
 window.DayrivoDesktop={request(type,args={}){return new Promise((resolve,reject)=>{const id=++next;const timer=setTimeout(()=>{pending.delete(id);reject(Error('Desktop request timed out'));},190000);pending.set(id,{resolve,reject,timer});chrome.webview.postMessage({id,type,args});});}};
 chrome.webview.addEventListener('message',event=>{const response=event.data,p= pending.get(response.id);if(!p)return;pending.delete(response.id);clearTimeout(p.timer);response.ok?p.resolve(response.result):p.reject(Error(response.error||'Desktop request failed'));});
 const originalFetch=window.fetch;
 window.fetch=async function(url,options={}){
  if(typeof url==='string'&&url.startsWith('http://127.0.0.1:1/')){
   if(options.signal?.aborted)throw new DOMException('Aborted','AbortError');
   const response=await DayrivoDesktop.request('clockodoRequest',{route:url.slice('http://127.0.0.1:1'.length),method:options.method||'GET',body:options.body||''});
   if(options.signal?.aborted)throw new DOMException('Aborted','AbortError');
   return new Response(response.body,{status:response.status,headers:{'Content-Type':'application/json'}});
  }
  return originalFetch.apply(this,arguments);
 };
})();
