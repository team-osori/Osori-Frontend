import { icons, type IconName } from '../../../assets/icons'

type IconProps = { name: IconName; className?: string }

/** Figma에서 내려받은 SVG 아이콘. 크기는 SVG 원본 width/height를 따릅니다. */
export function Icon({ name, className }: IconProps) {
  return (
    <img
      src={icons[name]}
      alt=""
      aria-hidden
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    />
  )
}
