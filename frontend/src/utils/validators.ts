export const emailValidator = (value: string): string => {
    if (!value.trim()) return 'Email обязателен';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
        return 'Введите корректный email';
    }

    return '';
};

export const passwordValidator = (value: string): string => {
    if (!value) return 'Пароль обязателен';

    if (value.length < 8) return 'Минимум 8 символов';
    if (!/[a-z]/.test(value)) return 'Добавьте строчную букву';
    if (!/[0-9]/.test(value)) return 'Добавьте цифру';

    return '';
};

export const requiredValidator = (
    value: string,
    fieldName: string = 'Поле',
): string => {
    return value.trim() ? '' : `${fieldName} обязательно для заполнения`;
};

export const minLengthValidator = (
    value: string,
    minLength: number,
    fieldName: string = 'Поле',
): string => {
    return value.length >= minLength
        ? ''
        : `${fieldName} должно содержать минимум ${minLength} символов`;
};

export const maxLengthValidator = (
    value: string,
    maxLength: number,
    fieldName: string = 'Поле',
): string => {
    return value.length <= maxLength
        ? ''
        : `${fieldName} не должно превышать ${maxLength} символов`;
};
