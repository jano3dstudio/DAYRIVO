'use strict';
const http = require('node:http');
const crypto = require('node:crypto');
const {probe} = require('./client.cjs');

// No static files, arbitrary URLs or write endpoints. The API key never reaches the browser.
function createBridge(credentials, {fetcher=fetch, lifetimeMs=4*60*60*1000,sessionToken}={}) {
  if(sessionToken!==undefined&&(typeof sessionToken!=='string'||sessionToken.length!==64||!/^[a-f0-9]{64}$/.test(sessionToken)))throw Error('Invalid pairing token');
  const token=sessionToken||crypto.randomBytes(32).toString('hex');
  const account=crypto.createHash('sha256').update(credentials.email.trim().toLowerCase()).digest('hex');
  const knownCustomers=new Set();
  let busy=false, stopped=false;
  const server=http.createServer(async(req,res)=>{
    const send=(code,payload)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(payload));};
    // Null is the origin of the existing file:// planner. Bearer pairing is mandatory as
    // other local files also have a null origin. DNS rebinding and web origins are rejected.
    if(req.headers.host!==`127.0.0.1:${server.address()?.port}` || req.headers.origin!=='null') return send(403,{error:'origin'});
    res.setHeader('Access-Control-Allow-Origin','null');res.setHeader('Vary','Origin');
    if(req.method==='OPTIONS') {
      const headers=(req.headers['access-control-request-headers']||'').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
      if(!['GET','POST'].includes(req.headers['access-control-request-method']) || headers.some(x=>x!=='authorization')) return send(403,{error:'preflight'});
      res.setHeader('Access-Control-Allow-Methods','GET, POST');res.setHeader('Access-Control-Allow-Headers','Authorization');
      res.setHeader('Access-Control-Allow-Private-Network','true');return send(204,{});
    }
    const provided=Buffer.from(req.headers.authorization||''),expected=Buffer.from(`Bearer ${token}`);
    if(provided.length!==expected.length || !crypto.timingSafeEqual(provided,expected)) return send(401,{error:'pairing'});
    const url=new URL(req.url,'http://127.0.0.1');
    if(url.pathname==='/disconnect' && req.method==='POST') {res.setHeader('Connection','close');send(200,{ok:true});return stop();}
    if(req.method!=='GET')return send(405,{error:'read-only'});
    if(url.pathname==='/status')return send(200,{ok:true,account,readOnly:true});
    const kind=url.pathname==='/customers'?'customers':url.pathname==='/projects'?'projects':null;
    if(!kind || [...url.searchParams.keys()].some(k=>!['page','customerId'].includes(k)))return send(404,{error:'route'});
    const page=Number(url.searchParams.get('page')||1),customerId=Number(url.searchParams.get('customerId'));
    if(kind==='projects'&&!knownCustomers.has(customerId))return send(400,{error:'customer'});
    if(busy)return send(429,{error:'busy'});
    busy=true;
    try {
      const result=await probe({...credentials,kind,page,customerId},fetcher);
      if(kind==='customers')for(const row of result.rows)knownCustomers.add(row.id);
      send(200,{...result,account,...(kind==='projects'?{customerId}:{})});
    }catch {send(502,{error:'clockodo'});}finally{busy=false;}
  });
  const timer=setTimeout(stop,lifetimeMs);timer.unref();
  function stop(){if(stopped)return;stopped=true;clearTimeout(timer);credentials.key='';server.close();server.closeIdleConnections();}
  server.on('close',()=>{clearTimeout(timer);credentials.key='';});
  return {server,token,account,stop};
}

if(require.main===module){
  (async()=>{
    let raw='';for await(const chunk of process.stdin){raw+=chunk;if(raw.length>4096)throw Error('input');}
    const credentials=JSON.parse(raw.replace(/^\uFEFF/,''));raw='';
    // Authenticate before handing a local session to the planner. No user data is logged.
    await probe({...credentials,kind:'customers'});
    const launchToken=credentials.launchToken;delete credentials.launchToken;
    const bridge=createBridge(credentials,launchToken?{sessionToken:launchToken}:{});
    bridge.server.on('error',()=>{process.stdout.write(JSON.stringify({ok:false,error:'Lokaler Dienst konnte nicht starten.'})+'\n');bridge.stop();process.exitCode=1;});
    bridge.server.listen(launchToken?18744:0,'127.0.0.1',()=>process.stdout.write(JSON.stringify({ok:true,port:bridge.server.address().port,token:bridge.token})+'\n'));
    process.on('SIGINT',()=>bridge.stop());process.on('SIGTERM',()=>bridge.stop());
  })().catch(()=>{process.stdout.write(JSON.stringify({ok:false,error:'Clockodo-Anmeldung fehlgeschlagen. E-Mail, Key und Verbindung pruefen.'})+'\n');process.exitCode=1;});
}
module.exports={createBridge};
