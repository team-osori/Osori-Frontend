/**
 * 화면 폭에 맞춰 앱 전체 배율(--app-zoom)을 정합니다.
 *
 * 시안은 1512px 폭 기준입니다. 글자 · 간격이 px로 고정돼 있어서, 브라우저 배율을 80%로 줄이면
 * 모두 작아지고 큰 모니터에서는 여백만 늘어납니다. 화면 폭 / 1512 만큼 #root를 키우거나 줄여
 * 어떤 화면에서도 시안과 비슷한 비율로 보이게 합니다.
 *
 * - 좁은 화면(태블릿 · 휴대폰)은 각 화면의 반응형 배치를 쓰므로 배율 1
 * - 너무 작거나 커지지 않게 0.9 ~ 1.4 사이로 제한
 */

const DESIGN_WIDTH = 1512
const RESPONSIVE_BELOW = 1024
const MIN = 0.9
const MAX = 1.4

export function appZoom(width = window.innerWidth) {
  if (width < RESPONSIVE_BELOW) return 1
  return Math.min(MAX, Math.max(MIN, width / DESIGN_WIDTH))
}

function apply() {
  document.documentElement.style.setProperty('--app-zoom', appZoom().toFixed(4))
}

/** 처음 한 번 적용하고, 창 크기 · 브라우저 배율이 바뀔 때마다 다시 계산 */
export function startAppScale() {
  apply()
  window.addEventListener('resize', apply)
  return () => window.removeEventListener('resize', apply)
}
