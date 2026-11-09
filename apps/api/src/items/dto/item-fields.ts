import { Transform } from 'class-transformer';

export const MIN_YEAR = 1400;
export const MAX_YEAR = 2100;
export const COVER_PATTERN = /^(https?:\/\/\S+|\/(?!\/)\S*)$/;

export const trimString = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));

export const emptyToNull = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  });
