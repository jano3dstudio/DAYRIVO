using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Net.Http;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
namespace Jano.AppKit {
static class DesktopStart {
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode)] static extern bool SetDllDirectory(string path);
 [DllImport("user32.dll")] static extern bool SetProcessDpiAwarenessContext(IntPtr value);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern IntPtr FindWindow(string cls,string title);
 [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr window);
 public static string AssetRoot,DataRoot,CheckRoot;
 public static bool MouseTest,Embedded,ReopenTest;
 [STAThread] static int Main(string[] args){
  Mutex mutex=null;
  try{
   ReopenTest=args.Length==2&&args[0]=="--workspace-reopen-test";
   MouseTest=args.Length==2&&args[0]=="--mouse-test";
   CheckRoot=args.Length==2&&(args[0]=="--self-test"||MouseTest||ReopenTest)?Path.GetFullPath(args[1]):null;
   DataRoot=CheckRoot==null?Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"DAYRIVO","desktop"):Path.Combine(CheckRoot,"data");
   Directory.CreateDirectory(DataRoot);string identity;
   using(var h=SHA256.Create())identity=BitConverter.ToString(h.ComputeHash(Encoding.UTF8.GetBytes(DataRoot))).Replace("-","");
   bool created;mutex=new Mutex(true,"Local\\DAYRIVO-"+identity,out created);
   if(!created){SetForegroundWindow(FindWindow(null,"DAYRIVO"));mutex.Dispose();return 0;}
   Prepare(CheckRoot);
   try{SetProcessDpiAwarenessContext(new IntPtr(-4));}catch{}
   return Run();
  }catch(Exception e){if(CheckRoot!=null){Directory.CreateDirectory(CheckRoot);File.WriteAllText(Path.Combine(CheckRoot,"error.txt"),e.ToString());}else MessageBox.Show("DAYRIVO konnte nicht starten / Could not start.\n\n"+e.Message,"DAYRIVO");return 1;}
  finally{if(mutex!=null){try{mutex.ReleaseMutex();}catch{}mutex.Dispose();}}
 }
 public static void Prepare(string isolatedRoot){
  CheckRoot=isolatedRoot;
  DataRoot=isolatedRoot==null?Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"DAYRIVO","desktop"):Path.Combine(isolatedRoot,"data");
  Directory.CreateDirectory(DataRoot);
   string hash;using(var h=SHA256.Create())using(var exe=File.OpenRead(Assembly.GetExecutingAssembly().Location))hash=BitConverter.ToString(h.ComputeHash(exe)).Replace("-","").Substring(0,16);
   AssetRoot=Path.Combine(DataRoot,"runtime",hash);Directory.CreateDirectory(AssetRoot);
   using(var stream=Assembly.GetExecutingAssembly().GetManifestResourceStream("dayrivo.payload.zip"))using(var zip=new ZipArchive(stream,ZipArchiveMode.Read)){
    foreach(var entry in zip.Entries){if(entry.Name=="")continue;string output=Path.GetFullPath(Path.Combine(AssetRoot,entry.FullName));if(!output.StartsWith(AssetRoot+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new Exception("Invalid package path");
     Directory.CreateDirectory(Path.GetDirectoryName(output));using(var source=entry.Open())using(var dest=new FileStream(output,FileMode.Create,FileAccess.Write,FileShare.Read))source.CopyTo(dest);
    }
   }
   SetDllDirectory(AssetRoot);
   AppDomain.CurrentDomain.AssemblyResolve+=(s,e)=>{string name=new AssemblyName(e.Name).Name;return name=="Microsoft.Web.WebView2.Core"||name=="Microsoft.Web.WebView2.WinForms"?Assembly.LoadFrom(Path.Combine(AssetRoot,name+".dll")):null;};
 }
 [MethodImpl(MethodImplOptions.NoInlining)] static int Run(){Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);using(var app=new DesktopWindow()){Application.Run(app);return app.ExitCode;}}
}
class CredentialWindow:JanoWindow {
 public readonly TextBox Email=new TextBox(),Key=new TextBox();
 public CredentialWindow(bool english){
  Text=english?"DAYRIVO · Connect Clockodo":"DAYRIVO · Clockodo verbinden";BackColor=Tokens.Panel;ForeColor=Tokens.Text;Font=new Font(Tokens.UiFont,10);ClientSize=new Size(540,320);MinimumSize=Size;MaximizeBox=false;MinimizeBox=false;FormBorderStyle=FormBorderStyle.FixedDialog;StartPosition=FormStartPosition.CenterParent;
  var layout=new TableLayoutPanel{Dock=DockStyle.Fill,Padding=new Padding(24),ColumnCount=1,RowCount=6};layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,100));Controls.Add(layout);
  layout.Controls.Add(new Label{Text=english?"Clockodo email":"Clockodo E-Mail",AutoSize=true});
  Email.Dock=DockStyle.Top;Email.MaxLength=254;layout.Controls.Add(Email);
  layout.Controls.Add(new Label{Text=english?"API key · paste with Ctrl+V":"API-Key · mit Strg+V einfügen",AutoSize=true,Margin=new Padding(0,12,0,3)});
  Key.Dock=DockStyle.Top;Key.MaxLength=512;Key.UseSystemPasswordChar=true;Key.ShortcutsEnabled=true;layout.Controls.Add(Key);
  foreach(var input in new[]{Email,Key}){input.BackColor=Tokens.Input;input.ForeColor=Tokens.Text;input.BorderStyle=BorderStyle.FixedSingle;}
  layout.Controls.Add(new Label{Text=english?"The key is used for this session only and is not saved.":"Der Key gilt nur für diese Sitzung und wird nicht gespeichert.",AutoSize=true,MaximumSize=new Size(480,0),Margin=new Padding(0,14,0,12)});
  var actions=new FlowLayoutPanel{Dock=DockStyle.Fill,FlowDirection=FlowDirection.RightToLeft,AutoSize=true};
  var ok=new Button{Text=english?"Connect":"Verbinden",Width=130,Height=38,BackColor=Tokens.Accent,ForeColor=Tokens.AccentInk,FlatStyle=FlatStyle.Flat};
  var cancel=new Button{Text=english?"Cancel":"Abbrechen",Width=120,Height=38,BackColor=Tokens.Raised,ForeColor=Tokens.Text,FlatStyle=FlatStyle.Flat,DialogResult=DialogResult.Cancel};
  ok.Click+=(s,e)=>{if(Regex.IsMatch(Email.Text.Trim(),@"^[^\s;@]+@[^\s;@]+\.[^\s;@]+$")&&Key.Text.Length>0){DialogResult=DialogResult.OK;Close();}else{Email.Focus();}};
  actions.Controls.Add(ok);actions.Controls.Add(cancel);layout.Controls.Add(actions);AcceptButton=ok;CancelButton=cancel;
 }
}
class DesktopWindow:JanoWindow {
 const string Origin="https://dayrivo.local/";
 readonly WebView2 web=new WebView2();readonly NativeStore store=new NativeStore(DesktopStart.DataRoot);
 readonly JavaScriptSerializer json=new JavaScriptSerializer{MaxJsonLength=22*1024*1024,RecursionLimit=150};
 readonly HttpClient http=new HttpClient(new HttpClientHandler{UseProxy=false,AllowAutoRedirect=false}){Timeout=TimeSpan.FromSeconds(180)};
 readonly Label loading=new Label();Process service;int port;string token;bool connecting,closed;public int ExitCode;
 public DesktopWindow(){
  Text="DAYRIVO";BackColor=Tokens.Background;AutoScaleMode=AutoScaleMode.None;StartPosition=FormStartPosition.CenterScreen;
  var area=Screen.PrimaryScreen.WorkingArea;ClientSize=new Size(Math.Min(1500,area.Width-64),Math.Min(1000,area.Height-100));MinimumSize=new Size(760,580);
  web.Dock=DockStyle.Fill;web.DefaultBackgroundColor=Tokens.Background;Controls.Add(web);
  loading.Dock=DockStyle.Fill;loading.BackColor=Tokens.Background;loading.ForeColor=Tokens.Text;loading.TextAlign=ContentAlignment.MiddleCenter;loading.Text="DAYRIVO …";Controls.Add(loading);loading.BringToFront();
  Shown+=async(s,e)=>await EnsureInitialized();Disposed+=(s,e)=>{closed=true;StopService();http.Dispose();};
  if(DesktopStart.CheckRoot!=null&&!DesktopStart.Embedded){var timeout=new System.Windows.Forms.Timer{Interval=90000};timeout.Tick+=(s,e)=>{timeout.Stop();Fail(new Exception("Desktop self-test timeout"));};FormClosed+=(s,e)=>timeout.Dispose();timeout.Start();}
 }
 static bool IsLocal(string value){Uri u;return Uri.TryCreate(value,UriKind.Absolute,out u)&&u.Scheme=="https"&&u.Host=="dayrivo.local"&&u.IsDefaultPort;}
 Task initialization; internal Task EnsureInitialized(){return initialization??(initialization=Initialize());}
 internal async Task StartEmbedded(){await EnsureInitialized();await WaitJs("window.desktopReady===true");}
 async Task Initialize(){try{
  var env=await CoreWebView2Environment.CreateAsync(null,Path.Combine(DesktopStart.DataRoot,"webview-profile"));await web.EnsureCoreWebView2Async(env);var core=web.CoreWebView2;
  core.Settings.AreDevToolsEnabled=false;core.Settings.AreDefaultContextMenusEnabled=false;core.Settings.IsStatusBarEnabled=false;core.Settings.IsPasswordAutosaveEnabled=false;core.Settings.IsGeneralAutofillEnabled=false;
  core.SetVirtualHostNameToFolderMapping("dayrivo.local",Path.Combine(DesktopStart.AssetRoot,"ui"),CoreWebView2HostResourceAccessKind.DenyCors);
  core.AddHostObjectToScript("dayrivoStore",store);
  core.NavigationStarting+=(s,e)=>{if(!IsLocal(e.Uri))e.Cancel=true;};
  core.FrameNavigationStarting+=(s,e)=>e.Cancel=true;
  core.NewWindowRequested+=(s,e)=>{e.Handled=true;Uri target;if(e.IsUserInitiated&&Uri.TryCreate(e.Uri,UriKind.Absolute,out target)&&target.Scheme=="https"){try{Process.Start(new ProcessStartInfo(target.AbsoluteUri){UseShellExecute=true});}catch{}}};
  core.PermissionRequested+=(s,e)=>e.State=CoreWebView2PermissionState.Deny;
  core.DownloadStarting+=(s,e)=>{
   if(!e.DownloadOperation.Uri.StartsWith("blob:"+Origin,StringComparison.Ordinal)){e.Cancel=true;return;}
   using(var dialog=new SaveFileDialog{FileName=Path.GetFileName(e.ResultFilePath),Filter="JSON|*.json|All files|*.*"}){if(dialog.ShowDialog(this)!=DialogResult.OK){e.Cancel=true;return;}e.ResultFilePath=dialog.FileName;e.Handled=true;}
  };
  core.AddWebResourceRequestedFilter("*",CoreWebView2WebResourceContext.All);
  core.WebResourceRequested+=(s,e)=>{if(!IsLocal(e.Request.Uri)&&!e.Request.Uri.StartsWith("data:")&&!e.Request.Uri.StartsWith("blob:"+Origin))e.Response=env.CreateWebResourceResponse(new MemoryStream(),403,"Blocked","");};
  core.WebMessageReceived+=OnMessage;
  bool first=true;core.NavigationCompleted+=async(s,e)=>{if(!first)return;first=false;if(!e.IsSuccess){Fail(new Exception("WebView: "+e.WebErrorStatus));return;}loading.Visible=false;web.BringToFront();RefreshChrome();if(DesktopStart.CheckRoot!=null&&!DesktopStart.Embedded){try{if(DesktopStart.ReopenTest){await WaitJs("window.desktopReady===true");await Expect("JSON.stringify(data).includes('Workspace integration proof')","Standalone reopens workspace data");File.WriteAllText(Path.Combine(DesktopStart.CheckRoot,"standalone-reopen.txt"),"PASS");}else await Check();Close();}catch(Exception error){Fail(error);}}};
  core.Navigate(Origin+"index.html");
 }catch(Exception e){Fail(e);}}
 void Fail(Exception e){ExitCode=1;if(DesktopStart.CheckRoot!=null){File.WriteAllText(Path.Combine(DesktopStart.CheckRoot,"error.txt"),e.ToString());Close();}else{loading.Visible=true;loading.BringToFront();loading.Text="DAYRIVO konnte nicht geöffnet werden / Could not open.\nMicrosoft Edge WebView2 Runtime wird benötigt / is required.\n\n"+e.Message;}}
 async void OnMessage(object sender,CoreWebView2WebMessageReceivedEventArgs e){
  if(closed||!IsLocal(e.Source))return;object id=null;
  try{
   if(e.WebMessageAsJson.Length>200000)throw new Exception("size");var message=json.Deserialize<Dictionary<string,object>>(e.WebMessageAsJson);id=message["id"];
   var args=message["args"] as Dictionary<string,object>;string type=Convert.ToString(message["type"]);object result;
   if(type=="clockodoConnect")result=new{connected=await Connect()};
   else if(type=="clockodoDisconnect"){StopService();result=new{disconnected=true};}
   else if(type=="clockodoRequest")result=await Request(args);
   else if(type=="backup")result=new{path=store.Backup()};
   else if(type=="openData"){Process.Start(new ProcessStartInfo("explorer.exe","\""+DesktopStart.DataRoot+"\""){UseShellExecute=true});result=true;}
   else if(type=="language"){L.English=Convert.ToString(args["language"])=="en";RefreshChrome();result=true;}
   else throw new Exception("Unknown action");
   Reply(new{id,ok=true,result});
  }catch{Reply(new{id,ok=false,error=L.English?"Could not complete the action. Check the connection, credentials or data folder.":"Aktion fehlgeschlagen. Verbindung, Zugangsdaten oder Datenordner prüfen."});}
 }
 void Reply(object message){if(!closed&&IsLocal(web.Source.AbsoluteUri))web.CoreWebView2.PostWebMessageAsJson(json.Serialize(message));}
 async Task<bool> Connect(){
  if(connecting)throw new Exception("busy");connecting=true;
  try{
   if(service!=null&&!service.HasExited)return true;
   string email,key;
   if(DesktopStart.CheckRoot!=null){email="tester@example.com";key="self-test-only";}
   else using(var form=new CredentialWindow(L.English)){if(form.ShowDialog(this)!=DialogResult.OK)return false;email=form.Email.Text.Trim();key=form.Key.Text;form.Key.Clear();}
   StopService();
   var info=new ProcessStartInfo(Path.Combine(DesktopStart.AssetRoot,"node.exe"),"--no-warnings \""+Path.Combine(DesktopStart.AssetRoot,"clockodo","desktop-service.cjs")+"\""+(DesktopStart.CheckRoot!=null?" --self-test":"")){UseShellExecute=false,CreateNoWindow=true,RedirectStandardInput=true,RedirectStandardOutput=true,RedirectStandardError=true,StandardOutputEncoding=Encoding.UTF8,StandardErrorEncoding=Encoding.UTF8};
   info.EnvironmentVariables.Remove("NODE_OPTIONS");info.EnvironmentVariables.Remove("NODE_PATH");
   if(DesktopStart.CheckRoot!=null)info.EnvironmentVariables["LOCALAPPDATA"]=Path.Combine(DesktopStart.CheckRoot,"isolated-localappdata");
   service=Process.Start(info);service.ErrorDataReceived+=(s,e)=>{};service.BeginErrorReadLine();
   byte[] bytes=Encoding.UTF8.GetBytes(json.Serialize(new{email,key})+"\n");await service.StandardInput.BaseStream.WriteAsync(bytes,0,bytes.Length);await service.StandardInput.BaseStream.FlushAsync();Array.Clear(bytes,0,bytes.Length);email=null;key=null;
   var line=service.StandardOutput.ReadLineAsync();if(await Task.WhenAny(line,Task.Delay(25000))!=line)throw new Exception("timeout");
   var response=json.Deserialize<Dictionary<string,object>>(await line??"{}");if(!response.ContainsKey("ok")||!Convert.ToBoolean(response["ok"]))throw new Exception("connection");
   port=Convert.ToInt32(response["port"]);token=Convert.ToString(response["token"]);if(port<1||port>65535||!Regex.IsMatch(token,"^[a-f0-9]{64}$"))throw new Exception("session");
   return true;
  }catch{StopService();throw;}finally{connecting=false;}
 }
 async Task<object> Request(Dictionary<string,object> args){
  string route=Convert.ToString(args["route"]),method=Convert.ToString(args["method"]),body=Convert.ToString(args["body"]);
  if(route==null||route.Length>500||!Regex.IsMatch(route,@"^/(status|customers|projects|services|disconnect|billing/(month|drafts|release))(\?[A-Za-z0-9%_=&.-]*)?$")||!(method=="GET"||method=="POST")||body.Length>150000)throw new Exception("route");
  if(method=="POST"&&route!="/disconnect"&&route!="/billing/drafts"&&route!="/billing/release")throw new Exception("method");
  if(route=="/disconnect"&&method=="POST"){StopService();return new{status=200,body="{\"ok\":true}"};}
  if(service==null||service.HasExited||port==0)throw new Exception("disconnected");
  using(var request=new HttpRequestMessage(new HttpMethod(method),"http://127.0.0.1:"+port+route)){
   request.Headers.TryAddWithoutValidation("Origin","null");request.Headers.TryAddWithoutValidation("Authorization","Bearer "+token);
   if(method=="POST")request.Content=new StringContent(body,Encoding.UTF8,"text/plain");
   using(var response=await http.SendAsync(request)){string payload=await response.Content.ReadAsStringAsync();if(payload.Length>20*1024*1024)throw new Exception("size");return new{status=(int)response.StatusCode,body=payload};}
  }
 }
 void StopService(){port=0;token=null;if(service==null)return;try{service.StandardInput.Close();if(!service.WaitForExit(1500))service.Kill();}catch{}finally{service.Dispose();service=null;}}
 async Task Expect(string script,string label){string result=await web.CoreWebView2.ExecuteScriptAsync(script);if(result!="true")throw new Exception(label+": "+result);}
 async Task WaitJs(string script){for(int i=0;i<100;i++){if(await web.CoreWebView2.ExecuteScriptAsync(script)=="true")return;await Task.Delay(100);}throw new Exception("Wait: "+script);}
 async Task CaptureImage(string name){using(var stream=File.Create(Path.Combine(DesktopStart.CheckRoot,name)))await web.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png,stream);}
 internal async Task WorkspaceCheck(){
  await WaitJs("window.desktopReady===true");
  await Expect("(()=>{if($('welcomeDialog').open)$('welcomeForm').requestSubmit();data.weeks[data.selectedWeek].items[0].title='Workspace integration proof';return persist()})()","Workspace native save");
  if(!store.Read("jsOfficeWeek_v1").Contains("Workspace integration proof"))throw new Exception("Workspace data not persisted");
  await CaptureImage("dayrivo-embedded.png");
 }
 async Task Check(){
  await WaitJs("window.desktopReady===true");
  if(DesktopStart.MouseTest){await MouseWindowCheck.Run(this,DesktopStart.CheckRoot);return;}
  await Expect("$('welcomeDialog').open && $('desktopImport')!==null","Import onboarding");
  await CaptureImage("desktop-first-start.png");
  await Expect("(()=>{$('welcomeForm').requestSubmit();return !$('welcomeDialog').open&&!data.settings.needsWelcome})()","Preset onboarding");
  await Expect("(()=>{data.settings.language='de';refreshLanguageUI();data.weeks[data.selectedWeek].items[0].title='Desktop Prüfung weiß';return persist()})()","Native atomic save");
  if(!File.ReadAllText(Path.Combine(DesktopStart.DataRoot,"planner.json")).Contains("Desktop Prüfung weiß"))throw new Exception("Native file missing content");
  await Expect("(()=>{const sample=P.clone(data);sample.weeks[sample.selectedWeek].items[0].title='Import geprüft';pendingRestore=P.parseBackup({app:'JS OFFICE WEEK',version:1,data:sample});$('restoreDialog').showModal();$('restoreForm').requestSubmit();return data.weeks[data.selectedWeek].items[0].title==='Import geprüft'&&!$('restoreDialog').open})()","Backup import");
  if(!File.ReadAllText(Path.Combine(DesktopStart.DataRoot,"before-import.json")).Contains("Desktop Prüfung weiß"))throw new Exception("Import did not preserve previous state");
  string saved=store.Read("jsOfficeWeek_v1");try{store.Save("jsOfficeWeek_v1","{}");throw new Exception("Invalid save accepted");}catch(ArgumentException){}
  if(store.Read("jsOfficeWeek_v1")!=saved)throw new Exception("Invalid save altered plan");
  try{store.Read("../escape");throw new Exception("Path accepted");}catch(ArgumentException){}
  var recoveryRoot=Path.Combine(DesktopStart.CheckRoot,"storage-recovery");var recovery=new NativeStore(recoveryRoot);
  recovery.Save("jsOfficeWeek_v1",saved);
  using(var locked=new FileStream(Path.Combine(recoveryRoot,"planner.json"),FileMode.Open,FileAccess.Read,FileShare.None)){
   try{recovery.Save("jsOfficeWeek_v1",saved+" ");throw new Exception("Locked write accepted");}catch(IOException){}
  }
  if(recovery.Read("jsOfficeWeek_v1")!=saved)throw new Exception("Locked write altered plan");
  File.WriteAllText(Path.Combine(recoveryRoot,"planner.json"),"{damaged");
  recovery.Save("jsOfficeWeek_v1_beforeRestore",recovery.Read("jsOfficeWeek_v1"));recovery.Save("jsOfficeWeek_v1",saved);
  if(recovery.Read("jsOfficeWeek_v1")!=saved||recovery.Read("jsOfficeWeek_v1_beforeRestore")!="{damaged")throw new Exception("Corrupt-state recovery failed");
  await web.CoreWebView2.ExecuteScriptAsync("window.routeRejected=false;DayrivoDesktop.request('clockodoRequest',{route:'/../secrets',method:'GET',body:''}).catch(()=>window.routeRejected=true)");await WaitJs("window.routeRejected===true");
  await web.CoreWebView2.ExecuteScriptAsync("$('backupButton').click()");await Task.Delay(350);
  if(Directory.GetFiles(Path.Combine(DesktopStart.DataRoot,"backups"),"dayrivo-*.json").Length<1)throw new Exception("Backup missing");
  await web.CoreWebView2.ExecuteScriptAsync("$('languageSelect').value='en';$('languageSelect').dispatchEvent(new Event('change'))");
  await Expect("$('desktopImport').textContent==='Import browser plan' && data.weeks[data.selectedWeek].items[0].title==='Import geprüft'","DE/EN preserves content");
  var completion=new TaskCompletionSource<bool>();EventHandler<CoreWebView2NavigationCompletedEventArgs> handler=null;handler=(s,e)=>{web.CoreWebView2.NavigationCompleted-=handler;completion.SetResult(e.IsSuccess);};web.CoreWebView2.NavigationCompleted+=handler;web.Reload();if(!await completion.Task)throw new Exception("Reload");await WaitJs("window.desktopReady===true");
  await Expect("data.weeks[data.selectedWeek].items[0].title==='Import geprüft' && I18N.language==='en'","Native reload");
  await web.CoreWebView2.ExecuteScriptAsync("$('menuButton').click();$('menuClockodo').click();");await Task.Delay(100);await web.CoreWebView2.ExecuteScriptAsync("$('clockodoStart').click()");await WaitJs("clockodoSession!==null && clockodoAccount!==null");
  if(service==null||service.HasExited)throw new Exception("Child service not started");
  await Expect("!JSON.stringify(data).includes('self-test-only') && clockodoSession.port===1","Credentials stay native");
  await web.CoreWebView2.ExecuteScriptAsync("$('clockodoConnectionDialog').close();openMasterData('projects');$('masterClockodoImport').click()");
  await WaitJs("clockodoCustomers.length===1&&clockodoServices.length===1");
  await web.CoreWebView2.ExecuteScriptAsync("$('clockodoCustomer').value='7';$('clockodoCustomer').dispatchEvent(new Event('change'))");await WaitJs("clockodoProjects.length===1");
   await web.CoreWebView2.ExecuteScriptAsync("document.querySelector('#clockodoProjectChecks input').click();document.querySelector('#clockodoServiceChecks input').click();$('clockodoUse').click();$('masterDataDialog').close()");
  await Expect("data.masterData.projects.some(p=>p.externalIds?.clockodo==='9')&&data.masterData.services.some(s=>s.externalIds?.clockodo==='30')","Native Clockodo import");
  await CaptureImage("desktop-planner.png");
  await web.CoreWebView2.ExecuteScriptAsync("$('menuButton').click();$('menuClockodo').click()");await Task.Delay(100);await CaptureImage("desktop-clockodo.png");
  await web.CoreWebView2.ExecuteScriptAsync("$('clockodoDisconnect').click()");await WaitJs("clockodoSession===null");if(service!=null)throw new Exception("Child not stopped");
  await web.CoreWebView2.ExecuteScriptAsync("$('clockodoConnectionDialog').close()");
  using(var credentials=new CredentialWindow(true)){credentials.Show(this);await Task.Delay(150);if(!credentials.Key.UseSystemPasswordChar)throw new Exception("Key not masked");using(var bmp=new Bitmap(credentials.Width,credentials.Height)){credentials.DrawToBitmap(bmp,new Rectangle(Point.Empty,bmp.Size));bmp.Save(Path.Combine(DesktopStart.CheckRoot,"desktop-credentials.png"));}credentials.Close();}
  var original=Size;for(int i=0;i<2;i++){WindowState=FormWindowState.Maximized;await Task.Delay(100);WindowState=FormWindowState.Normal;await Task.Delay(100);}if(Size!=original)throw new Exception("Window restore changed size");
  await Expect("document.documentElement.scrollWidth<=innerWidth","Horizontal layout");
  if(!await Connect())throw new Exception("Reconnect failed");
  File.WriteAllText(Path.Combine(DesktopStart.CheckRoot,"owned-child-pid.txt"),service.Id.ToString());
  File.WriteAllText(Path.Combine(DesktopStart.CheckRoot,"PASS.txt"),"PASS: real packaged WebView2; shared planner; native atomic storage; import with prior-state backup; invalid write rejection; backup; DE/EN; reload; bundled Node on isolated port; fake Clockodo customer/project/service import; native masked dialog; disconnect cleanup; window restore. No real API calls. Runtime "+web.CoreWebView2.Environment.BrowserVersionString);
 }
}
}
