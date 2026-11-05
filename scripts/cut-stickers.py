"""스티커 시트(src/assets/brand/sticker-sheet.png)를 낱개 PNG로 자릅니다.

시트 가장자리의 반투명 얼룩은 지우고, 객체 모양만 남깁니다.
실행: python scripts/cut-stickers.py  (Pillow, numpy, scipy 필요)
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
SHEET = ROOT / 'src/assets/brand/sticker-sheet.png'
OUT = ROOT / 'src/assets/stickers'

# 이름: (왼쪽, 위, 오른쪽, 아래) 시트 좌표, 결과 최대 폭
STICKERS = {
    'highlighter': ((40, 40, 485, 400), 440),
    'paperclip-lime': ((1015, 65, 1145, 252), 130),
    'paperclip-silver': ((1160, 88, 1306, 280), 146),
    'binder-clip': ((1298, 114, 1475, 317), 177),
    'sticky-note': ((1199, 336, 1481, 588), 282),
    'notepad': ((45, 426, 389, 751), 344),
    'paper': ((431, 466, 784, 741), 353),
    'folder': ((1153, 826, 1347, 983), 194),
    'sparkle': ((200, 797, 320, 995), 120),
    'check-circle': ((1001, 317, 1113, 424), 112),
    'star': ((779, 314, 939, 428), 160),
    'squiggle': ((499, 92, 870, 183), 371),
    'cursor': ((43, 777, 173, 905), 130),
}


def clean(rgba: np.ndarray) -> np.ndarray:
    alpha = rgba[..., 3]
    solid = ndi.binary_closing(ndi.binary_opening(alpha > 150, iterations=2), iterations=6)
    labels, count = ndi.label(solid)
    if count == 0:
        return rgba
    sizes = ndi.sum(solid, labels, range(1, count + 1))
    # 큰 조각만 남김 (가장 큰 것의 6% 이상: 형광펜 뚜껑, 반짝이 점 같은 작은 부속 포함)
    keep = np.isin(labels, [i + 1 for i, s in enumerate(sizes) if s >= sizes.max() * 0.06])
    keep = ndi.binary_fill_holes(ndi.binary_dilation(keep, iterations=3))
    # 가장자리는 부드럽게
    soft = ndi.gaussian_filter(keep.astype(float), 1.2)
    out = rgba.copy()
    out[..., 3] = (alpha * soft).clip(0, 255).astype(np.uint8)
    return out


def main() -> None:
    sheet = np.asarray(Image.open(SHEET).convert('RGBA'))
    OUT.mkdir(parents=True, exist_ok=True)
    for name, ((l, t, r, b), width) in STICKERS.items():
        img = Image.fromarray(clean(sheet[t:b, l:r]))
        img = img.crop(img.getbbox())
        if img.width > width:
            img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
        img.save(OUT / f'{name}.png', optimize=True)
        print(name, img.size)


if __name__ == '__main__':
    main()
