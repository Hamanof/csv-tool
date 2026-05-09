import { describe, it, expect } from 'vitest'
import { applyTrim } from '../../src/core/pipeline/transformers/trim'
import { applyRegexReplace, validateRegexPattern } from '../../src/core/pipeline/transformers/regexReplace'
import { compileRules } from '../../src/core/pipeline/compile'
import { applyOutputColumns } from '../../src/core/pipeline/apply'
import type { OutputColumn } from '../../src/types/rule'

// --- trim ---

describe('applyTrim', () => {
  it('前後の半角スペースを除去する', () => {
    expect(applyTrim('  hello  ')).toBe('hello')
  })

  it('前後のタブと改行を除去する', () => {
    expect(applyTrim('\t hello \n')).toBe('hello')
  })

  it('全角スペースを除去する', () => {
    expect(applyTrim('　hello　')).toBe('hello')
  })

  it('空文字はそのまま', () => {
    expect(applyTrim('')).toBe('')
  })

  it('中間の空白は保持する', () => {
    expect(applyTrim('  hello world  ')).toBe('hello world')
  })
})

// --- regexReplace ---

describe('applyRegexReplace', () => {
  it('基本的な置換', () => {
    const result = applyRegexReplace('hello world', {
      type: 'regexReplace',
      pattern: 'o',
      replacement: '0',
      flags: [],
    })
    expect(result).toBe('hell0 world')
  })

  it('g フラグで全置換', () => {
    const result = applyRegexReplace('hello world', {
      type: 'regexReplace',
      pattern: 'l',
      replacement: 'L',
      flags: ['g'],
    })
    expect(result).toBe('heLLo worLd')
  })

  it('i フラグで大文字小文字を無視', () => {
    const result = applyRegexReplace('Hello World', {
      type: 'regexReplace',
      pattern: 'hello',
      replacement: 'Hi',
      flags: ['i'],
    })
    expect(result).toBe('Hi World')
  })

  it('グループ参照 ($1)', () => {
    const result = applyRegexReplace('2024/01/05', {
      type: 'regexReplace',
      pattern: '(\\d{4})/(\\d{2})/(\\d{2})',
      replacement: '$1-$2-$3',
      flags: [],
    })
    expect(result).toBe('2024-01-05')
  })

  it('空文字にマッチしない場合は元の値を返す', () => {
    const result = applyRegexReplace('hello', {
      type: 'regexReplace',
      pattern: 'xyz',
      replacement: 'ABC',
      flags: ['g'],
    })
    expect(result).toBe('hello')
  })
})

describe('validateRegexPattern', () => {
  it('有効なパターンは null を返す', () => {
    expect(validateRegexPattern('\\d+', ['g'])).toBeNull()
  })

  it('無効なパターンはエラーメッセージを返す', () => {
    const result = validateRegexPattern('[', [])
    expect(result).not.toBeNull()
    expect(typeof result).toBe('string')
  })
})

// --- compileRules ---

describe('compileRules', () => {
  it('ルールが空のとき恒等関数を返す', () => {
    const fn = compileRules([])
    expect(fn('hello')).toBe('hello')
  })

  it('trim と regexReplace を順番に適用する', () => {
    const fn = compileRules([
      { type: 'trim' },
      { type: 'regexReplace', pattern: 'o', replacement: '0', flags: ['g'] },
    ])
    expect(fn('  hello  ')).toBe('hell0')
  })
})

// --- applyOutputColumns ---

describe('applyOutputColumns', () => {
  const columns: OutputColumn[] = [
    {
      sourceName: '氏名',
      outputName: 'name',
      order: 0,
      rules: [{ type: 'trim' }],
    },
    {
      sourceName: '年齢',
      outputName: 'age',
      order: 1,
      rules: [],
    },
  ]

  it('列の選択・リネーム・変換・並び順を一括適用する', () => {
    const row = { '氏名': '  山田太郎  ', '年齢': '30', '住所': '東京' }
    const result = applyOutputColumns(row, columns)
    expect(result).toEqual({ name: '山田太郎', age: '30' })
    expect(Object.keys(result)).toEqual(['name', 'age'])
  })

  it('存在しない列は空文字になる', () => {
    const row = { '年齢': '25' }
    const result = applyOutputColumns(row, columns)
    expect(result['name']).toBe('')
  })
})
