# Solo desarrollo: logotipo para el pie (fondo oscuro) con el escudo en sus colores originales
# (burdeos y plata) y el texto "RevLeads" de la hoja de marca en claro, sin dorado.
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System; using System.Collections.Generic; using System.Drawing; using System.Drawing.Imaging;
public static class LogoPie {
  static Bitmap Crop(Bitmap o, int x, int y, int w, int h) {
    Bitmap c = new Bitmap(w, h, PixelFormat.Format32bppArgb);
    using (Graphics g = Graphics.FromImage(c)) g.DrawImage(o, new Rectangle(0,0,w,h), new Rectangle(x,y,w,h), GraphicsUnit.Pixel);
    return c;
  }
  // Escudo: se quita el fondo claro con relleno desde los bordes y se limpia 1 px de halo.
  public static Bitmap Shield(Bitmap o, int x, int y, int w, int h, int tol) {
    Bitmap c = Crop(o, x, y, w, h);
    bool[,] t = new bool[w,h]; var q = new Queue<Point>();
    Action<int,int> add = (px,py) => { if (px<0||py<0||px>=w||py>=h||t[px,py]) return; Color k = c.GetPixel(px,py);
      if (k.R>=255-tol && k.G>=255-tol && k.B>=255-tol) { t[px,py]=true; q.Enqueue(new Point(px,py)); } };
    for (int i=0;i<w;i++){add(i,0);add(i,h-1);} for (int j=0;j<h;j++){add(0,j);add(w-1,j);}
    while (q.Count>0){ var p=q.Dequeue(); add(p.X+1,p.Y);add(p.X-1,p.Y);add(p.X,p.Y+1);add(p.X,p.Y-1); }
    var rem = new List<Point>();
    for (int i=1;i<w-1;i++) for (int j=1;j<h-1;j++) { if (t[i,j]) continue;
      if (!(t[i+1,j]||t[i-1,j]||t[i,j+1]||t[i,j-1])) continue;
      Color k = c.GetPixel(i,j); int mx=Math.Max(k.R,Math.Max(k.G,k.B)), mn=Math.Min(k.R,Math.Min(k.G,k.B));
      if (mn>185 && mx-mn<35) rem.Add(new Point(i,j)); }
    foreach (var p in rem) t[p.X,p.Y]=true;
    // Interior del escudo: el fondo claro que queda dentro también pasa a transparente (solo el blanco casi puro),
    // sembrando desde puntos del interior; la flecha plata conserva sus sombras y no se toca.
    int itol = 16; var q2 = new Queue<Point>();
    Action<int,int> add2 = (px,py) => { if (px<0||py<0||px>=w||py>=h||t[px,py]) return; Color k = c.GetPixel(px,py);
      if (k.R>=255-itol && k.G>=255-itol && k.B>=255-itol) { t[px,py]=true; q2.Enqueue(new Point(px,py)); } };
    var seeds = new Point[] { new Point(w*38/100, h*12/100), new Point(w*78/100, h*30/100), new Point(w*20/100, h*42/100), new Point(w*50/100, h*88/100), new Point(w*66/100, h*78/100) };
    // (Desactivado: el interior claro es parte del diseño original del escudo y queda más limpio así.)
    // foreach (var s in seeds) add2(s.X, s.Y);
    while (q2.Count>0){ var p=q2.Dequeue(); add2(p.X+1,p.Y);add2(p.X-1,p.Y);add2(p.X,p.Y+1);add2(p.X,p.Y-1); }
    for (int i=0;i<w;i++) for (int j=0;j<h;j++) if (t[i,j]) c.SetPixel(i,j,Color.FromArgb(0,0,0,0));
    return Trim(c, 20);
  }
  // Texto: el blanco del banner azul pasa a texto-claro con bordes suaves (sin azul).
  public static Bitmap Text(Bitmap o, int x, int y, int w, int h) {
    Bitmap c = Crop(o, x, y, w, h);
    Color bgc = c.GetPixel(2,2); double[] bg = { bgc.R, bgc.G, bgc.B };
    double[] fg = { 255,255,255 }; double[] d = { fg[0]-bg[0], fg[1]-bg[1], fg[2]-bg[2] }; double dd = d[0]*d[0]+d[1]*d[1]+d[2]*d[2];
    Bitmap r = new Bitmap(w, h, PixelFormat.Format32bppArgb);
    for (int i=0;i<w;i++) for (int j=0;j<h;j++) { Color p = c.GetPixel(i,j);
      double t = ((p.R-bg[0])*d[0]+(p.G-bg[1])*d[1]+(p.B-bg[2])*d[2])/dd; t = Math.Max(0, Math.Min(1, t));
      double a = t < 0.06 ? 0 : Math.Min(1, t*1.08);
      r.SetPixel(i,j,Color.FromArgb((int)Math.Round(a*255), 244, 242, 236)); }
    return Trim(r, 128);
  }
  static Bitmap Trim(Bitmap b, int thr) {
    int minX=b.Width, minY=b.Height, maxX=0, maxY=0;
    for (int i=0;i<b.Width;i++) for (int j=0;j<b.Height;j++) if (b.GetPixel(i,j).A>thr) { if(i<minX)minX=i; if(j<minY)minY=j; if(i>maxX)maxX=i; if(j>maxY)maxY=j; }
    int cw=maxX-minX+1, ch=maxY-minY+1; Bitmap o = new Bitmap(cw,ch,PixelFormat.Format32bppArgb);
    using (Graphics g = Graphics.FromImage(o)) g.DrawImage(b,new Rectangle(0,0,cw,ch),new Rectangle(minX,minY,cw,ch),GraphicsUnit.Pixel);
    return o;
  }
  public static void Compose(string src, string outp, int scale) {
    Bitmap o = new Bitmap(src);
    Bitmap sh = Shield(o, 458, 112, 112, 140, 30);
    Bitmap tx = Text(o, 592, 322, 345, 108);
    // El escudo del banner mide ~105 px de alto; el original pequeño ~ 118: se iguala la proporción del banner.
    double shH = 118 * scale; double shW = sh.Width * (shH / sh.Height);
    double txH = tx.Height * scale * 1.0; double txW = tx.Width * scale;
    int gap = 14 * scale;
    int W = (int)Math.Ceiling(shW + gap + txW), H = (int)Math.Ceiling(Math.Max(shH, txH));
    Bitmap f = new Bitmap(W, H, PixelFormat.Format32bppArgb);
    using (Graphics g = Graphics.FromImage(f)) {
      g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic; g.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;
      g.DrawImage(sh, new Rectangle(0, (int)((H-shH)/2), (int)shW, (int)shH));
      g.DrawImage(tx, new Rectangle((int)(shW+gap), (int)((H-txH)/2), (int)txW, (int)txH));
    }
    f.Save(outp, ImageFormat.Png);
    Console.WriteLine("shield " + sh.Width + "x" + sh.Height + " text " + tx.Width + "x" + tx.Height + " final " + W + "x" + H);
  }
}
'@ -ReferencedAssemblies System.Drawing
$d = Split-Path -Parent $PSScriptRoot
[LogoPie]::Compose("$d\assets\logo.png", "$d\assets\img\logotipo-pie.png", 3)
$img = [System.Drawing.Image]::FromFile("$d\assets\img\logotipo-pie.png")
$b = New-Object System.Drawing.Bitmap ($img.Width + 60), ($img.Height + 60)
$g = [System.Drawing.Graphics]::FromImage($b); $g.Clear([System.Drawing.ColorTranslator]::FromHtml("#1B100C")); $g.DrawImage($img, 30, 30)
$b.Save("$d\tools\prev-logo-pie.png")
