"""
Gera o retrato holográfico do site a partir de uma foto: recorta, separa a pessoa do fundo (GrabCut guiado) e grava
retrato/r.bin = 6 bytes de cabeçalho (geometria da cabeça na grade) + grade 128x128 em 4 bits por célula
(0 = fundo, 1..15 = brilho da pessoa). O navegador (holo.js) transforma isso numa nuvem de pontos 3D.

    python gerar-retrato.py foto-origem.png      # também grava previa-retrato.png (conferir a segmentação)

Os números de PERFIL abaixo são medidos na foto atual (684x912, selfie com headset). Foto nova = ajustar o perfil.
"""
import sys
import numpy as np
import cv2
from scipy import ndimage as ndi
from PIL import Image, ImageDraw

SRC = sys.argv[1] if len(sys.argv) > 1 else 'foto-origem.png'
G = 128

# ---- PERFIL DA FOTO (pixels da foto original) ----------------------------------------------------------------------
X0, Y0, LADO = 0, 30, 684                    # recorte quadrado: cabeça, headset e ombros
CABECA = (362, 360, 150, 305)                # elipse da cabeça com barba: cx, cy, rx, ry
ROSTO = (362, 400, 150, 215)                 # pele (provável primeiro plano)
ROSTO_NUCLEO = (362, 400, 85, 125)           # certeza de primeiro plano
FONES = [(178, 330, 48, 100), (535, 370, 42, 100)]   # conchas do headset (esq., dir.)
OMBROS_Y = 520                               # onde o tronco começa (px)
ESCURO, CLARO = 95, 195                      # limiares de brilho: abaixo = pessoa/roupa/cabelo; acima = parede/prateleira

img = cv2.imread(SRC)
h, w = img.shape[:2]
gray0 = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
blur = cv2.GaussianBlur(gray0, (0, 0), 3)
yy, xx = np.mgrid[0:h, 0:w]
elip = lambda cx, cy, rx, ry: ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2

mask = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
mask[blur > CLARO] = cv2.GC_BGD
dentro = (elip(*CABECA) < 1.15) | (yy > OMBROS_Y)
mask[(blur < ESCURO) & dentro] = cv2.GC_FGD                  # cabelo, barba, camiseta
for f in FONES:
    mask[(elip(*f) < 1) & (blur < 130)] = cv2.GC_FGD         # headset
mask[(elip(*ROSTO) < 1) & (mask != cv2.GC_FGD) & (blur < 235)] = cv2.GC_PR_FGD
mask[elip(*ROSTO_NUCLEO) < 1] = cv2.GC_FGD
mask[:OMBROS_Y - 60, :90] = cv2.GC_BGD                       # cadeira/parede à esquerda, acima do ombro
mask[:OMBROS_Y - 90, 600:] = cv2.GC_BGD                      # prateleira à direita, acima do ombro
bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
cv2.grabCut(img, mask, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
fg = ((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)).astype(np.uint8)
fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((17, 17), np.uint8))
lab, n = ndi.label(fg)
if n > 1:
    tam = ndi.sum(fg, lab, range(1, n + 1))
    fg = (lab == (1 + int(np.argmax(tam)))).astype(np.uint8)
fg = ndi.binary_fill_holes(fg).astype(np.uint8)

# ---- brilho com contraste local, normalizado pelos percentis da pessoa
gray = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(4, 4)).apply(gray0).astype(np.float32)
face = (elip(*ROSTO) < 1) & (fg > 0)
lo, hi = np.percentile(gray[face], [2, 98])      # contraste medido no rosto (o terno escuro não achata a pele)
gray = np.clip((gray - lo) / max(hi - lo, 1), 0, 1) ** 0.9 * 255

rec = (slice(Y0, Y0 + LADO), slice(X0, X0 + LADO))
g = cv2.resize(gray[rec], (G, G), interpolation=cv2.INTER_AREA).astype(np.float32)
m = cv2.resize(fg[rec].astype(np.float32), (G, G), interpolation=cv2.INTER_AREA) > 0.5
q = np.where(m, 1 + np.round(g / 255.0 * 14), 0).astype(np.uint8)          # 0 fundo; 1..15 pessoa
flat = q.reshape(-1)
packed = ((flat[0::2] << 4) | flat[1::2]).astype(np.uint8)

# ---- cabeçalho: geometria da cabeça em células da grade (dá o volume 3D)
k = G / LADO
cx, cy, rx, ry = CABECA
cab = [int(round((cx - X0) * k)), int(round((cy - Y0) * k)), int(round(rx * k)), int(round(ry * k)),
       int(round((OMBROS_Y - Y0) * k)), 30]
assert all(0 <= v < 256 for v in cab), cab
open('retrato/r.bin', 'wb').write(bytes(cab) + packed.tobytes())
print(f'r.bin: {6 + len(packed)} bytes · {int(m.sum())} pontos de {G*G} células · cabeçalho {cab}')

# ---- prévia (ortográfica, verde sobre preto)
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
