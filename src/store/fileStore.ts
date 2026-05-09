import { create } from 'zustand'
import type { CsvRow } from '../types/csv'
import type { EncodingType } from '../types/encoding'

interface FileState {
  file: File | null
  detectedEncoding: EncodingType | null
  encodingOverride: EncodingType | null
  sourceHeaders: string[]
  previewRows: CsvRow[]
  isLoading: boolean

  setLoading: (v: boolean) => void
  setFileData: (
    file: File,
    headers: string[],
    rows: CsvRow[],
    detected: EncodingType,
  ) => void
  setPreviewData: (headers: string[], rows: CsvRow[]) => void
  setEncodingOverride: (enc: EncodingType | null) => void
  reset: () => void
}

export const useFileStore = create<FileState>()((set) => ({
  file: null,
  detectedEncoding: null,
  encodingOverride: null,
  sourceHeaders: [],
  previewRows: [],
  isLoading: false,

  setLoading: (v) => set({ isLoading: v }),

  setFileData: (file, headers, rows, detected) =>
    set({
      file,
      sourceHeaders: headers,
      previewRows: rows,
      detectedEncoding: detected,
      encodingOverride: null,
      isLoading: false,
    }),

  setPreviewData: (headers, rows) =>
    set({ sourceHeaders: headers, previewRows: rows }),

  setEncodingOverride: (enc) => set({ encodingOverride: enc }),

  reset: () =>
    set({
      file: null,
      detectedEncoding: null,
      encodingOverride: null,
      sourceHeaders: [],
      previewRows: [],
      isLoading: false,
    }),
}))
