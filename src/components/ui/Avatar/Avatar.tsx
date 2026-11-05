import styles from './Avatar.module.css'

export function Avatar({ name }: { name: string }) {
  return (
    <span className={styles.avatar} aria-hidden>
      {name.slice(0, 1)}
    </span>
  )
}
