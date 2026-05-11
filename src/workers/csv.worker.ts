import * as Comlink from 'comlink'
import Papa from 'papaparse'
import type { OutputColumn } from '../types/rule'
import type { EncodingType } from '../types/encoding'
import type { CsvRow } from '../types/csv'
import type { ErrorRow, ProcessResult, ProgressEvent } from '../types/progress'
import { detectEncoding } from '../core/encoding/detect'
import { createDecoder } from '../core/encoding/decode'
import { encodeText, deriveOutputEncoding } from '../core/encoding/encode'
import { applyOutputColumns } from '../core/pipeline/apply'
import { serializeRows } from '../core/csv/serialize'

const READ_CHUNK = 4 * 1024 * 1024 // 4MB

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

    // 1. 先頭 4MB だけ読んでエンコーディング判定
    const headBuf = await file.slice(0, Math.min(READ_CHUNK, file.size)).arrayBuffer()
    if (signal.aborted) throw new Error('処理がキャンセルされました')

    const headBytes = new Uint8Array(headBuf)
    const { encoding: detected } = detectEncoding(headBytes)
    const encoding = encodingOverride ?? detected
    const { addBom } = deriveOutputEncoding(headBytes, encoding)

    report(0.05)

    const sortedCols = [...outputColumns].sort((a, b) => a.order - b.order)
    const outputHeaders = sortedCols.map((c) => c.outputName)

    // 出力は文字列パーツとして蓄積し、最後に一括エンコード
    const outputParts: string[] = []
    const errorRows: ErrorRow[] = []
    let totalRows = 0
    let isFirstBatch = true
    let lastProgressTime = Date.now()

    /**
     * 変換済み行を outputParts へ追記する。
     * 最初のバッチはヘッダ行込み、2回目以降はヘッダ行を除いて追記する。
     */
    const appendBatch = (
      rows: CsvRow[],
      batchErrors: Array<{ type: string; row?: number }>,
      batchStartRow: number,
    ) => {
      if (rows.length === 0) return

      const errorRowSet = new Set<number>()
      for (const e of batchErrors) {
        if (e.type === 'FieldMismatch' && e.row !== undefined) errorRowSet.add(e.row)
      }

      const out: CsvRow[] = []
      for (let i = 0; i < rows.length; i++) {
        const raw = rows[i]
        if (!raw) continue
        batchStartRow++
        if (errorRowSet.has(i)) {
          errorRows.push({
            rowIndex: batchStartRow,
            raw: Object.values(raw).join(','),
            reason: '列数不一致',
          })
        }
        out.push(applyOutputColumns(raw, outputColumns))
      }

      if (out.length === 0) return
      const csv = serializeRows(out, outputHeaders)
      if (isFirstBatch) {
        outputParts.push(csv)
        isFirstBatch = false
      } else {
        // 先頭のヘッダ行（1行目）を除いて追記
        const crlfIdx = csv.indexOf('\r\n')
        if (crlfIdx >= 0) outputParts.push(csv.slice(crlfIdx + 2))
      }
      totalRows += out.length
    }

    // 2. UTF-8 / UTF-8-BOM: PapaParse のファイルストリームを使用
    //    FileReader が内部で READ_CHUNK ずつ読むのでメモリ使用が抑えられる
    if (encoding === 'UTF-8' || encoding === 'UTF-8-BOM') {
      let chunksDone = 0

      await new Promise<void>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(Papa.parse as (f: File, c: any) => void)(file, {
          header: true,
          skipEmptyLines: true,
          chunkSize: READ_CHUNK,
          chunk(results: Papa.ParseResult<CsvRow>, parser: Papa.Parser) {
            if (signal.aborted) {
              parser.abort()
              reject(new Error('処理がキャンセルされました'))
              return
            }
            appendBatch(results.data, results.errors, totalRows)
            chunksDone++

            const now = Date.now()
            if (now - lastProgressTime >= 100) {
              lastProgressTime = now
              // チャンク数ベースの進捗（概算）
              const ratio = Math.min(0.05 + 0.9 * ((chunksDone * READ_CHUNK) / totalBytes), 0.95)
              report(ratio)
            }
          },
          complete: () => resolve(),
          error: (err: Papa.ParseError) => reject(new Error(err.message)),
        })
      })

    } else {
      // 3. SJIS / CP932: チャンク単位で読み込み→デコード→蓄積→step パース
      //    一括 arrayBuffer() を避けることで大容量ファイルのメモリエラーを回避
      const decoder = createDecoder(encoding)
      const textParts: string[] = []
      let processedBytes = 0
      const reader = file.stream().getReader()

      try {
        while (true) {
          if (signal.aborted) throw new Error('処理がキャンセルされました')
          const { done, value } = await reader.read()
          if (done) break
          processedBytes += value.length
          textParts.push(decoder.decode(value, false))

          const now = Date.now()
          if (now - lastProgressTime >= 100) {
            lastProgressTime = now
            report(0.05 + 0.4 * (processedBytes / totalBytes))
          }
        }
      } finally {
        reader.releaseLock()
      }

      if (signal.aborted) throw new Error('処理がキャンセルされました')
      report(0.45)

      // step コールバックで 1 行ずつ処理することで大量の行オブジェクトを保持しない
      const fullText = textParts.join('')
      let stepRow = 0
      await new Promise<void>((resolve, reject) => {
        Papa.parse<CsvRow>(fullText, {
          header: true,
          skipEmptyLines: true,
          step(result, parser) {
            if (signal.aborted) {
              parser.abort()
              reject(new Error('処理がキャンセルされました'))
              return
            }
            appendBatch([result.data], result.errors, totalRows)
            stepRow++

            const now = Date.now()
            if (now - lastProgressTime >= 100) {
              lastProgressTime = now
              // テキスト量から進捗を概算
              report(Math.min(0.45 + 0.45 * (stepRow / Math.max(stepRow + 500, 1000)), 0.9))
            }
          },
          complete: () => resolve(),
          error: (err: Error) => reject(new Error(err.message)),
        })
      })
    }

    if (signal.aborted) throw new Error('処理がキャンセルされました')
    report(0.95)

    // 4. 出力テキストをエンコードして Blob 化
    //    UTF-8 は Blob に文字列を直接渡す（再エンコード不要でメモリ節約）
    let blob: Blob
    if (encoding === 'UTF-8' || encoding === 'UTF-8-BOM') {
      // '﻿' は UTF-8 BOM として Blob コンストラクタが正しく出力する
      blob = addBom
        ? new Blob(['﻿', ...outputParts], { type: 'text/csv' })
        : new Blob(outputParts, { type: 'text/csv' })
    } else {
      const outputText = outputParts.join('')
      const outputBytes = encodeText(outputText, encoding, addBom)
      blob = new Blob([outputBytes.slice()], { type: 'text/csv' })
    }

    report(1)

    return { blob, encoding, errorRows, totalRows }
  }

  cancel(): void {
    this.abortController?.abort()
  }
}

Comlink.expose(new CsvWorkerImpl())
