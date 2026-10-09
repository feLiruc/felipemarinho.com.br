"""
Gera o retrato holográfico do site a partir de uma foto + o recorte feito pelo rembg (IA de remoção de fundo):
retrato/r.bin = 7 bytes de cabeçalho (geometria da cabeça e tamanho da grade) + grade GxG em 4 bits por célula
(0 = fundo, 1..15 = brilho da pessoa). O navegador (holo.js) transforma isso numa nuvem de pontos 3D.

    # 1) recorte (precisa do rembg num venv; o modelo u2net_human_seg roda local, a foto não sai do computador):
    #      python recorta.py u2net_human_seg      ->  recorte-u2net_human_seg.png (foto com fundo transparente)
    # 2) python gerar-retrato.py foto-origem.png recorte-u2net_human_seg.png   (grava também previa-retrato.png)

Os números de PERFIL abaixo são medidos na foto atual (684x912, selfie com headset). Foto nova = ajustar o perfil.
"""
import sys
import numpy as np
import cv2
from PIL import Image, ImageDraw

SRC = sys.argv[1] if len(sys.argv) > 1 else 'foto-origem.png'
RECORTE = sys.argv[2] if len(sys.argv) > 2 else 'recorte-u2net_human_seg.png'
G = 160

# ---- PERFIL DA FOTO (pixels da foto original) ----------------------------------------------------------------------
X0, Y0, LADO = 0, 30, 684                    # recorte quadrado: cabeça, headset e ombros
CABECA = (362, 360, 150, 305)                # elipse da cabeça com barba: cx, cy, rx, ry
ROSTO = (362, 400, 150, 215)                 # pele (para medir o contraste do brilho)
OMBROS_Y = 520                               # onde o tronco começa (px)

img = cv2.imread(SRC)
h, w = img.shape[:2]
gray0 = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
yy, xx = np.mgrid[0:h, 0:w]
elip = lambda cx, cy, rx, ry: ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2

alpha = np.array(Image.open(RECORTE).convert('RGBA'))[:, :, 3].astype(np.float32) / 255.0
assert alpha.shape == (h, w), (alpha.shape, (h, w))

# ---- brilho com contraste local, normalizado pelo rosto (o terno escuro não achata a pele)
gray = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(4, 4)).apply(gray0).astype(np.float32)
face = (elip(*ROSTO) < 1) & (alpha > 0.5)
lo, hi = np.percentile(gray[face], [2, 98])
gray = np.clip((gray - lo) / max(hi - lo, 1), 0, 1) ** 0.9 * 255

rec = (slice(Y0, Y0 + LADO), slice(X0, X0 + LADO))
g = cv2.resize(gray[rec], (G, G), interpolation=cv2.INTER_AREA).astype(np.float32)
m = cv2.resize(alpha[rec], (G, G), interpolation=cv2.INTER_AREA) > 0.5
q = np.where(m, 1 + np.round(g / 255.0 * 14), 0).astype(np.uint8)          # 0 fundo; 1..15 pessoa
flat = q.reshape(-1)
if len(flat) % 2:
    flat = np.append(flat, 0)
packed = ((flat[0::2] << 4) | flat[1::2]).astype(np.uint8)

# ---- cabeçalho: geometria da cabeça em células da grade (dá o volume 3D) + tamanho da grade
k = G / LADO
cx, cy, rx, ry = CABECA
cab = [int(round((cx - X0) * k)), int(round((cy - Y0) * k)), int(round(rx * k)), int(round(ry * k)),
       int(round((OMBROS_Y - Y0) * k)), int(round(160 * k)), G]
assert all(0 <= v < 256 for v in cab), cab
open('retrato/r.bin', 'wb').write(bytes(cab) + packed.tobytes())
print(f'r.bin: {len(cab) + len(packed)} bytes · {int(m.sum())} pontos de {G*G} células · cabeçalho {cab}')

# ---- prévia (ortográfica, verde sobre preto)
esc = 4
prev = Image.new('RGB', (G * esc, G * esc), (0, 0, 0))
d = ImageDraw.Draw(prev)
for y in range(G):
    for x in range(G):
        v = q[y, x]
        if v:
            b = 0.25 + 0.75 * (v - 1) / 14
            d.ellipse([x * esc, y * esc, x * esc + 2, y * esc + 2], fill=(0, int(255 * b), int(70 * b)))
prev.save('previa-retrato.png')
print('previa-retrato.png ok')
