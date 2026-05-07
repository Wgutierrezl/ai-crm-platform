import { Injectable } from '@nestjs/common';

export interface ExtractedProfileData {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  identificationNumber?: string;
  address?: string;
  city?: string;
  age?: number;
}

@Injectable()
export class OnboardingProfileExtractorService {
  extract(
    message: string,
    options?: { allowLooseNameDetection?: boolean },
  ): ExtractedProfileData {
    const text = message.trim();
    const lower = text.toLowerCase();
    const extracted: ExtractedProfileData = {};

    if (this.isGreetingOnly(lower) && !options?.allowLooseNameDetection) {
      return extracted;
    }

    const emailMatch = text.match(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    );
    if (emailMatch) extracted.email = emailMatch[0].toLowerCase();

    const idMatch = lower.match(
      /\b(?:cc|cedula|cédula|dni|documento)[:\s#-]*([0-9]{5,15})\b/i,
    );
    if (idMatch) extracted.identificationNumber = idMatch[1];

    const ageMatch = lower.match(/\b(?:tengo|edad)[:\s]*([1-9][0-9]?)\b/i);
    if (ageMatch) extracted.age = Number(ageMatch[1]);

    const cityMatch = lower.match(/\b(?:vivo en|ciudad)[:\s]*([a-záéíóúñ\s]{3,})/i);
    if (cityMatch) extracted.city = this.normalizeName(cityMatch[1]);

    const addressMatch = lower.match(
      /\b(?:direccion|dirección|mi direccion es|mi dirección es)[:\s]*([a-z0-9#\-\s,.]{6,})/i,
    );
    if (addressMatch) extracted.address = addressMatch[1].trim();

    const fullNameMatch = lower.match(
      /\b(?:soy|me llamo|mi nombre es)\s+([a-záéíóúñ'.-]+(?:\s+[a-záéíóúñ'.-]+){0,3})/i,
    );
    if (fullNameMatch) {
      const fullName = this.normalizeName(fullNameMatch[1]);
      extracted.fullName = fullName;
      const parts = fullName.split(' ');
      if (parts.length >= 1) extracted.firstName = parts[0];
      if (parts.length >= 2) extracted.lastName = parts.slice(1).join(' ');
    } else if (options?.allowLooseNameDetection) {
      const tokens = text.split(/\s+/).filter((t) => /^[\p{L}'-]+$/u.test(t));
      if (tokens.length === 1) extracted.firstName = this.normalizeName(tokens[0]);
      if (tokens.length === 2) {
        extracted.firstName = this.normalizeName(tokens[0]);
        extracted.lastName = this.normalizeName(tokens[1]);
        extracted.fullName = `${extracted.firstName} ${extracted.lastName}`;
      }
    }

    return extracted;
  }

  private isGreetingOnly(lower: string): boolean {
    const cleaned = lower.replace(/[!¡?¿.,]/g, '').trim();
    return [
      'hola',
      'buenas',
      'buenos dias',
      'buenas tardes',
      'buenas noches',
      'hello',
      'hi',
    ].includes(cleaned);
  }

  private normalizeName(value: string): string {
    return value
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ');
  }
}
