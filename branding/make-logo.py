"""Generate branding/logo.png — minimal black & white AndiHub mark (512x512)."""
from PIL import Image, ImageDraw, ImageFont
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "logo.png")
SIZE = 512

img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
d.rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=120, fill=(5, 5, 5, 255))
d.rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=120, outline=(255, 255, 255, 255), width=10)

candidates = [
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]
font = None
for path in candidates:
    if os.path.exists(path):
        try:
            font = ImageFont.truetype(path, 300)
            break
        except Exception:
            continue
if font is None:
    font = ImageFont.load_default()

d.text((SIZE / 2, SIZE / 2 - 12), "A", font=font, fill=(255, 255, 255, 255), anchor="mm")
img.save(OUT)
print("wrote", OUT, img.size)
