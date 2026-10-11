import { createId } from './ids.ts'
import {
  DEFAULT_VARIANT_NAMES,
  MAX_DIFFICULTY_VARIANTS,
  type DifficultyVariant,
} from './types.ts'

export function canAddVariant(variants: DifficultyVariant[]): boolean {
  return variants.length < MAX_DIFFICULTY_VARIANTS
}

export function createDefaultVariants(now = new Date().toISOString()): DifficultyVariant[] {
  return DEFAULT_VARIANT_NAMES.map((name, index) => ({
    id: createId(),
    name,
    sortOrder: index,
    isDefault: name === 'Średni',
    createdAt: now,
    updatedAt: now,
  }))
}

export function defaultVariant(variants: DifficultyVariant[]): DifficultyVariant | undefined {
  return variants.find((variant) => variant.isDefault) ?? variants[0]
}

export function renameVariant(
  variants: DifficultyVariant[],
  id: string,
  name: string,
  now = new Date().toISOString(),
): DifficultyVariant[] {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('Nazwa wariantu nie może być pusta.')
  }
  return variants.map((variant) =>
    variant.id === id ? { ...variant, name: trimmed, updatedAt: now } : variant,
  )
}

export function addVariant(
  variants: DifficultyVariant[],
  name: string,
  now = new Date().toISOString(),
): DifficultyVariant[] {
  if (!canAddVariant(variants)) {
    throw new Error(`Można mieć najwyżej ${MAX_DIFFICULTY_VARIANTS} wariantów dnia.`)
  }
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('Nazwa wariantu nie może być pusta.')
  }
  return [
    ...variants,
    {
      id: createId(),
      name: trimmed,
      sortOrder: nextVariantSortOrder(variants),
      isDefault: variants.length === 0,
      createdAt: now,
      updatedAt: now,
    },
  ]
}

export function removeVariant(
  variants: DifficultyVariant[],
  id: string,
  now = new Date().toISOString(),
): DifficultyVariant[] {
  if (variants.length <= 1) {
    throw new Error('Musi pozostać przynajmniej jeden wariant dnia.')
  }
  const remaining = variants.filter((variant) => variant.id !== id)
  if (!remaining.some((variant) => variant.isDefault)) {
    remaining[0] = { ...remaining[0], isDefault: true, updatedAt: now }
  }
  return remaining
}

function nextVariantSortOrder(variants: DifficultyVariant[]): number {
  if (variants.length === 0) return 0
  return Math.max(...variants.map((variant) => variant.sortOrder)) + 1
}
