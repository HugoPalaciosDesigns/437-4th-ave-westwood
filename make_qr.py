"""
Generate the open-house QR code and a printable sign.

    python make_qr.py https://437-4th-ave-westwood.vercel.app

Writes into qr/ :
    437-open-house-qr.svg    vector — use this for anything printed
    437-open-house-qr.png    2000px raster — social posts, slides, MLS
    437-open-house-sign.html open it and print to PDF (US Letter, portrait)

The encoded link carries ?src=qr and lands on the registration form, so
door traffic shows up in your leads tagged "qr" and separate from social.

Requires: pip install segno
"""

import io
import os
import sys
import urllib.parse

import segno

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "qr")

ADDRESS = "437 4th Avenue"
CITY = "Westwood, New Jersey"
PRICE = "$525,000"
AGENT = "Hugo A. Palacios"
PHONE = "973-670-7046"
BROKERAGE = "Keller Williams Village Square Realty"
OFFICE = "74 Godwin Avenue, Ridgewood, NJ 07450 &middot; Office 201-445-4300"

if len(sys.argv) < 2:
    sys.exit("usage: python make_qr.py <site-url>")

base = sys.argv[1].rstrip("/")
target = base + "/?src=qr#register"

os.makedirs(OUT, exist_ok=True)

# Error correction "H" survives a scuffed yard sign and lets the code be
# scanned from an angle; border 3 is the quiet zone scanners need.
qr = segno.make(target, error="h")

svg_path = os.path.join(OUT, "437-open-house-qr.svg")
png_path = os.path.join(OUT, "437-open-house-qr.png")
qr.save(svg_path, scale=12, border=3, dark="#16191B", light="#FFFFFF")
qr.save(png_path, scale=24, border=3, dark="#16191B", light="#FFFFFF")

# The sign embeds the SVG inline so the printed file needs no other assets.
svg_markup = io.open(svg_path, encoding="utf-8").read()
svg_markup = svg_markup[svg_markup.index("<svg"):]

sign = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Scan to Register &mdash; 437 4th Avenue</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap">
<style>
  @page { size: letter portrait; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: #fff; color: #16191B;
    font-family: "Archivo", Helvetica, Arial, sans-serif;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .sheet {
    width: 8.5in; height: 11in; margin: 0 auto; padding: .8in .75in .6in;
    display: flex; flex-direction: column; align-items: center; text-align: center;
  }
  .eyebrow { font-size: 12pt; font-weight: 700; letter-spacing: .26em; text-transform: uppercase; color: #94702F; }
  h1 { font-family: "Fraunces", Georgia, serif; font-size: 46pt; font-weight: 700; letter-spacing: -.02em; margin: .12in 0 0; line-height: 1; }
  .city { font-size: 15pt; color: #5D6661; margin-top: .07in; }
  .price { font-family: "Fraunces", Georgia, serif; font-size: 27pt; font-weight: 600; color: #37503C; margin-top: .1in; }
  .rule { width: 100%%; height: 2px; background: #16191B; margin: .26in 0; }
  .cta { font-family: "Fraunces", Georgia, serif; font-size: 31pt; font-weight: 700; line-height: 1.1; }
  .sub { font-size: 13.5pt; color: #5D6661; margin-top: .1in; max-width: 5.6in; line-height: 1.45; }
  .qr { margin-top: .24in; padding: .17in; border: 2px solid #16191B; border-radius: 6px; background: #fff; }
  .qr svg { width: 3.5in; height: 3.5in; display: block; }
  .url { margin-top: .15in; font-size: 11.5pt; font-weight: 600; letter-spacing: .02em; color: #37503C; word-break: break-all; }
  .foot { margin-top: auto; width: 100%%; border-top: 2px solid #16191B; padding-top: .16in; }
  .foot b { font-family: "Fraunces", Georgia, serif; font-size: 17pt; font-weight: 600; }
  .foot .line { font-size: 11.5pt; color: #5D6661; margin-top: .04in; }
  .foot .phone { font-size: 15pt; font-weight: 700; margin-top: .06in; }
  .eho { font-size: 8.5pt; letter-spacing: .12em; text-transform: uppercase; color: #858E88; margin-top: .12in; }
  @media screen { body { background: #E6E9E3; padding: 24px 0; } .sheet { background: #fff; box-shadow: 0 10px 40px rgba(0,0,0,.18); } }
</style>
</head>
<body>
  <div class="sheet">
    <p class="eyebrow">Open House</p>
    <h1>%(address)s</h1>
    <p class="city">%(city)s</p>
    <p class="price">%(price)s</p>

    <div class="rule"></div>

    <p class="cta">Scan to sign in &amp;<br>unlock the buyer packet</p>
    <p class="sub">Photos, floor plans, the 3D tour, payment estimates and all seven
      documents &mdash; including the seller&rsquo;s disclosures.</p>

    <div class="qr">%(svg)s</div>
    <p class="url">%(shown)s</p>

    <div class="foot">
      <b>%(agent)s</b>
      <p class="line">REALTOR&reg; &middot; %(brokerage)s</p>
      <p class="line">%(office)s</p>
      <p class="phone">%(phone)s</p>
      <p class="eho">Equal Housing Opportunity</p>
    </div>
  </div>
</body>
</html>
""" % {
    "address": ADDRESS,
    "city": CITY,
    "price": PRICE,
    "svg": svg_markup,
    "shown": urllib.parse.urlparse(base).netloc or base,
    "agent": AGENT,
    "brokerage": BROKERAGE,
    "office": OFFICE,
    "phone": PHONE,
}

sign_path = os.path.join(OUT, "437-open-house-sign.html")
io.open(sign_path, "w", encoding="utf-8").write(sign)

print("QR target:", target)
print("modules:  ", qr.symbol_size(scale=1, border=0)[0], "x", qr.symbol_size(scale=1, border=0)[1])
for f in (svg_path, png_path, sign_path):
    print(f"{round(os.path.getsize(f)/1024):>5} KB  qr/{os.path.basename(f)}")
