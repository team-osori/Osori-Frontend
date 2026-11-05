import { useRef } from 'react'
import { cx } from '../../lib/cx'
import { Button, Icon, Modal, MultiSelect, StatTile, Sticker, type SelectOption } from '../../components/ui'
import { QUESTION_TYPES, type DraftCounts, type QuestionType } from './types'
import styles from './start.module.css'

/** 숨겨진 파일 입력으로 CSV 고르기 */
export function useCsvPicker(onFiles: (files: File[]) => void) {
  const inputRef = useRef<HTMLInputElement>(null)
  const input = (
    <input
      ref={inputRef}
      type="file"
      accept=".csv"
      hidden
      onChange={(e) => {
        const files = Array.from(e.target.files ?? [])
        e.target.value = ''
        if (files.length) onFiles(files)
      }}
    />
  )
  return { open: () => inputRef.current?.click(), input }
}

function Checks({ items }: { items: string[] }) {
  return (
    <ul className={styles.checks}>
      {items.map((item) => (
        <li key={item}>
          <Icon name="checkAccent" />
          {item}
        </li>
      ))}
    </ul>
  )
}

type StartChoicesProps = {
  onDraft: () => void
  onUpload: () => void
}

/** 05 시험지가 없을 때: 문제를 넣는 두 가지 방법 */
export function StartChoices({ onDraft, onUpload }: StartChoicesProps) {
  return (
    <div className={styles.choices}>
      <section className={cx(styles.choice, styles.recommended)}>
        <div className={styles.choiceTop}>
          <Sticker name="sparkle" width={34} />
          <span className={styles.tag}>추천</span>
        </div>
        <h2 className={styles.choiceTitle}>정책 문서로 자동 생성</h2>
        <p className={styles.choiceDesc}>
          올려 둔 정책 문서를 읽고 평가용 문제를 만듭니다. 문제마다 근거 문서가 함께 붙습니다.
        </p>
        <Checks items={['근거 문서 자동 연결', '유형별 개수 조절']} />
        <Button fullWidth size="sm" iconEnd="arrowRight" className={styles.choiceAction} onClick={onDraft}>
          문서 고르고 생성하기
        </Button>
      </section>

      <section className={styles.choice}>
        <div className={styles.choiceTop}>
          <Sticker name="folder" width={52} />
        </div>
        <h2 className={styles.choiceTitle}>가진 질문 올리기</h2>
        <p className={styles.choiceDesc}>
          이미 모아 둔 실제 고객 질문을 CSV 파일로 올립니다. 근거는 검토할 때 연결합니다.
        </p>
        <Checks items={['실제 고객 질문 그대로 사용', '필요한 열 · 질문, 유형, 모범 답안']} />
        <Button fullWidth size="sm" variant="tonal" icon="upload" className={styles.choiceAction} onClick={onUpload}>
          CSV 파일 선택
        </Button>
      </section>
    </div>
  )
}

const TYPE_GUIDE: Record<QuestionType, { desc: string; check: string }> = {
  정상: { desc: '문서에 답이 있는 질문', check: '답을 정확히 하는지 봅니다' },
  모호: { desc: '의도가 분명하지 않은 질문', check: '되물어서 확인하는지 봅니다' },
  '문서에 없음': { desc: '문서에 답이 없는 질문', check: '모른다고 말하는지 봅니다' },
  '정책 함정': { desc: '들어줄 수 없는 요청', check: '정중히 거절하는지 봅니다' },
}

/** 문제 유형 4가지 안내 */
export function TypeGuide() {
  return (
    <ul className={styles.types} aria-label="문제 유형">
      {QUESTION_TYPES.map((type) => (
        <li key={type} className={styles.type}>
          <strong className={styles.typeName}>{type}</strong>
          <span className={styles.typeDesc}>{TYPE_GUIDE[type].desc}</span>
          <span className={styles.typeCheck}>→ {TYPE_GUIDE[type].check}</span>
        </li>
      ))}
    </ul>
  )
}

type DraftModalProps = {
  open: boolean
  onClose: () => void
  docOptions: SelectOption[]
  docs: string[]
  onDocsChange: (docs: string[]) => void
  counts: DraftCounts
  onCountsChange: (counts: DraftCounts) => void
  generating: boolean
  onGenerate: () => void
}

/** 정책 문서와 유형별 개수를 골라 문제 초안 만들기 */
export function DraftModal({
  open,
  onClose,
  docOptions,
  docs,
  onDocsChange,
  counts,
  onCountsChange,
  generating,
  onGenerate,
}: DraftModalProps) {
  const total = QUESTION_TYPES.reduce((sum, t) => sum + counts[t], 0)
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="정책 문서로 자동 생성"
      decoration={<Sticker name="sparkle" width={22} />}
      actions={
        <>
          <Button variant="tonal" size="xs" onClick={onClose}>
            취소
          </Button>
          <Button size="xs" icon="sparkleSm" onClick={onGenerate} disabled={generating || total === 0 || docs.length === 0}>
            {generating ? '만드는 중…' : `문제 ${total}개 만들기`}
          </Button>
        </>
      }
    >
      <div className={styles.modalField}>
        <span className={styles.modalLabel}>정책 문서</span>
        <MultiSelect
          icon="file"
          ariaLabel="문제를 만들 정책 문서"
          placeholder="정책 문서를 선택하세요"
          options={docOptions}
          value={docs}
          onChange={onDocsChange}
          summary={(selected) =>
            selected.length > 1 ? `${selected[0].label} 외 ${selected.length - 1}개 문서` : selected[0].label
          }
        />
      </div>
      <div className={styles.modalField}>
        <span className={styles.modalLabel}>유형별 개수</span>
        <div className={styles.tiles}>
          {QUESTION_TYPES.map((type) => (
            <StatTile
              key={type}
              label={type}
              value={counts[type]}
              max={200}
              onChange={(n) => onCountsChange({ ...counts, [type]: n })}
            />
          ))}
        </div>
      </div>
    </Modal>
  )
}
