import type { CSSProperties } from 'react'
import binderClip from '../../../assets/stickers/binder-clip.png'
import checkCircle from '../../../assets/stickers/check-circle.png'
import cursor from '../../../assets/stickers/cursor.png'
import folder from '../../../assets/stickers/folder.png'
import highlighter from '../../../assets/stickers/highlighter.png'
import notepad from '../../../assets/stickers/notepad.png'
import paper from '../../../assets/stickers/paper.png'
import paperclipLime from '../../../assets/stickers/paperclip-lime.png'
import paperclipSilver from '../../../assets/stickers/paperclip-silver.png'
import sparkle from '../../../assets/stickers/sparkle.png'
import squiggle from '../../../assets/stickers/squiggle.png'
import star from '../../../assets/stickers/star.png'
import stickyNote from '../../../assets/stickers/sticky-note.png'

/** scripts/cut-stickers.py로 자른 일러스트 */
const STICKERS = {
  binderClip,
  checkCircle,
  cursor,
  folder,
  highlighter,
  notepad,
  paper,
  paperclipLime,
  paperclipSilver,
  sparkle,
  squiggle,
  star,
  stickyNote,
}

export type StickerName = keyof typeof STICKERS

/** motion.css의 data-motion 이름 */
export type Motion = 'rise' | 'fade' | 'pop' | 'float' | 'sway' | 'twinkle'

type StickerProps = {
  name: StickerName
  /** 움직임 (motion.css) */
  motion?: Motion
  /** 기울기(도). 움직이는 동안에도 유지 */
  rot?: number
  /** 움직임 시작 지연(ms) */
  delay?: number
  /** 표시 폭(px). 높이는 비율대로 */
  width: number
  className?: string
  style?: CSSProperties
}

/** 장식용 일러스트. 스크린리더는 읽지 않음 */
export function Sticker({ name, width, motion, rot, delay, className, style }: StickerProps) {
  const vars = {
    ...(rot != null && { '--rot': `${rot}deg`, transform: `rotate(${rot}deg)` }),
    ...(delay != null && { '--delay': `${delay}ms` }),
    ...style,
  } as CSSProperties
  return (
    <img
      src={STICKERS[name]}
      alt=""
      aria-hidden
      width={width}
      className={className}
      style={vars}
      data-motion={motion}
      draggable={false}
    />
  )
}
