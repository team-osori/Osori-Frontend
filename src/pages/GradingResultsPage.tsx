import { useState } from 'react'
import { Button, Card, Icon } from '../components/ui'
import { PageHeader, ProjectSidebar } from '../components/common'
import { AppLayout } from '../layouts/AppLayout'
import { MOCK_UNSTABLE_ITEMS } from '../features/grading/mock'
import type { UnstableItem } from '../features/grading/types'
import { UnstableDrawer } from '../features/grading/UnstableDrawer'
import styles from '../features/grading/grading.module.css'

const user = { name: '김QA', role: '어드민' }

type GradingResultsPageProps = {
  projectName?: string
  unstableItems?: UnstableItem[]
  /** 사람 판정 화면으로 이동 */
  onJudge?: (item: UnstableItem) => void
  onBack?: () => void
}

/**
 * 평가 4단계 · 자동 채점 결과
 * 화면 본문 디자인이 나오기 전까지는 불안정 문항 안내와 패널만 보여주는 임시 구성입니다.
 */
export default function GradingResultsPage({
  projectName = '모아몰 CS 챗봇',
  unstableItems = MOCK_UNSTABLE_ITEMS,
  onJudge,
  onBack,
}: GradingResultsPageProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <AppLayout
      sidebar={
        <ProjectSidebar
          user={user}
          projectName={projectName}
          promptOptions={[{ value: 'v3', label: 'v3 (최신)' }]}
          promptValue="v3"
          onPromptChange={() => {}}
          questionSet="v1 · 67문항"
          currentStep={4}
          unlockedUntil={6}
          onBack={onBack}
        />
      }
    >
      <PageHeader title="자동 채점 결과" />
      {unstableItems.length > 0 && (
        <Card className={styles.callout}>
          <div className={styles.calloutText}>
            <h2 className={styles.calloutTitle}>
              <Icon name="warningLg" />
              불안정 문항 {unstableItems.length}
            </h2>
            <p className={styles.calloutDesc}>반복했을 때 판정이 달라진 문항은 사람 판정 대기열로 보냈습니다.</p>
          </div>
          <Button variant="tonal" size="sm" onClick={() => setDrawerOpen(true)}>
            문항 보기
          </Button>
        </Card>
      )}

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
