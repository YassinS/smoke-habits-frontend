/**
 * Input validation and sanitization utilities
 */

export interface ValidationResult {
	valid: boolean;
	error?: string;
	sanitized?: string;
}

/**
 * Sanitize a string by removing potentially harmful characters and trimming whitespace
 */
export function sanitizeString(input: string): string {
	if (typeof input !== 'string') return '';

	// Trim whitespace
	let sanitized = input.trim();

	// Remove any HTML/script tags
	sanitized = sanitized.replace(/<[^>]*>/g, '');

	// Remove control characters except newline and tab
	sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

	return sanitized;
}

/**
 * Validate and sanitize email address
 */
export function validateEmail(email: string): ValidationResult {
	const sanitized = sanitizeString(email).toLowerCase();

	if (!sanitized) {
		return { valid: false, error: 'Email is required' };
	}

	if (sanitized.length > 254) {
		return { valid: false, error: 'Email is too long' };
	}

	// RFC 5322 simplified email regex
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(sanitized)) {
		return { valid: false, error: 'Please enter a valid email address' };
	}

	return { valid: true, sanitized };
}

/**
 * Validate and sanitize password
 */
export function validatePassword(password: string): ValidationResult {
	if (typeof password !== 'string') {
		return { valid: false, error: 'Password is required' };
	}

	if (password.length < 8) {
		return { valid: false, error: 'Password must be at least 8 characters long' };
	}

	if (password.length > 128) {
		return { valid: false, error: 'Password is too long' };
	}

	// Check for at least one uppercase, one lowercase, and one number
	if (!/[a-z]/.test(password)) {
		return { valid: false, error: 'Password must contain at least one lowercase letter' };
	}

	if (!/[A-Z]/.test(password)) {
		return { valid: false, error: 'Password must contain at least one uppercase letter' };
	}

	if (!/[0-9]/.test(password)) {
		return { valid: false, error: 'Password must contain at least one number' };
	}

	return { valid: true };
}

/**
 * Validate and sanitize context label
 */
export function validateContextLabel(label: string): ValidationResult {
	const sanitized = sanitizeString(label);

	if (!sanitized) {
		return { valid: false, error: 'Context label is required' };
	}

	if (sanitized.length < 2) {
		return { valid: false, error: 'Context label must be at least 2 characters' };
	}

	if (sanitized.length > 100) {
		return { valid: false, error: 'Context label must be less than 100 characters' };
	}

	return { valid: true, sanitized };
}

/**
 * Validate hex color code
 */
export function validateHexColor(color: string): ValidationResult {
	const sanitized = sanitizeString(color).toUpperCase();

	if (!sanitized) {
		return { valid: false, error: 'Color is required' };
	}

	// Match 3 or 6 digit hex color
	if (!/^#([A-F0-9]{6}|[A-F0-9]{3})$/.test(sanitized)) {
		return { valid: false, error: 'Please enter a valid hex color' };
	}

	return { valid: true, sanitized };
}

/**
 * Validate craving level (1-10)
 */
export function validateCravingLevel(level: unknown): ValidationResult {
	const num = typeof level === 'string' ? parseInt(level, 10) : level;

	if (typeof num !== 'number' || isNaN(num)) {
		return { valid: false, error: 'Craving level must be a number' };
	}

	if (num < 1 || num > 10) {
		return { valid: false, error: 'Craving level must be between 1 and 10' };
	}

	return { valid: true, sanitized: String(Math.round(num)) };
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): ValidationResult {
	const sanitized = sanitizeString(uuid).toLowerCase();

	if (!sanitized) {
		return { valid: false, error: 'ID is required' };
	}

	// Standard UUID v4 format
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(sanitized)) {
		return { valid: false, error: 'Invalid ID format' };
	}

	return { valid: true, sanitized };
}

/**
 * Validate refresh token format
 */
export function validateRefreshToken(token: string): ValidationResult {
	const sanitized = sanitizeString(token);

	if (!sanitized) {
		return { valid: false, error: 'Refresh token is required' };
	}

	if (sanitized.length < 10) {
		return { valid: false, error: 'Invalid refresh token' };
	}

	if (sanitized.length > 10000) {
		return { valid: false, error: 'Refresh token is too long' };
	}

	return { valid: true, sanitized };
}

/**
 * Validate consent boolean
 */
export function validateConsent(consent: unknown): ValidationResult {
	if (typeof consent !== 'boolean') {
		return { valid: false, error: 'Consent must be explicitly given' };
	}

	if (!consent) {
		return { valid: false, error: 'You must accept the terms to continue' };
	}

	return { valid: true };
}

/**
 * Safely parse JSON with validation
 */
export function safeParseJSON<T>(json: string): T | null {
	try {
		const parsed = JSON.parse(json);
		return parsed as T;
	} catch {
		return null;
	}
}

/**
 * Validate and sanitize login request
 */
export function validateLoginRequest(email: string, password: string) {
	const emailValidation = validateEmail(email);
	if (!emailValidation.valid) {
		return { valid: false, error: emailValidation.error };
	}

	if (!password) {
		return { valid: false, error: 'Password is required' };
	}

	return { valid: true, email: emailValidation.sanitized };
}

/**
 * Validate and sanitize registration request
 */
export function validateRegistrationRequest(email: string, password: string, consent: unknown) {
	const emailValidation = validateEmail(email);
	if (!emailValidation.valid) {
		return { valid: false, error: emailValidation.error };
	}

	const passwordValidation = validatePassword(password);
	if (!passwordValidation.valid) {
		return { valid: false, error: passwordValidation.error };
	}

	const consentValidation = validateConsent(consent);
	if (!consentValidation.valid) {
		return { valid: false, error: consentValidation.error };
	}

	return { valid: true, email: emailValidation.sanitized };
}
