using System;
using System.IO;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Jano.Workspace {
 // Optional host entry point. The same EXE remains the standalone application.
 public static class AppModule {
  static Mutex lease;
  public static Control CreateView(string isolatedRoot) {
   if(lease!=null)throw new InvalidOperationException("DAYRIVO ist bereits geöffnet / is already open.");
   string data=isolatedRoot==null?Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"DAYRIVO","desktop"):Path.Combine(isolatedRoot,"data");
   string identity;using(var h=SHA256.Create())identity=BitConverter.ToString(h.ComputeHash(Encoding.UTF8.GetBytes(data))).Replace("-","");
   bool created;var acquired=new Mutex(true,"Local\\DAYRIVO-"+identity,out created);
   if(!created){acquired.Dispose();throw new InvalidOperationException("DAYRIVO ist schon in einem anderen Fenster geöffnet. Bitte dort schließen und erneut versuchen. / Close the existing DAYRIVO window first.");}
   lease=acquired;
   try {
    Jano.AppKit.DesktopStart.Prepare(isolatedRoot);
    Jano.AppKit.DesktopStart.Embedded=true;
    var view=new Jano.AppKit.DesktopWindow {TopLevel=false,FormBorderStyle=FormBorderStyle.None,MinimumSize=System.Drawing.Size.Empty,Dock=DockStyle.Fill,ShowInTaskbar=false};
    view.Disposed+=(s,e)=>Release();
    return view;
   } catch {Release();throw;}
  }
  static void Release(){if(lease==null)return;try{lease.ReleaseMutex();}finally{lease.Dispose();lease=null;}}
  public static Task StartView(Control view){return ((Jano.AppKit.DesktopWindow)view).StartEmbedded();}
  // Host QA is available only with an explicitly isolated profile.
  public static async Task VerifyView(Control view) {
   if(Jano.AppKit.DesktopStart.CheckRoot==null)throw new InvalidOperationException("Isolated test profile required.");
   await StartView(view);await ((Jano.AppKit.DesktopWindow)view).WorkspaceCheck();
  }
 }
}
