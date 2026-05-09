/** CSVパース後の1行を表すオブジェクト（列名: 値） */
export type CsvRow = Record<string, string>

/** パース済みのCSVメタ情報 */
export interface CsvMeta {
  headers: string[]
  totalRows: number
}
