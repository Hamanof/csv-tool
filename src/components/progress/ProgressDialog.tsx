import { useUiStore } from '../../store/uiStore'

interface Props {
  onCancel: () => void
}

export function ProgressDialog({ onCancel }: Props) {
  const { isProcessing, progress } = useUiStore()

  if (!isProcessing) return null

  const pct = progress ? Math.round(progress.ratio * 100) : 0
  const processed = progress ? formatBytes(progress.processedBytes) : '0 B'
  const total = progress ? formatBytes(progress.totalBytes) : '—'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-80">
        <h2 className="text-base font-semibold text-gray-800 mb-4">処理中…</h2>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-5">
          <span>{processed} / {total}</span>
          <span>{pct}%</span>
        </div>
        <button
          onClick={onCancel}
          className="w-full py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
