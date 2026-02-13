import { motion } from 'framer-motion';
import styles from './home.module.scss';
import { TopBar } from 'shared/ui';

export default function HomePage() {
    return (
        <div className={styles.container}>
            <TopBar
                title="Main page"
                hint="Добро пожаловать"
            />

            <main className={styles.main}>
                <motion.section
                    className={styles.hero}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    <h1 className={styles.heroTitle}>В разработке</h1>
                </motion.section>
            </main>
        </div>
    );
}
