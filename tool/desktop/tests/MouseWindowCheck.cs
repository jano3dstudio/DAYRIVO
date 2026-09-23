using System;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows.Forms;
namespace Jano.AppKit {
// Opt-in interactive QA on an isolated app profile. Never click another window.
public static class MouseWindowCheck {
 [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
 [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h,IntPtr pid);
 [DllImport("kernel32.dll")] static extern uint GetCurrentThreadId();
 [DllImport("user32.dll")] static extern bool AttachThreadInput(uint a,uint b,bool attach);
 [DllImport("user32.dll")] static extern IntPtr WindowFromPoint(Point p);
 [DllImport("user32.dll")] static extern bool SetCursorPos(int x,int y);
 [DllImport("user32.dll")] static extern uint SendInput(uint n,INPUT[] inputs,int size);
 [DllImport("user32.dll")] static extern bool IsZoomed(IntPtr h);
 [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
 [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h,int command);
 [StructLayout(LayoutKind.Sequential)] struct MOUSEINPUT {public int dx,dy;public uint data,flags,time;public UIntPtr extra;}
 [StructLayout(LayoutKind.Explicit)] struct INPUTUNION {[FieldOffset(0)]public MOUSEINPUT mouse;}
 [StructLayout(LayoutKind.Sequential)] struct INPUT {public uint type;public INPUTUNION data;}
 static void Log(string root,string value){File.AppendAllText(Path.Combine(root,"mouse-checks.txt"),value+Environment.NewLine);}
 static async Task Click(Form f,int kind){
  string[] names=kind==0?new[]{"Minimize","Minimieren"}:new[]{"Maximize","Maximieren","Restore","Wiederherstellen"};
  var button=f.Controls.OfType<Button>().Single(b=>b.Visible&&names.Contains(b.AccessibleName));
  uint own=GetCurrentThreadId(),active=GetWindowThreadProcessId(GetForegroundWindow(),IntPtr.Zero);
  bool attached=own!=active&&AttachThreadInput(own,active,true);
  try{f.Activate();SetForegroundWindow(f.Handle);}finally{if(attached)AttachThreadInput(own,active,false);}await Task.Delay(180);
  var point=button.PointToScreen(new Point(button.Width/2,button.Height/2));
  if(GetForegroundWindow()!=f.Handle||WindowFromPoint(point)!=button.Handle)throw new Exception("Mouse QA interrupted: target is not foreground caption button; foreground="+GetForegroundWindow()+" form="+f.Handle+" hit="+WindowFromPoint(point)+" button="+button.Handle+" point="+point+" bounds="+button.Bounds);
  SetCursorPos(point.X,point.Y);await Task.Delay(60);
  if(WindowFromPoint(point)!=button.Handle||GetForegroundWindow()!=f.Handle)throw new Exception("Mouse QA focus changed");
  var inputs=new[]{new INPUT{data=new INPUTUNION{mouse=new MOUSEINPUT{flags=2}}},new INPUT{data=new INPUTUNION{mouse=new MOUSEINPUT{flags=4}}}};
  if(SendInput(1,new[]{inputs[0]},Marshal.SizeOf(typeof(INPUT)))!=1)throw new Exception("SendInput down blocked");
  await Task.Delay(100);
  if(SendInput(1,new[]{inputs[1]},Marshal.SizeOf(typeof(INPUT)))!=1)throw new Exception("SendInput up blocked");
  await Task.Delay(650);
 }
 public static async Task Run(Form f,string root){
  var cursor=Cursor.Position;
  try{
   ShowWindow(f.Handle,9);await Task.Delay(350);var original=f.Bounds;
   foreach(var b in f.Controls.OfType<Button>()){var button=b;button.MouseDown+=(s,e)=>Log(root,"DOWN "+button.AccessibleName+" "+Cursor.Position);button.MouseUp+=(s,e)=>Log(root,"UP "+button.AccessibleName+" "+Cursor.Position);button.Click+=(s,e)=>Log(root,"CLICK "+button.AccessibleName);}
   Log(root,"Real SendInput; initial bounds "+original+"; DPI "+f.CreateGraphics().DpiX);
   for(int i=0;i<3;i++){
    await Click(f,1);if(!IsZoomed(f.Handle))throw new Exception("First mouse click did not maximize, cycle "+i);
    var area=Screen.FromHandle(f.Handle).WorkingArea;if(f.Bounds!=area)throw new Exception("Maximize does not fill working area: "+f.Bounds+" expected "+area);
    Log(root,"PASS maximize click "+(i+1)+" "+f.Bounds);
    if(i==0){using(var bitmap=new Bitmap(f.Width,f.Height)){using(var g=Graphics.FromImage(bitmap))g.CopyFromScreen(f.Location,Point.Empty,f.Size);bitmap.Save(Path.Combine(root,"maximized.png"));}}
    await Click(f,1);if(IsZoomed(f.Handle)||f.Bounds!=original)throw new Exception("Mouse restore changed bounds: "+f.Bounds);
    Log(root,"PASS restore click "+(i+1)+" "+f.Bounds);
   }
   await Click(f,0);if(!IsIconic(f.Handle))throw new Exception("First mouse click did not minimize");
   ShowWindow(f.Handle,9);await Task.Delay(350);if(f.Bounds!=original)throw new Exception("Restore after minimize changed bounds");
   await Click(f,1);await Click(f,0);if(!IsIconic(f.Handle))throw new Exception("Maximized minimize failed");
   ShowWindow(f.Handle,9);await Task.Delay(350);if(!IsZoomed(f.Handle))throw new Exception("Maximized state lost after minimizing");
   await Click(f,1);if(f.Bounds!=original)throw new Exception("Final restore changed bounds");
   Log(root,"PASS minimize from normal and maximized; original bounds preserved");
   File.WriteAllText(Path.Combine(root,"PASS.txt"),"PASS actual SendInput caption clicks in launched application; first click, three maximize/restore cycles, work-area bounds, minimize normal/maximized, unchanged restored geometry.");
  }finally{SetCursorPos(cursor.X,cursor.Y);}
 }
}
}
