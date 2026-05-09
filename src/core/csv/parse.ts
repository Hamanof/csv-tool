import Papa from 'papaparse'
import type { CsvRow } from '../../types/csv'

export interface ParseChunkResult {
  rows: CsvRow[]
  errors: Array<{ row: number; message: string }>
}

/**
 * CSV 文字列をパースして行オブジェクトの配列を返す。
 * 先頭行をヘッダとして使用する（MVP は1行ヘッダのみ対応）。
 */
export function parseCsvString(text: string): ParseChunkResult {
  const result = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })

  return {
    rows: result.data,
    errors: result.errors.map((e) => ({
      row: e.row ?? -1,
      message: e.message,
    })),
  }
}

/**
 * CSV 文字列からヘッダ列名を抽出する。
 * 本体を完全パースせずに先頭行だけを読む。
 */
export function extractHeaders(text: string): string[] {
  const firstNewline = text.indexOf('\n')
  const firstLine = firstNewline >= 0 ? text.slice(0, firstNewline) : text
  const result = Papa.parse<string[]>(firstLine, {
    header: false,
    dynamicTyping: false,
  })
  return result.data[0] ?? []
}

/**
 * 列数が期待値と一致しない行かどうかを判定する。
 */
export function isErrorRow(row: CsvRow, expectedColumnCount: number): boolean {
  return Object.keys(row).length !== expectedColumnCount
}
