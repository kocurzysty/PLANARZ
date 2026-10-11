import { describe, expect, it } from 'vitest'
import { MAX_DIFFICULTY_VARIANTS } from './types.ts'
import { addVariant, canAddVariant, createDefaultVariants, removeVariant, renameVariant } from './variants.ts'

describe('variants', () => {
  it('seeds three default variants', () => {
    const variants = createDefaultVariants('now')
    expect(variants.map((item) => item.name)).toEqual(['Łatwy', 'Średni', 'Trudny'])
    expect(variants.find((item) => item.isDefault)?.name).toBe('Średni')
  })

  it('enforces the limit of 9 variants', () => {
    let variants = createDefaultVariants('now')
    for (let index = variants.length; index < MAX_DIFFICULTY_VARIANTS; index += 1) {
      variants = addVariant(variants, `Wariant ${index}`, 'now')
    }
    expect(canAddVariant(variants)).toBe(false)
    expect(() => addVariant(variants, 'Za dużo', 'now')).toThrow(/9/)
  })

  it('keeps a default after deletion and refuses removing the last one', () => {
    const variants = createDefaultVariants('now')
    const defaultId = variants.find((item) => item.isDefault)?.id ?? ''
    const remaining = removeVariant(variants, defaultId, 'now')
    expect(remaining).toHaveLength(2)
    expect(remaining.some((item) => item.isDefault)).toBe(true)
    const lastTwoRemoved = removeVariant(remaining, remaining[1].id, 'now')
    expect(() => removeVariant(lastTwoRemoved, lastTwoRemoved[0].id, 'now')).toThrow(/przynajmniej jeden/)
  })

  it('renames without changing id', () => {
    const variants = createDefaultVariants('now')
    const id = variants[0].id
    const renamed = renameVariant(variants, id, 'Spokojny', 'now')
    expect(renamed[0].id).toBe(id)
    expect(renamed[0].name).toBe('Spokojny')
  })
})
