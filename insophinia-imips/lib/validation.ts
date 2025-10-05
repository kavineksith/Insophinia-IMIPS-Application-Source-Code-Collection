export interface ValidationRule {
    pattern: RegExp;
    message: string;
}

export const VALIDATION_RULES: { [key: string]: ValidationRule } = {
    required: {
        pattern: /.+/,
        message: 'This field is required.'
    },
    name: {
        pattern: /^[a-zA-Z\s'-]{2,50}$/,
        message: 'Please enter a valid name.'
    },
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address.'
    },
    password: {
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        message: 'Password must be 8+ characters, with uppercase, lowercase, number, and special character.'
    },
    sku: {
        pattern: /^[A-Z0-9-]{3,20}$/,
        message: 'SKU must be 3-20 uppercase letters, numbers, or hyphens.'
    },
    phone: {
        pattern: /^\+?[0-9\s-()]{7,20}$/,
        message: 'Please enter a valid phone number.'
    },
    discountCode: {
        pattern: /^[A-Z0-9]{4,15}$/,
        message: 'Code must be 4-15 uppercase letters or numbers.'
    }
};

export const validate = (value: string, rules: ValidationRule[]): string | null => {
    for (const rule of rules) {
        if (!rule.pattern.test(value)) {
            return rule.message;
        }
    }
    return null;
};
