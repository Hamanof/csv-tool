import type { CsvRow } from '../../types/csv'

/**
 * 行オブジェクトのキーを指定された順序で並び替えた新しいオブジェクトを返す。
 * orderedKeys に含まれないキーは無視する。
 */
export function reorderColumns(row: CsvRow, orderedKeys: string[]): CsvRow {
  const result: CsvRow = {}
  for (const key of orderedKeys) {
    if (key in row) {
      result[key] = row[key] ?? ''
    }
  }
  return result
}

/**
 * OutputColumn の配列を order 昇順に並び替えて、出力列名のリストを返す。
 */
export function buildOutputOrder(
  columns: Array<{ outputName: string; order: number }>,
): string[] {
  return [...columns]
    .sort((a, b) => a.order - b.order)
    .map((c) => c.outputName)
}
