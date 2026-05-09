import type { OutputColumn } from '../types/rule'
import type { EncodingType } from '../types/encoding'
import type { ProcessResult, ProgressEvent } from '../types/progress'

export interface CsvWorkerApi {
  process(
    file: File,
    outputColumns: OutputColumn[],
    encodingOverride: EncodingType | undefined,
    onProgress: (event: ProgressEvent) => void,
  ): Promise<ProcessResult>
  cancel(): void
}
