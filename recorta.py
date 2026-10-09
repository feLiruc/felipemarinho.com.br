import sys
from PIL import Image
from rembg import remove, new_session
modelo = sys.argv[1]
img = Image.open('foto-origem.png').convert('RGB')
s = new_session(modelo)
out = remove(img, session=s, alpha_matting=True, alpha_matting_foreground_threshold=235, alpha_matting_background_threshold=15, alpha_matting_erode_size=8)
out.save(f'recorte-{modelo}.png')
a = out.split()[3]
bg = Image.new('RGB', out.size, (0, 0, 0)); bg.paste(out, mask=a); bg.save(f'recorte-{modelo}-previa.png')
print('ok', modelo, out.size)
