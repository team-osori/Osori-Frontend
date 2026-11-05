import type { QuestionInput, TestQuestion } from './testsetApi'
import { CATEGORY_LABEL, type EvidenceOption, type Question, type QuestionStatus } from './types'

const STATUS: Record<TestQuestion['reviewStatus'], QuestionStatus> = {
  approved: 'approved',
  pending: 'pending',
  rejected: 'deleted',
}

export const evidenceKey = (policyVersionId: string, ruleKey: string) => `${policyVersionId}:${ruleKey}`

/** 서버 질문 → 검토 화면용. options는 근거 표시 이름을 찾는 데 씁니다(없으면 규칙 key를 그대로 보여줌). */
export function toQuestion(raw: TestQuestion, options: Map<string, EvidenceOption>): Question {
  const evidence = raw.policyVersionId ? raw.ruleKeys.map((key) => evidenceKey(raw.policyVersionId!, key)) : []
  const category = raw.category ?? 'normal'
  return {
    id: raw.id,
    text: raw.question,
    category,
    typeLabel: CATEGORY_LABEL[category],
    evidence,
    evidenceLabels: evidence.map((value) => options.get(value)?.label ?? value.split(':')[1]),
    expected: raw.modelAnswer ?? raw.expectedBehavior ?? '',
    status: STATUS[raw.reviewStatus],
    raw,
  }
}

/** 질문 수정(PATCH)은 전체 값을 보내야 해서, 서버 원본에서 응답 전용 항목만 빼고 그대로 옮깁니다. */
export function inputOf(raw: TestQuestion): QuestionInput {
  return {
    question: raw.question,
    expectedBehavior: raw.expectedBehavior ?? null,
    modelAnswer: raw.modelAnswer ?? null,
    forbiddenBehaviors: raw.forbiddenBehaviors ?? [],
    policyVersionId: raw.policyVersionId ?? null,
    ruleKeys: raw.ruleKeys ?? [],
    evidenceQuote: raw.evidenceQuote ?? null,
    category: raw.category ?? 'normal',
    expectedConditions: raw.expectedConditions ?? null,
  }
}

export type QuestionEdit = {
  text: string
  category: Question['category']
  /** EvidenceOption.value 목록. 한 정책 버전의 규칙만 함께 연결할 수 있음 */
  evidence: string[]
  expected: string
}

/**
 * 화면에서 고친 값으로 수정 요청 본문을 만듭니다.
 *
 * 근거는 정책 버전 · 규칙 key · 원문 인용을 한 번에 바꿔야 해서(서버 규칙), 근거가 바뀌면 판정 조건(expectedConditions)을
 * 비워 보내 서버가 기대 행동과 새 근거로 다시 만들게 합니다. 근거가 그대로면 조건도 그대로 둡니다.
 */
export function editInput(raw: TestQuestion, edit: QuestionEdit, options: Map<string, EvidenceOption>): QuestionInput {
  const base = inputOf(raw)
  const picked = edit.evidence.map((value) => options.get(value)).filter((o): o is EvidenceOption => Boolean(o))
  const before = raw.policyVersionId ? raw.ruleKeys.map((key) => evidenceKey(raw.policyVersionId!, key)) : []
  const evidenceChanged = before.join('|') !== edit.evidence.join('|')
  const modelAnswer = edit.expected.trim() || null

  return {
    ...base,
    question: edit.text.trim(),
    category: edit.category,
    modelAnswer,
    // 기대 행동이 없던 질문(CSV)은 모범 답안을 처음 기대 행동으로 씀
    expectedBehavior: base.expectedBehavior ?? modelAnswer,
    ...(evidenceChanged
      ? picked.length > 0
        ? {
            policyVersionId: picked[0].policyVersionId,
            ruleKeys: picked.map((o) => o.ruleKey),
            evidenceQuote: picked[0].sourceQuote,
            expectedConditions: null,
          }
        : { policyVersionId: null, ruleKeys: [], evidenceQuote: null, expectedConditions: null }
      : {}),
  }
}
