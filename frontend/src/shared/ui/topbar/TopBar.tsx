import { motion } from 'framer-motion';
import styles from './TopBar.module.scss';

type TopBarProps = {
    title: string;
    hint?: string;

    actionLabel?: string;
    onAction?: () => void;
    actionDisabled?: boolean;

    className?: string;
};

export function TopBar({
    title,
    hint,
    actionLabel,
    onAction,
    actionDisabled = false,
    className,
}: TopBarProps) {
    const showAction = Boolean(actionLabel && onAction);

    return (
        <motion.div
            className={[styles.topBar, className].filter(Boolean).join(' ')}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div className={styles.brand}>
                <span className={styles.brandDot} />
                <span className={styles.brandText}>{title}</span>
                {hint ? <span className={styles.brandHint}>{hint}</span> : null}
            </div>

            <div className={styles.topActions}>
                {showAction ? (
                    <button
                        className={styles.ghostButton}
                        onClick={onAction}
                        disabled={actionDisabled}
                    >
                        {actionLabel}
                    </button>
                ) : null}
            </div>
        </motion.div>
    );
}
