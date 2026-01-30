/**
 * Generic Translation Validation Utilities
 * Reusable validators for translation arrays from next-intl
 */

/**
 * Type guard that validates an object has specific string properties
 * @param item - The item to validate
 * @param keys - Array of required string property names
 * @returns True if the item has all required string properties
 */
export function hasStringKeys<K extends string>(
  item: unknown,
  keys: readonly K[]
): item is Record<K, string> {
  if (typeof item !== 'object' || item === null) {
    return false;
  }
  return keys.every(
    (key) => key in item && typeof (item as Record<string, unknown>)[key] === 'string'
  );
}

/**
 * Validates and filters an array of translation items
 * @param raw - The raw value from t.raw()
 * @param keys - Array of required string property names
 * @returns Array of validated items with the specified properties
 */
export function validateTranslationArray<K extends string>(
  raw: unknown,
  keys: readonly K[]
): Record<K, string>[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is Record<K, string> => hasStringKeys(item, keys));
}

// Pre-configured validators for common translation patterns

/** Validates items with 'title' and 'description' properties */
export function validateTitleDescription(raw: unknown) {
  return validateTranslationArray(raw, ['title', 'description'] as const);
}

/** Validates items with 'question' and 'answer' properties */
export function validateQuestionAnswer(raw: unknown) {
  return validateTranslationArray(raw, ['question', 'answer'] as const);
}
