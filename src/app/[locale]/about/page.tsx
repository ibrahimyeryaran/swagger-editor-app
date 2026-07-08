import { getTranslations } from 'next-intl/server';
import styles from './about.module.css';

const TECHNOLOGIES = [
  'Next.js 15 (App Router)',
  'React 19',
  'TypeScript',
  'next-intl',
  'Supabase (Auth + Postgres)',
  'CodeMirror 6',
  'js-yaml',
  'Vitest + Testing Library',
];

export default async function AboutPage() {
  const t = await getTranslations('about');

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('title')}</h1>

      <section className={`card ${styles.section}`}>
        <h2 className={styles.heading}>{t('projectHeading')}</h2>
        <p className={styles.text}>{t('projectDescription')}</p>
      </section>

      <section className={`card ${styles.section}`}>
        <h2 className={styles.heading}>{t('courseHeading')}</h2>
        <p className={styles.text}>{t('courseDescription')}</p>
        <a
          className="btn btnOutline btnSmall"
          href="https://rs.school/courses/reactjs"
          target="_blank"
          rel="noreferrer"
        >
          {t('courseLink')}
        </a>
      </section>

      <section className={`card ${styles.section}`}>
        <h2 className={styles.heading}>{t('teamHeading')}</h2>
        <div className={styles.member}>
          <div className={styles.avatar} aria-hidden="true">
            İY
          </div>
          <div className={styles.memberInfo}>
            <span className={styles.memberName}>İbrahim Yeryaran</span>
            <span className={styles.memberRole}>{t('teamRole')}</span>
            <a href="https://github.com/ibrahimyeryaran" target="_blank" rel="noreferrer">
              {t('githubProfile')}
            </a>
          </div>
        </div>
      </section>

      <section className={`card ${styles.section}`}>
        <h2 className={styles.heading}>{t('techHeading')}</h2>
        <ul className={styles.techList}>
          {TECHNOLOGIES.map((tech) => (
            <li key={tech} className={styles.tech}>
              {tech}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
