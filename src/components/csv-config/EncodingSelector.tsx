import { useEffect } from 'react'
import type { EncodingType } from '../../types/encoding'
import { useFileStore } from '../../store/fileStore'
import { useFileLoader } from '../../hooks/useFileLoader'

const ENCODINGS: { value: EncodingType; label: string }[] = [
  { value: 'UTF-8', label: 'UTF-8' },
  { value: 'UTF-8-BOM', label: 'UTF-8 (BOM付き)' },
  { value: 'SHIFT_JIS', label: 'Shift_JIS' },
  { value: 'CP932', label: 'CP932 (Windows)' },
]

export function EncodingSelector() {
  const { file, detectedEncoding, encodingOverride, setEncodingOverride } = useFileStore()
  const { reloadWithEncoding } = useFileLoader()

  const current = encodingOverride ?? detectedEncoding

  useEffect(() => {
    if (file && encodingOverride) {
      reloadWithEncoding(file, encodingOverride)
    }
  }, [file, encodingOverride, reloadWithEncoding])

  if (!file || !detectedEncoding) return null

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-600">エンコーディング</label>
      <select
        value={current ?? ''}
        onChange={(e) => {
          const val = e.target.value as EncodingType
          setEncodingOverride(val === detectedEncoding ? null : val)
        }}
        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        {ENCODINGS.map((enc) => (
          <option key={enc.value} value={enc.value}>
            {enc.label}
            {enc.value === detectedEncoding ? ' (自動検出)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
