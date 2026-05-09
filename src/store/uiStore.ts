import { create } from 'zustand'
import type { ProcessResult, ProgressEvent } from '../types/progress'

interface UiState {
  isProcessing: boolean
  progress: ProgressEvent | null
  processResult: ProcessResult | null
  processError: string | null

  setIsProcessing: (v: boolean) => void
  setProgress: (p: ProgressEvent | null) => void
  setProcessResult: (r: ProcessResult | null) => void
  setProcessError: (e: string | null) => void
  resetProcess: () => void
}

export const useUiStore = create<UiState>()((set) => ({
  isProcessing: false,
  progress: null,
  processResult: null,
  processError: null,

  setIsProcessing: (v) => set({ isProcessing: v }),
  setProgress: (p) => set({ progress: p }),
  setProcessResult: (r) => set({ processResult: r }),
  setProcessError: (e) => set({ processError: e }),

  resetProcess: () =>
    set({ isProcessing: false, progress: null, processResult: null, processError: null }),
}))
