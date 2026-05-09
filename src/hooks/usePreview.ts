import { useMemo } from 'react'
import { useFileStore } from '../store/fileStore'
import { useConfigStore, getActiveOutputColumns } from '../store/configStore'
import { applyOutputColumns } from '../core/pipeline/apply'
import type { CsvRow } from '../types/csv'
import type { OutputColumn } from '../types/rule'

export function usePreview(): {
  beforeRows: CsvRow[]
  afterRows: CsvRow[]
  outputColumns: OutputColumn[]
} {
  const previewRows = useFileStore((s) => s.previewRows)
  const columnConfigs = useConfigStore((s) => s.columnConfigs)

  const outputColumns = useMemo(
    () => getActiveOutputColumns(columnConfigs),
    [columnConfigs],
  )

  const afterRows = useMemo(() => {
    if (outputColumns.length === 0) return []
    return previewRows.map((row) => applyOutputColumns(row, outputColumns))
  }, [previewRows, outputColumns])

  return { beforeRows: previewRows, afterRows, outputColumns }
}
