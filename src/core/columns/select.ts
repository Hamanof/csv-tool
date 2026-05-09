import type { CsvRow } from '../../types/csv'

/**
 * 行オブジェクトから指定された列名のみを残して返す。
 * sourceNames に含まれない列は除外する。
 */
export function selectColumns(row: CsvRow, sourceNames: string[]): CsvRow {
  const result: CsvRow = {}
  for (const name of sourceNames) {
    result[name] = row[name] ?? ''
  }
  return result
}

/**
 * 全ヘッダから選択済み列名を除いた「未選択列名一覧」を返す。
 */
export function getUnselectedColumns(
  allHeaders: string[],
  selectedNames: string[],
): string[] {
  const selected = new Set(selectedNames)
  return allHeaders.filter((h) => !selected.has(h))
}
