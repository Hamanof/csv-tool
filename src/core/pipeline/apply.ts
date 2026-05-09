import type { CsvRow } from '../../types/csv'
import type { OutputColumn } from '../../types/rule'
import { compileRules } from './compile'
import { selectColumns } from '../columns/select'
import { buildRenameMap, renameColumns } from '../columns/rename'
import { buildOutputOrder, reorderColumns } from '../columns/reorder'

/**
 * OutputColumn の設定を元に、1行の CsvRow を変換して返す。
 *
 * 処理順序：
 * 1. 列を選択（sourceName のみ残す）
 * 2. 各列に変換パイプラインを適用
 * 3. 列名をリネーム
 * 4. 出力順序に並び替え
 */
export function applyOutputColumns(
  row: CsvRow,
  outputColumns: OutputColumn[],
): CsvRow {
  const sourceNames = outputColumns.map((c) => c.sourceName)
  const orderedCols = [...outputColumns].sort((a, b) => a.order - b.order)

  // 列選択
  let result = selectColumns(row, sourceNames)

  // 変換パイプライン適用（列ごとにコンパイル済み関数を使用）
  for (const col of outputColumns) {
    const transformer = compileRules(col.rules)
    const value = result[col.sourceName] ?? ''
    result[col.sourceName] = transformer(value)
  }

  // リネーム
  const renameMap = buildRenameMap(outputColumns)
  result = renameColumns(result, renameMap)

  // 並び順
  const orderedKeys = buildOutputOrder(orderedCols)
  return reorderColumns(result, orderedKeys)
}

/**
 * 複数行に applyOutputColumns を適用する。
 * パフォーマンスのため、ルールは行ごとに再コンパイルしない。
 */
export function applyOutputColumnsToRows(
  rows: CsvRow[],
  outputColumns: OutputColumn[],
): CsvRow[] {
  return rows.map((row) => applyOutputColumns(row, outputColumns))
}
