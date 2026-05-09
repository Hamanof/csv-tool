import { describe, it, expect } from 'vitest'
import { selectColumns, getUnselectedColumns } from '../../src/core/columns/select'
import { renameColumns, buildRenameMap } from '../../src/core/columns/rename'
import { reorderColumns, buildOutputOrder } from '../../src/core/columns/reorder'
import { matchColumns } from '../../src/core/columns/match'
import type { OutputColumn } from '../../src/types/rule'

// --- select ---

describe('selectColumns', () => {
  it('指定した列だけを残す', () => {
    const row = { a: '1', b: '2', c: '3' }
    expect(selectColumns(row, ['a', 'c'])).toEqual({ a: '1', c: '3' })
  })

  it('存在しない列は空文字になる', () => {
    const row = { a: '1' }
    expect(selectColumns(row, ['a', 'b'])).toEqual({ a: '1', b: '' })
  })

  it('空の sourceNames は空オブジェクトを返す', () => {
    expect(selectColumns({ a: '1' }, [])).toEqual({})
  })
})

describe('getUnselectedColumns', () => {
  it('未選択の列名を返す', () => {
    const result = getUnselectedColumns(['a', 'b', 'c'], ['b'])
    expect(result).toEqual(['a', 'c'])
  })
})

// --- rename ---

describe('renameColumns', () => {
  it('指定した列名を変更する', () => {
    const row = { name: '山田', age: '30' }
    const result = renameColumns(row, { name: '氏名', age: '年齢' })
    expect(result).toEqual({ '氏名': '山田', '年齢': '30' })
  })

  it('マッピングにない列はそのまま保持', () => {
    const row = { a: '1', b: '2' }
    expect(renameColumns(row, { a: 'A' })).toEqual({ A: '1', b: '2' })
  })
})

describe('buildRenameMap', () => {
  it('sourceName と outputName が違う列のみをマッピングに含める', () => {
    const cols = [
      { sourceName: 'name', outputName: '氏名' },
      { sourceName: 'age', outputName: 'age' },
    ]
    expect(buildRenameMap(cols)).toEqual({ name: '氏名' })
  })
})

// --- reorder ---

describe('reorderColumns', () => {
  it('指定した順序でキーを並び替える', () => {
    const row = { a: '1', b: '2', c: '3' }
    const result = reorderColumns(row, ['c', 'a'])
    expect(Object.keys(result)).toEqual(['c', 'a'])
    expect(result).toEqual({ c: '3', a: '1' })
  })

  it('orderedKeys にないキーは除外', () => {
    const row = { a: '1', b: '2', c: '3' }
    const result = reorderColumns(row, ['b'])
    expect(result).toEqual({ b: '2' })
  })
})

describe('buildOutputOrder', () => {
  it('order 昇順で outputName を返す', () => {
    const cols = [
      { outputName: 'c', order: 2 },
      { outputName: 'a', order: 0 },
      { outputName: 'b', order: 1 },
    ]
    expect(buildOutputOrder(cols)).toEqual(['a', 'b', 'c'])
  })
})

// --- match ---

describe('matchColumns', () => {
  const columns: OutputColumn[] = [
    { sourceName: '氏名', outputName: 'name', order: 0, rules: [] },
    { sourceName: '年齢', outputName: 'age', order: 1, rules: [] },
    { sourceName: '住所', outputName: 'address', order: 2, rules: [] },
  ]

  it('一致した列と未マッチ列を分けて返す', () => {
    const result = matchColumns(columns, ['氏名', '年齢'])
    expect(result.matched.map((c) => c.sourceName)).toEqual(['氏名', '年齢'])
    expect(result.unmatched).toEqual(['住所'])
  })

  it('厳密一致（大文字小文字区別）', () => {
    const result = matchColumns(columns, ['氏名', '年齢', '住所'])
    expect(result.unmatched).toEqual([])
  })

  it('完全不一致の場合は全列が unmatched', () => {
    const result = matchColumns(columns, ['A', 'B'])
    expect(result.matched).toEqual([])
    expect(result.unmatched).toHaveLength(3)
  })
})
