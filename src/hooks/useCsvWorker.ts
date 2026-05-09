import { useCallback, useRef } from 'react'
import * as Comlink from 'comlink'
import type { CsvWorkerApi } from '../workers/csv.worker.api'
import type { OutputColumn } from '../types/rule'
import type { EncodingType } from '../types/encoding'
import type { ProcessResult, ProgressEvent } from '../types/progress'

export function useCsvWorker() {
  const workerRef = useRef<Worker | null>(null)
  const apiRef = useRef<Comlink.Remote<CsvWorkerApi> | null>(null)

  const ensureWorker = useCallback((): Comlink.Remote<CsvWorkerApi> => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../workers/csv.worker.ts', import.meta.url),
        { type: 'module' },
      )
      apiRef.current = Comlink.wrap<CsvWorkerApi>(workerRef.current)
    }
    return apiRef.current!
  }, [])

  const process = useCallback(
    (
      file: File,
      outputColumns: OutputColumn[],
      encodingOverride: EncodingType | undefined,
      onProgress: (event: ProgressEvent) => void,
    ): Promise<ProcessResult> => {
      const api = ensureWorker()
      return api.process(file, outputColumns, encodingOverride, Comlink.proxy(onProgress))
    },
    [ensureWorker],
  )

  const cancel = useCallback(() => {
    apiRef.current?.cancel()
  }, [])

  // Worker を破棄する（コンポーネントのアンマウント時などに呼ぶ）
  const terminate = useCallback(() => {
    workerRef.current?.terminate()
    workerRef.current = null
    apiRef.current = null
  }, [])

  return { process, cancel, terminate }
}
