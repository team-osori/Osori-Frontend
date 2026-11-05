import { QUESTION_TYPES, type Question, type QuestionType } from './types'

/** 따옴표("...")와 줄바꿈이 들어간 칸을 지원하는 간단한 CSV 파서 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        quoted = false
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      if (row.some((c) => c.trim() !== '')) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += ch
    }
  }
  row.push(cell)
  if (row.some((c) => c.trim() !== '')) rows.push(row)
  return rows
}

const TYPE_ALIASES: Record<string, QuestionType> = {
  normal: '정상',
  ambiguous: '모호',
  out_of_docs: '문서에 없음',
  not_in_docs: '문서에 없음',
  policy_trap: '정책 함정',
}

function toType(value: string): QuestionType {
  const v = value.trim()
  if ((QUESTION_TYPES as readonly string[]).includes(v)) return v as QuestionType
  return TYPE_ALIASES[v.toLowerCase()] ?? '정상'
}

export type CsvImportResult = { questions: Question[]; error?: string }

/** question, type, expected 열이 있는 CSV를 미검토 질문으로 변환 */
export function questionsFromCsv(text: string): CsvImportResult {
  const [header, ...rows] = parseCsv(text.replace(/^﻿/, ''))
  if (!header) return { questions: [], error: '빈 파일입니다.' }

  const cols = header.map((h) => h.trim().toLowerCase())
  const qi = cols.indexOf('question')
  const ti = cols.indexOf('type')
  const ei = cols.indexOf('expected')
  if (qi < 0 || ti < 0 || ei < 0) return { questions: [], error: 'question, type, expected 열이 필요합니다.' }

  const stamp = Date.now()
  const questions = rows
    .filter((r) => r[qi]?.trim())
    .map<Question>((r, i) => ({
      id: `csv-${stamp}-${i}`,
      text: r[qi].trim(),
      type: toType(r[ti] ?? ''),
      source: '직접 업로드',
      chunks: [],
      expected: (r[ei] ?? '').trim(),
      status: 'pending',
    }))
  return { questions }
}
