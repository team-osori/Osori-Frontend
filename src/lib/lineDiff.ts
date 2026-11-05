import type { DiffLine } from '../components/ui'

/**
 * 두 글의 줄 단위 차이 (가장 긴 공통 부분열). 프롬프트처럼 수백 줄 이내의 글을 비교할 때 씁니다.
 * 줄 번호는 새 글 기준이고, 지운 줄은 바로 앞 새 줄의 번호를 씁니다.
 */
export function lineDiff(before: string, after: string): DiffLine[] {
  const a = before.split('\n')
  const b = after.split('\n')
  const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])

  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      out.push({ number: j + 1, text: b[j], type: 'same' })
      i++
      j++
    } else if (j < b.length && (i >= a.length || lcs[i][j + 1] >= lcs[i + 1][j])) {
      out.push({ number: j + 1, text: b[j], type: 'added' })
      j++
    } else {
      out.push({ number: Math.max(1, j), text: a[i], type: 'removed' })
      i++
    }
  }
  return out
}
