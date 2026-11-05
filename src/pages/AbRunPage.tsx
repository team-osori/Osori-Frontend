import { useState } from 'react'
import { Button, StatCard } from '../components/ui'
import { ActionBar, PageHeader, ProjectSidebar, type ActionBarStatus } from '../components/common'
import { AppLayout } from '../layouts/AppLayout'
import { ROUTES } from '../routes'
import {
  MOCK_CONCURRENCY,
  MOCK_DIFF,
  MOCK_DIFF_MEMO,
  MOCK_RUN_ROWS,
  MOCK_TOTAL,
  MOCK_V2_DONE,
  MOCK_VERSION_OPTIONS,
  latencyOf,
} from '../features/abRun/mock'
import { useRunSimulation } from '../features/abRun/useRunSimulation'
import { PromptDiffCard, RunProgressCard, VersionCard } from '../features/abRun/RunCards'
import { StopRunModal } from '../features/abRun/StopRunModal'
import styles from './AbRunPage.module.css'

const user = { name: '김QA', role: '어드민' }

type AbRunPageProps = {
  projectName?: string
  questionSet?: string
  /** 문항당 반복 횟수 · 채점자 수 */
  repeats?: number
  graders?: number
  onShowResults?: () => void
  onBack?: () => void
}

/** 평가 3단계 · 프롬프트 A/B 실행 */
export default function AbRunPage({
  projectName = '모아몰 CS 챗봇',
  questionSet = 'v1 · 67문항',
  repeats = 3,
  graders = 2,
  onShowResults,
  onBack,
}: AbRunPageProps) {
  const [versions, setVersions] = useState({ base: 'v1', candidate: 'v2' })
  const [stopOpen, setStopOpen] = useState(false)
  const run = useRunSimulation({ total: MOCK_TOTAL, initialDone: MOCK_V2_DONE, concurrency: MOCK_CONCURRENCY })

  const status: ActionBarStatus =
    run.state === 'running'
      ? { tone: 'primary', label: `실행 중 · 약 ${run.remainingMinutes}분 남음` }
      : run.state === 'stopped'
        ? { tone: 'neutral', label: `중단됨 · ${run.done} / ${MOCK_TOTAL}` }
        : { tone: 'success', label: '실행 완료' }

  return (
    <AppLayout
      sidebar={
        <ProjectSidebar
          user={user}
          projectName={projectName}
          promptOptions={[{ value: 'ab', label: `${versions.base} vs ${versions.candidate}` }]}
          promptValue="ab"
          onPromptChange={() => {}}
          questionSet={questionSet}
          current={ROUTES.abRun}
          onBack={onBack}
        />
      }
      footer={
        <ActionBar status={status}>
          {run.state === 'running' && (
            <Button variant="tonal" onClick={() => setStopOpen(true)}>
              중단
            </Button>
          )}
          {run.state === 'stopped' && (
            <Button variant="tonal" onClick={run.resume}>
              이어서 실행
            </Button>
          )}
          <Button disabled={run.state !== 'finished'} onClick={onShowResults}>
            채점 결과 보기
          </Button>
        </ActionBar>
      }
    >
      <div className={styles.page}>
        <PageHeader title="프롬프트 A/B 실행" />

        <div className={styles.summary}>
          <VersionCard
            options={MOCK_VERSION_OPTIONS}
            base={versions.base}
            candidate={versions.candidate}
            onChange={(patch) => setVersions((v) => ({ ...v, ...patch }))}
          />
          <StatCard label="질문 세트" value={questionSet} />
          <StatCard label="반복 실행 · 채점자" value={`문항당 ${repeats}회 · ${graders}명`} />
        </div>

        <div className={styles.body}>
          <RunProgressCard
            total={MOCK_TOTAL}
            versions={[
              { version: versions.base, label: '완료', done: MOCK_TOTAL, tone: 'muted' },
              {
                version: versions.candidate,
                label: run.state === 'finished' ? '완료' : run.state === 'stopped' ? '중단됨' : '답변 수집 중',
                done: run.done,
                tone: 'primary',
              },
            ]}
            rows={MOCK_RUN_ROWS}
            statusOf={(row, version) => (version === 0 ? 'done' : run.statusOf(row.order))}
            latencyOf={(row) => (run.statusOf(row.order) === 'done' ? latencyOf(row.order) : null)}
          />
          <PromptDiffCard from={versions.base} to={versions.candidate} lines={MOCK_DIFF} memo={MOCK_DIFF_MEMO} />
        </div>
      </div>

      {/* 실행이 먼저 끝나면 모달도 닫힘 */}
      <StopRunModal
        open={stopOpen && run.state === 'running'}
        onClose={() => setStopOpen(false)}
        version={versions.candidate}
        done={run.done}
        total={MOCK_TOTAL}
        onStop={() => {
          run.stop()
          setStopOpen(false)
        }}
      />
    </AppLayout>
  )
}
