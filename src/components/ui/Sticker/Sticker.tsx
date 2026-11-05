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

type StickerProps = {
  name: StickerName
  /** 표시 폭(px). 높이는 비율대로 */
  width: number
  className?: string
  style?: CSSProperties
}

/** 장식용 일러스트. 스크린리더는 읽지 않음 */
export function Sticker({ name, width, className, style }: StickerProps) {
  return <img src={STICKERS[name]} alt="" aria-hidden width={width} className={className} style={style} draggable={false} />
}
