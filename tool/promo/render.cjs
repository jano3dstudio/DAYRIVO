const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {spawn}=require('child_process'),{once}=require('events'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const metadata=JSON.parse(fs.readFileSync(path.join(__dirname,'media/capture.json'),'utf8'));
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  for(const portrait of [false,true]){
   const tag=portrait?'9x16':'16x9',width=portrait?1080:1920,height=portrait?1920:1080;
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>{throw e;});
   await page.goto(pathToFileURL(path.join(__dirname,'composition.html')).href);await page.evaluate(({portrait,metadata})=>prepare(portrait,metadata),{portrait,metadata});
   if(process.argv.includes('--stills')){
    for(const t of [1.5,4.5,8.5,12.8,16.4,19.6]){await page.evaluate(t=>renderFrame(t),t);await page.screenshot({path:path.join(__dirname,`${tag}-${t}.jpg`),type:'jpeg',quality:94});}
   }else{
    const output=path.join(__dirname,`DAYRIVO_Promo_${tag}_EN.mp4`);
    const ff=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-i',path.join(__dirname,'soundtrack.wav'),'-map','0:v','-map','1:a','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-af','loudnorm=I=-16:TP=-1.5:LRA=9','-t','22','-movflags','+faststart',output],{stdio:['pipe','ignore','pipe'],windowsHide:true});
    let errors='';ff.stderr.on('data',d=>errors+=d);const ended=once(ff,'close');
    for(let frame=0;frame<660;frame++){
     await page.evaluate(t=>renderFrame(t),frame/30);const jpeg=await page.screenshot({type:'jpeg',quality:93});if(!ff.stdin.write(jpeg))await once(ff.stdin,'drain');
     if(frame%150===0)console.log(tag+': '+Math.round(frame/660*100)+'%');
    }
    ff.stdin.end();const [code]=await ended;if(code)throw Error(errors);console.log('DONE '+output);
   }
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
