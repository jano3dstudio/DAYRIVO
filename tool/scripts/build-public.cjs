// Public, self-contained browser edition. Never copy the repository wholesale.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const publicClockodo=`
function updateClockodoEntry(){document.getElementById('clockodoEntryTools').hidden=true;}
function resetClockodoEntry(){updateClockodoEntry();}
function prepareClockodoEntry(){}
Object.assign(OfficeLocales.en,{'Clockodo in der Desktop-Version':'Clockodo in the desktop version','Die öffentliche Web-Version speichert deine Planung in diesem Browser. Clockodo wird über die lokale Desktop-Version verbunden.':'The public web version saves your planning in this browser. Connect Clockodo through the local desktop version.'});
function initializeClockodo(){
 document.getElementById('menuClockodo').onclick=()=>{closeMenu();document.getElementById('clockodoConnectionDialog').showModal();};
 updateClockodoEntry();
}
`;
function buildPublic(output=path.join(root,'tool/dist/public/index.html')){
 let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 html=html.replace(/<!-- Maintenance:[\s\S]*?-->/,'<!-- DAYRIVO public browser edition -->');
 html=html.replace(/<dialog id="clockodoConnectionDialog">[\s\S]*?<\/dialog>/,`<dialog id="clockodoConnectionDialog"><div class="dialog-heading"><h2>Clockodo in der Desktop-Version</h2><button type="button" data-close aria-label="Schließen">×</button></div><p>Die öffentliche Web-Version speichert deine Planung in diesem Browser. Clockodo wird über die lokale Desktop-Version verbunden.</p><div class="clockodo-actions"><button type="button" data-close>Schließen</button></div></dialog>`);
 html=html.replace(/<dialog id="clockodoPickerDialog">[\s\S]*?<\/dialog>/,'');
 html=html.replace(/<link rel="stylesheet" href="(tool\/css\/[^"?]+)(?:\?[^"]*)?">/g,(_,file)=>'<style>'+fs.readFileSync(path.join(root,file),'utf8').replace(/<\/style/gi,'<\\/style')+'</style>');
 html=html.replace(/<script src="(tool\/(?:js|locales)\/[^"?]+)(?:\?[^"]*)?"><\/script>/g,(_,file)=>{
  let source=file==='tool/js/clockodo.js'?publicClockodo:fs.readFileSync(path.join(root,file),'utf8');
  if(file==='tool/js/billing.js')source="function initializeBilling(){document.getElementById('billingButton').hidden=true;}";
  if(file==='tool/locales/clockodo-en.js'||file==='tool/js/clockodo-model.js')return '';
  if(file==='tool/js/planner.js'){
   const personal=/  function defaultItems\(\) \{[\s\S]*?\n  \}\r?\n  const freshItems/;
   if(!personal.test(source))throw Error('Legacy template boundary changed; review public build.');
   source=source.replace(personal,'  function defaultItems() { return []; }\n  const freshItems').replaceAll('THE GRAVITY COMPLEX','Eigenes Projekt');
  }
  return '<script>'+source.replace(/<\/script/gi,'<\\/script')+'</script>';
 });
 html=html.replace(/(?:src|href)="tool\/assets\/dayform-mark\.png"/g,match=>match.slice(0,match.indexOf('="')+2)+'data:image/png;base64,'+fs.readFileSync(path.join(root,'tool/assets/dayform-mark.png')).toString('base64')+'"');
 if(/(?:src|href)="tool\//.test(html)||/127\.0\.0\.1|dayrivo-clockodo:\/\/|local-settings\.json|THE GRAVITY COMPLEX/.test(html))throw Error('Unexpected local dependency in public output.');
 html=html.replace(/const subtitles = \[[^\n]+\];/,'const subtitles = days.map(() => "");')
  .replaceAll("'JANO Studio'","'DAYRIVO Studio'").replaceAll("'jano'","'dayrivo-default'")
  .replaceAll("'jonaWeek_v3'","'dayrivo_public_legacy_v3'").replaceAll("'jonaWeek_archive_v3'","'dayrivo_public_legacy_archive_v3'").replaceAll("'Kinder zur Schule',",'').replaceAll("'Dusche / Kaffee','Dusche + Kaffee',",'');
 fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,html);
 return output;
}
if(require.main===module)console.log(buildPublic());
module.exports={buildPublic};
