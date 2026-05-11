import { useCallback } from 'react'
import Papa from 'papaparse'
import type { CsvRow } from '../types/csv'
import { detectEncoding } from '../core/encoding/detect'
import { decodeAll } from '../core/encoding/decode'
import type { EncodingType } from '../types/encoding'
import { useFileStore } from '../store/fileStore'
import { useConfigStore } from '../store/configStore'

const PREVIEW_BYTE_LIMIT = 2 * 1024 * 1024 // 2MB
const PREVIEW_ROW_LIMIT = 30

async function readAndDecode(file: File, encoding: EncodingType): Promise<string> {
  const slice = file.slice(0, PREVIEW_BYTE_LIMIT)
  const buf = await slice.arrayBuffer()
  return decodeAll(new Uint8Array(buf), encoding)
}

export function useFileLoader() {
  const { setLoading, setFileData, setPreviewData, encodingOverride } = useFileStore()
  const { initFromHeaders } = useConfigStore()

  const loadFile = useCallback(
    async (file: File) => {
      setLoading(true)
      try {
        // エンコーディング判定（先頭 2MB を使用）
        const headSlice = file.slice(0, PREVIEW_BYTE_LIMIT)
        const headBuf = await headSlice.arrayBuffer()
        const headBytes = new Uint8Array(headBuf)
        const { encoding: detected } = detectEncoding(headBytes)

        const text = await readAndDecode(file, detected)
        const parsed = Papa.parse<CsvRow>(text, {
          header: true,
          skipEmptyLines: true,
        })

        const headers = parsed.meta.fields ?? []
        const rows = parsed.data.slice(0, PREVIEW_ROW_LIMIT)

        setFileData(file, headers, rows, detected)
        initFromHeaders(headers)
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setFileData, initFromHeaders],
  )

  // エンコーディングが変更されたときにプレビューを再デコード
  const reloadWithEncoding = useCallback(
    async (file: File, encoding: EncodingType) => {
      setLoading(true)
      try {
        const text = await readAndDecode(file, encoding)
        const parsed = Papa.parse<CsvRow>(text, {
          header: true,
          skipEmptyLines: true,
        })
        const headers = parsed.meta.fields ?? []
        const rows = parsed.data.slice(0, PREVIEW_ROW_LIMIT)
        setPreviewData(headers, rows)
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setPreviewData],
  )

  return { loadFile, reloadWithEncoding }
}
