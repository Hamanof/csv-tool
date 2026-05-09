import Papa from 'papaparse'
import type { CsvRow } from '../../types/csv'

/**
 * 行オブジェクトの配列を CSV 文字列にシリアライズする。
 * ヘッダは fields の順番で出力する。
 * 改行コードは CRLF（Excel互換）。
 */
export function serializeRows(rows: CsvRow[], fields: string[]): string {
  return Papa.unparse(
    { fields, data: rows },
    {
      newline: '\r\n',
      quotes: false,
      quoteChar: '"',
      escapeChar: '"',
    },
  )
}
