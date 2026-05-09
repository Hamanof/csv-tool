import { useState } from 'react'
import type { OutputColumn } from '../../types/rule'
import { useTemplates } from '../../hooks/useTemplates'

interface Props {
  outputColumns: OutputColumn[]
  onClose: () => void
}

export function SaveTemplateDialog({ outputColumns, onClose }: Props) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const { save } = useTemplates()

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await save(name.trim(), outputColumns)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-80 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">テンプレートを保存</h2>
        <div>
          <label className="text-xs text-gray-600">テンプレート名</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="例: 顧客データ整形"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <p className="text-xs text-gray-500">
          {outputColumns.length} 列の設定を保存します。
          同名のテンプレートが存在する場合も保存されます（IDで管理）。
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
