import { useState } from 'react'
import { Button } from '../components/ui'
import { PageHeader, ProjectSidebar } from '../components/common'
import { AppLayout } from '../layouts/AppLayout'
import { ReevaluationBar } from '../features/improvement/ReevaluationBar'
import { MOCK_IMPROVEMENT_PLAN } from '../features/improvement/mock'
import type { ImprovementPlan, ReevaluationScope } from '../features/improvement/types'
import { PromptDiffCard } from '../features/improvement/PromptDiffCard'
import { SuggestionsCard } from '../features/improvement/SuggestionsCard'
import { ReevaluationScopeCard } from '../features/improvement/ReevaluationScopeCard'
import styles from './ImprovementApplyPage.module.css'

const user = { name: '김QA', role: '어드민' }

type ImprovementApplyPageProps = {
  projectName?: string
  plan?: ImprovementPlan
  /** v4를 저장만 하고 재평가는 실행하지 않음 */
  onSaveOnly?: (result: ImprovementApplyResult) => void
  /** v4 저장 후 재평가 실행 */
  onReevaluate?: (result: ImprovementApplyResult) => void
  onBack?: () => void
  onSelectStep?: (index: number) => void
}

/** 저장·재평가 시 상위로 전달하는 선택 결과 */
export type ImprovementApplyResult = {
  appliedSuggestionIds: string[]
  scope: ReevaluationScope
  versionMemo: string
}

/** 평가 7단계 · 개선안 적용 */
export default function ImprovementApplyPage({
  projectName = '모아몰 CS 챗봇',
  plan = MOCK_IMPROVEMENT_PLAN,
  onSaveOnly,
  onReevaluate,
  onBack,
  onSelectStep,
}: ImprovementApplyPageProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(plan.suggestions.filter((s) => s.defaultChecked).map((s) => s.id)),
  )
  const [scope, setScope] = useState<ReevaluationScope>(plan.scope)
  const [memo, setMemo] = useState(plan.versionMemo)

  const toggleSuggestion = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const result = (): ImprovementApplyResult => ({
    appliedSuggestionIds: [...selected],
    scope,
    versionMemo: memo,
  })

  return (
    <AppLayout
      sidebar={
        <ProjectSidebar
          user={user}
          projectName={projectName}
          promptOptions={[{ value: plan.toVersion, label: `${plan.toVersion} (최신)` }]}
          promptValue={plan.toVersion}
          onPromptChange={() => {}}
          questionSet={`v1 · ${plan.allCount}문항`}
          currentStep={7}
          onBack={onBack}
          onSelectStep={onSelectStep}
        />
      }
    >
      <div className={styles.page}>
        <PageHeader title="개선안 적용" />
        <div className={styles.grid}>
          <div className={styles.column}>
            <PromptDiffCard
              fromVersion={plan.fromVersion}
              toVersion={plan.toVersion}
              changedLines={plan.changedLines}
              diff={plan.diff}
            />
          </div>
          <div className={styles.column}>
            <SuggestionsCard
              suggestions={plan.suggestions}
              selected={selected}
              onToggle={toggleSuggestion}
              unresolvedNote={plan.unresolvedNote}
              onConfirmSettings={() => {}}
            />
            <ReevaluationScopeCard
              scope={scope}
              onScopeChange={setScope}
              allCount={plan.allCount}
              failedCount={plan.failedCount}
              fromVersion={plan.fromVersion}
              memo={memo}
              onMemoChange={setMemo}
            />
          </div>
        </div>
        <ReevaluationBar status={`${plan.fromVersion}과 ${plan.toVersion}를 같은 질문 세트로 비교합니다`}>
          <Button variant="secondary" onClick={() => onSaveOnly?.(result())}>
            {plan.toVersion} 저장만
          </Button>
          <Button icon="sparkle" onClick={() => onReevaluate?.(result())}>
            {plan.toVersion}로 재평가 실행
          </Button>
        </ReevaluationBar>
      </div>
    </AppLayout>
  )
}
