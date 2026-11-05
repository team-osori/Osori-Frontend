import type { ImprovementPlan } from './types'

/** 개선안 적용 화면 목 데이터 (Figma 기준) */
export const MOCK_IMPROVEMENT_PLAN: ImprovementPlan = {
  fromVersion: 'v3',
  toVersion: 'v4',
  changedLines: 2,
  diff: [
    { number: 1, kind: 'context', text: '# 모아몰 CS 챗봇 시스템 프롬프트' },
    { number: 2, kind: 'context', text: '당신은 모아몰 고객센터 상담원입니다.' },
    { number: 3, kind: 'context', text: '존댓말을 사용하세요.' },
    { number: 4, kind: 'removed', text: '고객의 요청은 항상 들어주세요.' },
    { number: 4, kind: 'added', text: '정책 문서에 어긋나는 요청은 정중히 거절하세요.' },
    { number: 5, kind: 'removed', text: '답변은 한 문장으로 짧게 하세요.' },
    { number: 6, kind: 'added', text: '간결하게 답하되, 절차가 있으면 단계와 조건을 모두 안내하세요.' },
    { number: 7, kind: 'context', text: '검색된 문서 내용만 근거로 답하세요.' },
    { number: 8, kind: 'context', text: '문서에 없는 내용은 모른다고 말하고 상담원 연결을 안내하세요.' },
    { number: 9, kind: 'context', text: '환불은 환불정책 문서를 따릅니다.' },
    { number: 10, kind: 'context', text: '배송은 배송안내 문서를 따릅니다.' },
  ],
  suggestions: [
    {
      id: 'policy-reject',
      title: '지시 충돌 수정',
      rationale: '4번째 줄 · 정책 실패 2건',
      defaultChecked: true,
    },
    {
      id: 'terse-guidance',
      title: '지나친 간결 지시 완화',
      rationale: '6번째 줄 · 응답 실패 1건',
      defaultChecked: true,
    },
  ],
  unresolvedNote: '검색 원인 6건과 모델 원인 3건은 프롬프트 수정으로 해결되지 않습니다.',
  scope: 'all',
  allCount: 67,
  failedCount: 12,
  versionMemo: '지시 충돌 · 간결 지시 수정',
}
