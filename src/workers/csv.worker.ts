import * as Comlink from 'comlink'
import Papa from 'papaparse'
import type { OutputColumn } from '../types/rule'
import type { EncodingType } from '../types/encoding'
import type { CsvRow } from '../types/csv'
import type { ErrorRow, ProcessResult, ProgressEvent } from '../types/progress'
import { detectEncoding } from '../core/encoding/detect'
import { decodeAll } from '../core/encoding/decode'
import { encodeText, deriveOutputEncoding } from '../core/encoding/encode'
import { applyOutputColumns } from '../core/pipeline/apply'
import { serializeRows } from '../core/csv/serialize'

class CsvWorkerImpl {
  private abortController: AbortController | null = null

  async process(
    file: File,
    outputColumns: OutputColumn[],
    encodingOverride: EncodingType | undefined,
    onProgress: (event: ProgressEvent) => void,
  ): Promise<ProcessResult> {
    this.abortController = new AbortController()
    const signal = this.abortController.signal
    const totalBytes = file.size

    const report = (ratio: number) =>
      onProgress({ processedBytes: Math.round(totalBytes * ratio), totalBytes, ratio })

    report(0)

    // 1. ファイル全体を読み込む
    const fullBuffer = await file.arrayBuffer()
    if (signal.aborted) throw new Error('処理がキャンセルされました')

    const bytes = new Uint8Array(fullBuffer)
    report(0.15)

    // 2. エンコーディング判定
    const { encoding: detected } = detectEncoding(bytes)
    const encoding = encodingOverride ?? detected
    const { addBom } = deriveOutputEncoding(bytes, encoding)

    // 3. デコード
    const text = decodeAll(bytes, encoding)
    if (signal.aborted) throw new Error('処理がキャンセルされました')
    report(0.3)

    // 4. PapaParse でパース（一括）
    const parseResult = Papa.parse<CsvRow>(text, {
      header: true,
      skipEmptyLines: true,
    })

    if (signal.aborted) throw new Error('処理がキャンセルされました')

    // エラー行インデックスを収集（FieldMismatch = 列数不一致）
    const errorRowSet = new Set<number>()
    for (const err of parseResult.errors) {
      if (err.type === 'FieldMismatch' && err.row !== undefined) {
        errorRowSet.add(err.row)
      }
    }

    const allRows = parseResult.data
    const sortedCols = [...outputColumns].sort((a, b) => a.order - b.order)
    const outputHeaders = sortedCols.map((c) => c.outputName)

    const outputRows: CsvRow[] = []
    const errorRows: ErrorRow[] = []
    let lastProgressTime = Date.now()

    // 5. 行ごとに変換を適用
    for (let i = 0; i < allRows.length; i++) {
      if (signal.aborted) throw new Error('処理がキャンセルされました')

      const rawRow = allRows[i]
      if (rawRow === undefined) continue

      const isError = errorRowSet.has(i)
      if (isError) {
        const rawValues = Object.values(rawRow)
        errorRows.push({
          rowIndex: i + 1,
          raw: rawValues.join(','),
          reason: `列数不一致`,
        })
      }

      // エラー行も含め同じ列変換を適用（列選択・リネーム・並び順）
      outputRows.push(applyOutputColumns(rawRow, outputColumns))

      const now = Date.now()
      if (now - lastProgressTime >= 100) {
        lastProgressTime = now
        const ratio = 0.3 + 0.5 * ((i + 1) / allRows.length)
        report(ratio)
      }
    }

    report(0.85)

    // 6. CSV にシリアライズ
    const csvText = serializeRows(outputRows, outputHeaders)
    if (signal.aborted) throw new Error('処理がキャンセルされました')

    // 7. 出力エンコードして Blob 化
    const outputBytes = encodeText(csvText, encoding, addBom)
    // .slice() で ArrayBuffer コピーを作り BlobPart 型を確定させる
    const blob = new Blob([outputBytes.slice()], { type: 'text/csv' })

    report(1)

    return {
      blob,
      encoding,
      errorRows,
      totalRows: allRows.length,
    }
  }

  cancel(): void {
    this.abortController?.abort()
  }
}

Comlink.expose(new CsvWorkerImpl())
