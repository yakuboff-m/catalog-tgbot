/**
 * Get localized field name suffix
 */
export function getLocalizedName(entity: any, field: string, lang: string = 'en'): string {
  const suffix = lang === 'uz' ? 'Uz' : lang === 'ru' ? 'Ru' : 'En';
  return entity[`${field}${suffix}`] || entity[`${field}En`] || '';
}
