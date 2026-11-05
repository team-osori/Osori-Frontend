import { Icon, StatusBadge, Tag } from '../../components/ui'
import { cx } from '../../lib/cx'
import { REASON_INFO } from './judgeInfo'
import type { JudgeItem } from './types'
import styles from './judge.module.css'

/** 판정할 문항의 상세: 버전별 답변 · 검색된 근거 청크 · 자동 채점자 판정 */
export function JudgeDetail({ item }: { item: JudgeItem }) {
  return (
    <article className={styles.detail} aria-labelledby="judge-question">
      <div className={styles.tags}>
        {item.tags.map((tag) => (
          <StatusBadge key={tag}>{tag}</StatusBadge>
        ))}
        <StatusBadge tone={REASON_INFO[item.reason].tone}>{REASON_INFO[item.reason].detail}</StatusBadge>
      </div>

      <h2 id="judge-question" className={styles.question}>
        {item.question}
      </h2>

      <h3 className={styles.sectionLabel}>버전별 답변</h3>
      <div className={styles.answers}>
        <section className={styles.answer}>
          <Tag>{item.baseAnswer.version}</Tag>
          <p className={styles.answerText}>{item.baseAnswer.text}</p>
        </section>
        <section className={cx(styles.answer, styles.answerTarget)}>
          <Tag tone="primary">{item.targetAnswer.version} · 판정 대상</Tag>
          <p className={styles.answerText}>{item.targetAnswer.text}</p>
        </section>
      </div>

      <div className={styles.evidence}>
        <section>
          <h3 className={styles.sectionLabel}>검색된 근거 청크</h3>
          {item.chunks.length === 0 ? (
            <p className={styles.empty}>검색된 청크가 없습니다.</p>
          ) : (
            <ul className={styles.cards}>
              {item.chunks.map((chunk) => (
                <li key={chunk.id} className={styles.card}>
                  <span className={styles.chunkSource}>
                    <Icon name="fileSm" />
                    {chunk.source}
                  </span>
                  <p className={styles.cardText}>{chunk.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className={styles.sectionLabel}>자동 채점자 판정</h3>
          <ul className={styles.cards}>
            {item.graders.map((g) => (
              <li key={g.grader} className={styles.card}>
                <div className={styles.graderHead}>
                  <strong>{g.grader}</strong>
                  <span className={cx(styles.graderVerdict, g.pass ? styles.verdictPass : styles.verdictFail)}>
                    <Icon name={g.pass ? 'verdictPassSm' : 'verdictFailSm'} />
                    {g.pass ? '통과' : '실패'}
                  </span>
                </div>
                <p className={styles.graderComment}>{g.comment}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  )
}
