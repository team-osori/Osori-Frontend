"""Pebble 로고 이미지(투명 배경)를 마크와 흰 글자 로고로 나눕니다.

- pebble-mark.png: 초록 조약돌 마크 (파비콘 · 레일)
- pebble-logo.png: 마크 + 흰색 "Pebble" 글자 (어두운 바탕용)
실행: python scripts/cut-logo.py <원본 경로>
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'src/assets/brand'
MARK_BOX = (380, 340, 662, 565)   # 원본 좌표 (왼, 위, 오, 아래)
TEXT_BOX = (690, 360, 1430, 548)


def main(src: str) -> None:
    src_img = np.asarray(Image.open(src).convert('RGBA')).copy()
    # 거의 안 보이는 번짐은 지움
    src_img[src_img[..., 3] < 24, 3] = 0
    l, t, r, b = MARK_BOX
    mark_px = src_img[t:b, l:r].copy()
    # 가장자리 반투명 그림자는 어두운 색이라 어두운 바탕에서 테두리처럼 보임 → 연한 라임 빛으로
    edge = mark_px[..., 3] < 200
    mark_px[edge, :3] = (190, 235, 110)
    mark_px[edge, 3] = (mark_px[edge, 3] * 0.45).astype(np.uint8)
    mark = Image.fromarray(mark_px)
    mark = mark.crop(mark.getbbox())

    # 검은 글자를 흰색으로 (투명도는 그대로)
    l2, t2, r2, b2 = TEXT_BOX
    text_px = src_img[t2:b2, l2:r2].copy()
    text_px[..., :3] = 255
    text = Image.fromarray(text_px)
    text = text.crop(text.getbbox())

    # 마크 + 글자를 원본 간격 그대로 한 장에
    gap = 40
    h = max(mark.height, text.height)
    logo = Image.new('RGBA', (mark.width + gap + text.width, h))
    logo.alpha_composite(mark, (0, (h - mark.height) // 2))
    logo.alpha_composite(text, (mark.width + gap, (h - text.height) // 2 + 4))

    OUT.mkdir(parents=True, exist_ok=True)
    mark.save(OUT / 'pebble-mark.png', optimize=True)
    logo.resize((logo.width // 2, logo.height // 2), Image.LANCZOS).save(OUT / 'pebble-logo.png', optimize=True)
    # 파비콘: 정사각형 여백
    side = max(mark.size)
    fav = Image.new('RGBA', (side, side))
    fav.alpha_composite(mark, ((side - mark.width) // 2, (side - mark.height) // 2))
    fav.resize((64, 64), Image.LANCZOS).save(ROOT / 'public/favicon.png', optimize=True)
    print('mark', mark.size, 'logo', logo.size)


if __name__ == '__main__':
    main(sys.argv[1])
