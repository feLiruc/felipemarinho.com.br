"""
Gera o retrato holográfico do site: recorta a foto, separa a pessoa do fundo (GrabCut) e grava
dist/r.bin = grade 128x128 em 4 bits por célula (0 = fundo, 1..15 = brilho da pessoa), 8 KB.
O navegador transforma isso em nuvem de pontos 3D (WebGL). Também grava prévia em previa-retrato.png.

    python gerar-retrato.py foto-origem.png
"""
import sys
import numpy as np
import cv2
from scipy import ndimage as ndi
from PIL import Image, ImageDraw

SRC = sys.argv[1] if len(sys.argv) > 1 else 'foto-origem.png'
G = 128                      # grade
X0, Y0, LADO = 95, 0, 420    # recorte (cabeça e peito) em pixels da foto 633x633

img = cv2.imread(SRC)
h, w = img.shape[:2]
assert (w, h) == (633, 633), (w, h)

# --- separa a pessoa do fundo claro (GrabCut guiado: fundo = muito claro; terno/cabelo/barba = escuros; rosto = elipse)
gray0 = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
blur = cv2.GaussianBlur(gray0, (0, 0), 3)
mask = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
mask[blur > 200] = cv2.GC_BGD
mask[blur < 85] = cv2.GC_FGD
yy, xx = np.mgrid[0:h, 0:w]
elip = lambda cx, cy, rx, ry: ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2
mask[(elip(300, 170, 95, 135) < 1) & (mask != cv2.GC_FGD)] = cv2.GC_PR_FGD
mask[elip(300, 175, 55, 90) < 1] = cv2.GC_FGD
mask[:, :20] = cv2.GC_BGD
mask[:, -20:] = cv2.GC_BGD
bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
cv2.grabCut(img, mask, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
fg = ((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)).astype(np.uint8)
fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
lab, n = ndi.label(fg)
if n > 1:
    tam = ndi.sum(fg, lab, range(1, n + 1))
    fg = (lab == (1 + int(np.argmax(tam)))).astype(np.uint8)
fg = ndi.binary_fill_holes(fg).astype(np.uint8)

# --- brilho com contraste local (realça olhos, nariz, barba)
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
gray = cv2.createCLAHE(clipLimit=1.6, tileGridSize=(4, 4)).apply(gray).astype(np.float32)
lo, hi = np.percentile(gray[fg > 0], [3, 97])
gray = np.clip((gray - lo) / max(hi - lo, 1), 0, 1) ** 0.85 * 255

rec = (slice(Y0, Y0 + LADO), slice(X0, X0 + LADO))
g = cv2.resize(gray[rec], (G, G), interpolation=cv2.INTER_AREA).astype(np.float32)
m = cv2.resize(fg[rec].astype(np.float32), (G, G), interpolation=cv2.INTER_AREA) > 0.5

q = np.where(m, 1 + np.round(g / 255.0 * 14), 0).astype(np.uint8)          # 0 fundo; 1..15 pessoa
flat = q.reshape(-1)
packed = ((flat[0::2] << 4) | flat[1::2]).astype(np.uint8)                 # 2 células por byte
open('retrato/r.bin', 'wb').write(packed.tobytes())
print(f'r.bin: {len(packed)} bytes · {int(m.sum())} pontos de {G*G} células')

# --- prévia (ortográfica, verde sobre preto)
esc = 5
prev = Image.new('RGB', (G * esc, G * esc), (0, 0, 0))
d = ImageDraw.Draw(prev)
for y in range(G):
    for x in range(G):
        v = q[y, x]
        if v:
            b = 0.25 + 0.75 * (v - 1) / 14
            d.ellipse([x * esc, y * esc, x * esc + 3, y * esc + 3], fill=(0, int(255 * b), int(70 * b)))
prev.save('previa-retrato.png')
print('previa-retrato.png ok')
