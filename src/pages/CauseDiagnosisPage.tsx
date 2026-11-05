import { useMemo, useState } from 'react'
import { Button, FilterChips } from '../components/ui'
import { ActionBar, PageHeader, ProjectSidebar } from '../components/common'
import { AppLayout } from '../layouts/AppLayout'
import { CauseCard } from '../features/grading/CauseCard'
import { CAUSE_INFO, CAUSE_ORDER } from '../features/grading/causes'
import { MOCK_DIAGNOSES, MOCK_GRADING_SUMMARY } from '../features/grading/mock'
import type { DiagnosisCause, FailureCause } from '../features/grading/types'
import styles from '../features/grading/diagnosis.module.css'

const user = { name: '김QA', role: '어드민' }

type Filter = 'all' | FailureCause

type CauseDiagnosisPageProps = {
  projectName?: string
  items?: DiagnosisCause[]
  /** 필터에 보여줄 원인별 실패 건수. 06 자동 채점 결과의 가장 최근 버전 분포와 같은 값 */
  failureCounts?: Record<FailureCause, number>
  /** 선택한 제안으로 새 프롬프트 버전을 만들고 개선안 적용 화면으로 */
  onApply?: (selectedIds: string[]) => void
  onBack?: () => void
}

/** 평가 6단계 · 원인 진단 */
export default function CauseDiagnosisPage({
  projectName = '모아몰 CS 챗봇',
  items: initialItems = MOCK_DIAGNOSES,
  failureCounts = MOCK_GRADING_SUMMARY.failures[MOCK_GRADING_SUMMARY.failures.length - 1].counts,
  onApply,
  onBack,
}: CauseDiagnosisPageProps) {
  // TODO: 진단 API 연동. 지금은 화면 안에서만 반영
  const [items, setItems] = useState(initialItems)
  const [filter, setFilter] = useState<Filter>('all')
  const versions = MOCK_GRADING_SUMMARY.versions
  const [baseVersion, setBaseVersion] = useState(versions[0]?.version ?? '')
  // 프롬프트 수정 제안을 고른 카드. Figma 기본 화면처럼 처음에는 제안 가능한 카드를 모두 골라 둠
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialItems.filter((i) => i.diff).map((i) => i.id)),
  )

  const totalFailures = CAUSE_ORDER.reduce((sum, cause) => sum + failureCounts[cause], 0)
  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.cause === filter)),
    [items, filter],
  )
  const selectedCount = items.filter((i) => selected.has(i.id)).length

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  /** 무시하면 목록에서 빼고 선택도 해제 */
  const ignore = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  return (
    <AppLayout
      sidebar={
        <ProjectSidebar
          user={user}
          projectName={projectName}
          promptVersions={versions}
          promptValue={baseVersion}
          onPromptChange={setBaseVersion}
          questionSet="v1 · 67문항"
          currentStep={6}
          unlockedUntil={7}
          onBack={onBack}
        />
      }
      footer={
        <ActionBar
          summary={
            <>
              프롬프트 수정 제안 <b>{selectedCount}개</b> 선택됨
            </>
          }
        >
          <Button iconEnd="arrowRight" disabled={selectedCount === 0} onClick={() => onApply?.([...selected])}>
            v4 만들고 개선안 적용으로
          </Button>
        </ActionBar>
      }
    >
      <div className={styles.page}>
        <PageHeader title="원인 진단" />

        <div className={styles.filters}>
          <FilterChips<Filter>
            ariaLabel="원인 필터"
            size="lg"
            value={filter}
            onChange={setFilter}
            items={[
              { value: 'all', label: '전체', icon: 'layoutGridDark', count: totalFailures },
              ...CAUSE_ORDER.map((cause) => ({
                value: cause as Filter,
                label: CAUSE_INFO[cause].label,
                icon: ({ retrieval: 'databaseAccent', prompt: 'messageAccent', model: 'cpuAmber' } as const)[cause],
                count: failureCounts[cause],
              })),
            ]}
          />
        </div>

        {visible.length === 0 ? (
          <p className={styles.empty}>진단할 항목이 없습니다.</p>
        ) : (
          <div className={styles.grid}>
            {visible.map((item) => (
              <CauseCard key={item.id} item={item} selected={selected.has(item.id)} onToggle={toggle} onIgnore={ignore} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
