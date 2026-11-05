import { useState } from 'react'
import { Button } from '../components/ui'
import { ActionBar, ProjectSidebar } from '../components/common'
import { AppLayout } from '../layouts/AppLayout'
import { JudgeBar } from '../features/grading/JudgeBar'
import { JudgeDetail } from '../features/grading/JudgeDetail'
import { MOCK_JUDGE_ITEMS } from '../features/grading/mock'
import { QueuePanel } from '../features/grading/QueuePanel'
import type { JudgeItem } from '../features/grading/types'
import { useJudgeShortcuts } from '../features/grading/useJudgeShortcuts'
import styles from '../features/grading/judge.module.css'

const user = { name: '김QA', role: '어드민' }

type HumanJudgePageProps = {
  projectName?: string
  items?: JudgeItem[]
  /** 처음에 보여줄 문항. 없으면 판정 중인 문항, 그것도 없으면 첫 문항 */
  initialId?: string
  /** 모든 문항을 판정한 뒤 다음 단계(원인 진단)로 */
  onFinish?: () => void
  onBack?: () => void
}

/** 평가 5단계 · 사람 판정 */
export default function HumanJudgePage({
  projectName = '모아몰 CS 챗봇',
  items: initialItems = MOCK_JUDGE_ITEMS,
  initialId,
  onFinish,
  onBack,
}: HumanJudgePageProps) {
  // TODO: 판정 API 연동. 지금은 화면 안에서만 반영
  const [items, setItems] = useState(initialItems)
  const [selectedId, setSelectedId] = useState(
    () => initialId ?? initialItems.find((i) => i.status === 'judging')?.id ?? initialItems[0]?.id ?? '',
  )

  const index = Math.max(0, items.findIndex((i) => i.id === selectedId))
  const current = items[index]
  const done = items.filter((i) => i.status === 'pass' || i.status === 'fail').length
  const allDone = items.length > 0 && done === items.length

  const go = (delta: number) => {
    const next = items[index + delta]
    if (next) setSelectedId(next.id)
  }

  /** 판정을 기록하고, 아직 판정하지 않은 가장 가까운 다음 문항으로 이동 */
  const judge = (result: 'pass' | 'fail') => {
    if (!current) return
    const updated = items.map((i) => (i.id === current.id ? { ...i, status: result } : i))
    setItems(updated)
    const after = [...updated.slice(index + 1), ...updated.slice(0, index)].find(
      (i) => i.status !== 'pass' && i.status !== 'fail',
    )
    if (after) setSelectedId(after.id)
  }

  useJudgeShortcuts(
    { prev: () => go(-1), next: () => go(1), fail: () => judge('fail'), pass: () => judge('pass') },
    Boolean(current),
  )

  if (!current) return null

  return (
    <AppLayout
      flush
      sidebar={
        <ProjectSidebar
          user={user}
          projectName={projectName}
          promptOptions={[{ value: 'ab', label: 'v1 vs v2' }]}
          promptValue="ab"
          onPromptChange={() => {}}
          questionSet="v1 · 67문항"
          currentStep={5}
          unlockedUntil={6}
          onBack={onBack}
        />
      }
    >
      <div className={styles.layout}>
        <QueuePanel items={items} selectedId={current.id} onSelect={setSelectedId} />
        <div className={styles.detailColumn}>
          <JudgeDetail item={current} />
          {allDone ? (
            <ActionBar summary={<>모든 문항의 판정이 끝났습니다. <b>{items.length}건</b></>}>
              <Button iconEnd="arrowRight" onClick={onFinish}>
                원인 진단으로
              </Button>
            </ActionBar>
          ) : (
            <JudgeBar done={done} total={items.length} onFail={() => judge('fail')} onPass={() => judge('pass')} />
          )}
        </div>
      </div>
    </AppLayout>
  )
}
