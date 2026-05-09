import type { CsvRow } from '../../types/csv'

/**
 * 列をリネームした新しい行オブジェクトを返す。
 *
 * @param row 元の行
 * @param renameMap 旧列名 → 新列名のマッピング
 */
export function renameColumns(
  row: CsvRow,
  renameMap: Record<string, string>,
): CsvRow {
  const result: CsvRow = {}
  for (const [key, value] of Object.entries(row)) {
    const newKey = renameMap[key] ?? key
    result[newKey] = value
  }
  return result
}

/**
 * OutputColumn の配列から sourceName → outputName のマッピングを構築する。
 */
export function buildRenameMap(
  columns: Array<{ sourceName: string; outputName: string }>,
): Record<string, string> {
  const map: Record<string, string> = {}
  for (const col of columns) {
    if (col.sourceName !== col.outputName) {
      map[col.sourceName] = col.outputName
    }
  }
  return map
}
