# Solo desarrollo: genera el logotipo para fondos oscuros a partir de la hoja de marca
# (versión del banner azul: escudo dorado + texto claro, con los colores exactos de la paleta).
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging;
public static class LogoDark {
  public static void Run(string src, string outp, int x, int y, int w, int h, int scale) {
    Bitmap o = new Bitmap(src);
    Bitmap c = new Bitmap(w, h, PixelFormat.Format32bppArgb);
    using (Graphics g = Graphics.FromImage(c)) { g.DrawImage(o, new Rectangle(0,0,w,h), new Rectangle(x,y,w,h), GraphicsUnit.Pixel); }
    Color bgc = c.GetPixel(3, 3);
    double[] bg = { bgc.R, bgc.G, bgc.B };
    double[][] fgs = { new double[]{244,242,236}, new double[]{196,154,91} };
    int minX = w, minY = h, maxX = 0, maxY = 0;
    Bitmap r = new Bitmap(w, h, PixelFormat.Format32bppArgb);
    for (int i = 0; i < w; i++) for (int j = 0; j < h; j++) {
      Color p = c.GetPixel(i, j);
      double[] pv = { p.R, p.G, p.B };
      double bestRes = double.MaxValue, bestT = 0; int bestK = 0;
      for (int k = 0; k < fgs.Length; k++) {
        double[] d = { fgs[k][0]-bg[0], fgs[k][1]-bg[1], fgs[k][2]-bg[2] };
        double dd = d[0]*d[0]+d[1]*d[1]+d[2]*d[2];
        double t = ((pv[0]-bg[0])*d[0]+(pv[1]-bg[1])*d[1]+(pv[2]-bg[2])*d[2]) / dd;
        t = Math.Max(0, Math.Min(1, t));
        double e0 = pv[0]-(bg[0]+t*d[0]), e1 = pv[1]-(bg[1]+t*d[1]), e2 = pv[2]-(bg[2]+t*d[2]);
        double res = e0*e0+e1*e1+e2*e2;
        if (res < bestRes) { bestRes = res; bestT = t; bestK = k; }
      }
      double a = bestT < 0.06 ? 0 : Math.Min(1, bestT * 1.08);
      if (a > 0.5) { if (i<minX) minX=i; if (j<minY) minY=j; if (i>maxX) maxX=i; if (j>maxY) maxY=j; }
      // Versión monocroma para el pie: escudo y texto en texto-claro (#F4F2EC), sin dorado.
      r.SetPixel(i, j, Color.FromArgb((int)Math.Round(a*255), 244, 242, 236));
    }
    int pad = 4;
    minX = Math.Max(0, minX-pad); minY = Math.Max(0, minY-pad); maxX = Math.Min(w-1, maxX+pad); maxY = Math.Min(h-1, maxY+pad);
    int cw = maxX-minX+1, ch = maxY-minY+1;
    Bitmap fin = new Bitmap(cw*scale, ch*scale, PixelFormat.Format32bppArgb);
    using (Graphics g = Graphics.FromImage(fin)) {
      g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
      g.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;
      g.DrawImage(r, new Rectangle(0,0,cw*scale,ch*scale), new Rectangle(minX,minY,cw,ch), GraphicsUnit.Pixel);
    }
    fin.Save(outp, ImageFormat.Png);
    Console.WriteLine("bg=" + bgc.R + "," + bgc.G + "," + bgc.B + " size=" + (cw*scale) + "x" + (ch*scale));
  }
}
'@ -ReferencedAssemblies System.Drawing
$d = Split-Path -Parent $PSScriptRoot
[LogoDark]::Run("$d\assets\logo.png", "$d\assets\img\logotipo-pie-mono.png", 432, 288, 552, 166, 2)
$img = [System.Drawing.Image]::FromFile("$d\assets\img\logotipo-pie-mono.png")
$b = New-Object System.Drawing.Bitmap ($img.Width + 40), ($img.Height + 40)
$g = [System.Drawing.Graphics]::FromImage($b); $g.Clear([System.Drawing.ColorTranslator]::FromHtml("#1B100C")); $g.DrawImage($img, 20, 20)
$b.Save("$d\tools\prev-logo-oscuro.png")
