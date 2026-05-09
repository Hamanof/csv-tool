import type { ErrorRow } from '../../types/progress'

interface Props {
  errorRows: ErrorRow[]
  totalRows: number
}

export function ErrorSummary({ errorRows, totalRows }: Props) {
  if (errorRows.length === 0) return null

  return (
    <div className="mt-4 border border-yellow-300 bg-yellow-50 rounded-lg p-4 text-sm">
      <h3 className="font-semibold text-yellow-800 mb-2">
        ⚠ エラー行サマリ（{errorRows.length} / {totalRows} 行）
      </h3>
      <p className="text-yellow-700 text-xs mb-3">
        列数が一致しない行を元の値のまま出力しました。
      </p>
      <div className="max-h-48 overflow-y-auto space-y-1">
        {errorRows.map((r) => (
          <div key={r.rowIndex} className="flex gap-3 text-xs py-1 border-b border-yellow-200 last:border-0">
            <span className="text-yellow-600 shrink-0 w-16">行 {r.rowIndex}</span>
            <span className="text-yellow-700 truncate" title={r.raw}>{r.raw}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
