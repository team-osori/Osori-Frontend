import { useState, type CSSProperties } from 'react'
import { Button } from '../components/ui'
import { ActionBar, PageHeader, ProjectSidebar } from '../components/common'
import { AppLayout } from '../layouts/AppLayout'
import { ROUTES } from '../routes'
import { ConfidenceBar } from '../features/grading/ConfidenceBar'
import { FailureChart } from '../features/grading/FailureChart'
import { MetricCard } from '../features/grading/MetricCards'
import { MOCK_GRADING_SUMMARY, MOCK_UNSTABLE_ITEMS } from '../features/grading/mock'
import type { GradingSummary, UnstableItem } from '../features/grading/types'
import { UnstableDrawer } from '../features/grading/UnstableDrawer'
import { VersionList } from '../features/grading/VersionList'
import styles from '../features/grading/grading.module.css'


type GradingResultsPageProps = {
  summary?: GradingSummary
  unstableItems?: UnstableItem[]
  /** 사람 판정 화면으로 이동 (문항을 고르면 그 문항부터) */
  onJudge?: (item?: UnstableItem) => void
  onBack?: () => void
}

/** 평가 4단계 · 자동 채점 결과 */
export default function GradingResultsPage({
  summary = MOCK_GRADING_SUMMARY,
  unstableItems = MOCK_UNSTABLE_ITEMS,
  onJudge,
  onBack,
}: GradingResultsPageProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  // TODO: 기준 버전을 바꾸면 그 버전 기준으로 결과를 다시 불러오기 (API 연동 후)
  const [baseVersion, setBaseVersion] = useState(summary.versions[0]?.version ?? '')
  const { queue } = summary

  // 가장 최근 두 버전의 프롬프트 원인 실패 건수로 해설 문장을 만듦
  const [before, after] = summary.failures.slice(-2)
  const note =
    before && after
      ? `${after.version}에서 프롬프트 원인 실패가 ${before.counts.prompt}건 → ${after.counts.prompt}건으로 줄었습니다. 남은 검색 원인 ${after.counts.retrieval}건은 프롬프트로 해결되지 않으니 검색 설정을 확인하세요.`
      : undefined

  return (
    <AppLayout
      sidebar={
        <ProjectSidebar
          promptVersions={summary.versions}
          promptValue={baseVersion}
          onPromptChange={setBaseVersion}
          current={ROUTES.grading}
          unlockedUntil={3}
          onBack={onBack}
        />
      }
      footer={
        <ActionBar
          summary={
            <>
              사람 판정 대기 <b>{queue.total}건</b> · 채점자 의견 갈림 {queue.split} · 불안정 {queue.unstable} · 합의 샘플{' '}
              {queue.sample}
            </>
          }
        >
          <Button iconEnd="arrowRight" onClick={() => onJudge?.()}>
            사람 판정으로
          </Button>
        </ActionBar>
      }
    >
      <div className={styles.page} data-motion="stagger" style={{ '--stagger': '90ms' } as CSSProperties}>
        <PageHeader title="자동 채점 결과" />

        <ConfidenceBar
          agreement={summary.agreement}
          unstableCount={summary.unstableCount}
          labeledCount={summary.labeledCount}
          totalCount={summary.totalCount}
          onShowUnstable={unstableItems.length > 0 ? () => setDrawerOpen(true) : undefined}
        />

        <ul className={styles.metrics} style={{ '--i': 2 } as CSSProperties} data-motion="stagger">
          {summary.metrics.map((metric, i) => (
            <li key={metric.key} style={{ '--i': i, '--delay': '260ms' } as CSSProperties}>
              <MetricCard metric={metric} index={i} />
            </li>
          ))}
        </ul>

        <div className={styles.lower} style={{ '--i': 3 } as CSSProperties}>
          <FailureChart rows={summary.failures} note={note} />
          <VersionList versions={summary.versions} />
        </div>
      </div>

      <UnstableDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={unstableItems}
        onJudge={(item) => {
          setDrawerOpen(false)
          onJudge?.(item)
        }}
      />
    </AppLayout>
  )
}
