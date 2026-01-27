import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';


export function toBoolean(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;

  const str = String(value).trim().toLowerCase();
  return ['true', '1', 'yes', 'on'].includes(str);
}