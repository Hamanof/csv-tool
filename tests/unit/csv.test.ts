import { describe, it, expect } from 'vitest'
import { parseCsvString, extractHeaders, isErrorRow } from '../../src/core/csv/parse'
import { serializeRows } from '../../src/core/csv/serialize'

// --- parse ---

describe('parseCsvString', () => {
  it('基本的な CSV をパースする', () => {
    const csv = '名前,年齢\n山田,30\n田中,25'
    const result = parseCsvString(csv)
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual({ '名前': '山田', '年齢': '30' })
    expect(result.rows[1]).toEqual({ '名前': '田中', '年齢': '25' })
  })

  it('クォートで囲まれたカンマを含む値を正しく扱う', () => {
    const csv = '名前,住所\n山田,"東京都, 渋谷区"'
    const result = parseCsvString(csv)
    expect(result.rows[0]?.['住所']).toBe('東京都, 渋谷区')
  })

  it('空行をスキップする', () => {
    const csv = '名前,年齢\n\n山田,30\n\n田中,25'
    const result = parseCsvString(csv)
    expect(result.rows).toHaveLength(2)
  })
})

describe('extractHeaders', () => {
  it('先頭行からヘッダを抽出する', () => {
    const csv = '氏名,年齢,住所\n山田,30,東京'
    expect(extractHeaders(csv)).toEqual(['氏名', '年齢', '住所'])
  })
})

describe('isErrorRow', () => {
  it('列数が一致する場合は false', () => {
    const row = { a: '1', b: '2' }
    expect(isErrorRow(row, 2)).toBe(false)
  })

  it('列数が異なる場合は true', () => {
    const row = { a: '1', b: '2', c: '3' }
    expect(isErrorRow(row, 2)).toBe(true)
  })
})

// --- serialize ---

describe('serializeRows', () => {
  it('行オブジェクトを CSV 文字列にシリアライズする', () => {
    const rows = [
      { name: '山田', age: '30' },
      { name: '田中', age: '25' },
    ]
    const result = serializeRows(rows, ['name', 'age'])
    expect(result).toContain('name,age')
    expect(result).toContain('山田,30')
    expect(result).toContain('田中,25')
  })

  it('カンマを含む値はクォートで囲まれる', () => {
    const rows = [{ address: '東京都, 渋谷区' }]
    const result = serializeRows(rows, ['address'])
    expect(result).toContain('"東京都, 渋谷区"')
  })
})
