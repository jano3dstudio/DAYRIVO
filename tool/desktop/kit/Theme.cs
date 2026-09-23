using System.Drawing;
using System.Drawing.Drawing2D;
namespace Jano.AppKit {
// Compatibility facade for the inspected GLYPHLUME window implementation.
static class L { public static bool English { get; set; } }
static class Theme {
 public static Color Background { get { return Tokens.Background; } }
 public static Color Raised { get { return Tokens.Raised; } }
 public static Color Text { get { return Tokens.Text; } }
 public static Color Muted { get { return Tokens.Muted; } }
 public static Color Line { get { return Tokens.Line; } }
 public static string UiFont { get { return Tokens.UiFont; } }
 public static GraphicsPath Rounded(RectangleF r,float radius) {
  var p=new GraphicsPath();if(radius<=0){p.AddRectangle(r);return p;}
  float d=radius*2;p.AddArc(r.Left,r.Top,d,d,180,90);p.AddArc(r.Right-d,r.Top,d,d,270,90);p.AddArc(r.Right-d,r.Bottom-d,d,d,0,90);p.AddArc(r.Left,r.Bottom-d,d,d,90,90);p.CloseFigure();return p;
 }
}
}
