export interface ProgressEvent {
  processedBytes: number
  totalBytes: number
  /** 0.0 〜 1.0 */
  ratio: number
}

export interface ErrorRow {
  rowIndex: number
  raw: string
  reason: string
}

export interface ProcessResult {
  blob: Blob
  encoding: string
  errorRows: ErrorRow[]
  totalRows: number
}
