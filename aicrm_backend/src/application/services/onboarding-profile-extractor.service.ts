import { Injectable } from '@nestjs/common';

export interface NameValidationResult {
  valid: boolean;
  firstName: string | null;
  fullName: string | null;
  reason?: string;
}

export interface EmailValidationResult {
  valid: boolean;
  email: string | null;
}

export interface DocumentValidationResult {
  provided: boolean;
  skipped: boolean;
  valid: boolean;
  identificationNumber: string | null;
}

@Injectable()
export class OnboardingProfileExtractorService {
  validateName(message: string): NameValidationResult {
    const text = message.trim();
    const lower = text.toLowerCase();
    const blocked = new Set([
      'hola',
      'buenas',
      'ok',
      'si',
      'sí',
      'no',
      'gracias',
    ]);
    if (!text || blocked.has(lower)) {
      return { valid: false, firstName: null, fullName: null, reason: 'generic' };
    }

    const explicit = lower.match(
      /\b(?:soy|me llamo|mi nombre es)\s+([a-záéíóúñ'.-]+(?:\s+[a-záéíóúñ'.-]+){0,3})/i,
    );
    const candidate = explicit ? explicit[1] : text;
    const clean = candidate
      .replace(/[0-9]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!/^[\p{L}' .-]{2,80}$/u.test(clean)) {
      return { valid: false, firstName: null, fullName: null, reason: 'format' };
    }

    const fullName = this.titleCase(clean);
    const firstName = fullName.split(' ')[0] ?? null;
    return { valid: true, firstName, fullName };
  }

  validateEmail(message: string): EmailValidationResult {
    const match = message.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
    if (!match) return { valid: false, email: null };
    return { valid: true, email: match[0].toLowerCase() };
  }

  validateDocument(message: string): DocumentValidationResult {
    const normalized = message.toLowerCase().trim();
    const skipWords = ['omitir', 'saltar', 'prefiero no', 'despues', 'después', 'no'];
    if (skipWords.some((w) => normalized.includes(w))) {
      return {
        provided: true,
        skipped: true,
        valid: true,
        identificationNumber: null,
      };
    }

    const digits = normalized.replace(/\D/g, '');
    if (!digits) {
      return { provided: false, skipped: false, valid: false, identificationNumber: null };
    }
    if (digits.length < 6 || digits.length > 15) {
      return { provided: true, skipped: false, valid: false, identificationNumber: null };
    }
    return {
      provided: true,
      skipped: false,
      valid: true,
      identificationNumber: digits,
    };
  }

  private titleCase(value: string): string {
    return value
      .split(' ')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ');
  }
}
