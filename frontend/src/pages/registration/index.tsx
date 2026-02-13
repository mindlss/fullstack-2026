import { useMemo, useState, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ValidatedInput from 'widgets/validatedInput';
import { passwordValidator } from 'utils/validators';
import { useToast } from 'utils/useToast';
import styles from './registration.module.scss';
import { authApi, ApiError } from 'shared/api';

type Step = 'form' | 'success';

function getErrorMessage(err: unknown): string {
    if (err instanceof ApiError) {
        if (err.code === 'VALIDATION_ERROR') return 'Проверьте поля формы';
        // если у тебя есть код типа USERNAME_TAKEN — добавь сюда
        if (err.code) return err.code;
        return err.message;
    }
    return 'Ошибка регистрации';
}

export default function RegisterPage() {
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [step, setStep] = useState<Step>('form');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');

    const [errors, setErrors] = useState({
        login: '',
        password: '',
        repeat: '',
    });

    const formError = errors.login || errors.password || errors.repeat;

    const canSubmit = useMemo(() => {
        if (!login.trim()) return false;
        if (!password) return false;
        if (password !== repeatPassword) return false;
        return true;
    }, [login, password, repeatPassword]);

    const goLogin = () => {
        startTransition(() => {
            navigate('/login', {
                replace: true,
                state: { identifier: login }, // если логин страница читает state
            });
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || !canSubmit) return;

        void (async () => {
            setIsSubmitting(true);
            try {
                await authApi.register({
                    username: login.trim(),
                    password,
                });

                addToast({
                    message: 'Аккаунт создан. Теперь нужно войти.',
                    type: 'success',
                    duration: 2500,
                });

                setStep('success');
            } catch (err: unknown) {
                const msg = getErrorMessage(err);

                setPassword('');
                setRepeatPassword('');

                addToast({
                    message: msg,
                    type: 'error',
                    duration: 3000,
                });
            } finally {
                setIsSubmitting(false);
            }
        })();
    };

    const handleBackToForm = () => {
        setStep('form');
    };

    return (
        <div className={styles.container}>
            <motion.div
                className={styles.registerCard}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
            >
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        {step === 'success' ? 'Готово' : 'Регистрация'}
                    </h1>
                    <p className={styles.subTitle}>
                        {step === 'success'
                            ? 'Аккаунт создан. Осталось войти.'
                            : 'Создай аккаунт, чтобы продолжить.'}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'form' && (
                        <motion.form
                            key="form"
                            className={styles.form}
                            onSubmit={handleSubmit}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                        >
                            <ValidatedInput
                                placeholder="Логин"
                                value={login}
                                onChange={setLogin}
                                validator={(v) =>
                                    v.trim().length >= 3
                                        ? ''
                                        : 'Логин короче 3 символов'
                                }
                                hideErrorMessage
                                onErrorChange={(e) =>
                                    setErrors((p) => ({ ...p, login: e }))
                                }
                            />

                            <ValidatedInput
                                placeholder="Пароль"
                                value={password}
                                onChange={setPassword}
                                validator={passwordValidator}
                                type="password"
                                hideErrorMessage
                                onErrorChange={(e) =>
                                    setErrors((p) => ({ ...p, password: e }))
                                }
                            />

                            <ValidatedInput
                                placeholder="Повтор пароля"
                                value={repeatPassword}
                                onChange={setRepeatPassword}
                                validator={(v) =>
                                    v === password ? '' : 'Пароли не совпадают'
                                }
                                type="password"
                                hideErrorMessage
                                onErrorChange={(e) =>
                                    setErrors((p) => ({ ...p, repeat: e }))
                                }
                            />

                            {formError && (
                                <div className={styles.formError}>
                                    {formError}
                                </div>
                            )}

                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={!canSubmit || isSubmitting}
                            >
                                {isSubmitting
                                    ? 'Создаём...'
                                    : 'Зарегистрироваться'}
                            </button>

                            <button
                                type="button"
                                className={styles.loginButton}
                                onClick={goLogin}
                                disabled={isSubmitting}
                            >
                                Уже есть аккаунт?
                            </button>
                        </motion.form>
                    )}

                    {step === 'success' && (
                        <motion.div
                            key="success"
                            className={styles.success}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                        >
                            <div className={styles.successBadge}>
                                <span className={styles.dot} />
                                Аккаунт создан
                            </div>

                            <div className={styles.successText}>
                                Теперь войдите с вашими данными, чтобы
                                продолжить.
                            </div>

                            <div className={styles.successActions}>
                                <button
                                    className={styles.submitButton}
                                    onClick={goLogin}
                                >
                                    Перейти к входу
                                </button>
                                <button
                                    className={styles.ghostButton}
                                    onClick={handleBackToForm}
                                >
                                    Назад
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
