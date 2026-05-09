import { useState } from 'react'
import type { Template } from '../../types/template'
import { useTemplates, useTemplateLoader, type LoadResult } from '../../hooks/useTemplates'
import { cn } from '../../lib/utils'

interface Props {
  onClose: () => void
}

export function TemplateList({ onClose }: Props) {
  const { templates, isLoading, remove } = useTemplates()
  const { loadTemplate } = useTemplateLoader()
  const [loadResult, setLoadResult] = useState<LoadResult | null>(null)
  const [loadedName, setLoadedName] = useState<string | null>(null)

  const handleLoad = (t: Template) => {
    const result = loadTemplate(t)
    setLoadResult(result)
    setLoadedName(t.name)
  }

  const handleDelete = async (t: Template) => {
    if (confirm(`「${t.name}」を削除しますか？`)) {
      await remove(t.id)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-800">テンプレート</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {loadResult && (
          <div className={cn('px-5 py-3 text-sm border-b', loadResult.unmatched.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200')}>
            <p className={loadResult.unmatched.length > 0 ? 'text-yellow-800' : 'text-green-800'}>
              「{loadedName}」を読み込みました。
              {loadResult.matched.length} 列マッチ
              {loadResult.unmatched.length > 0 && `、${loadResult.unmatched.length} 列未マッチ（スキップ）`}
            </p>
            {loadResult.unmatched.length > 0 && (
              <p className="text-yellow-700 text-xs mt-1">
                未マッチ: {loadResult.unmatched.join('、')}
              </p>
            )}
          </div>
        )}

        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <p className="text-sm text-gray-400 text-center py-8">読み込み中…</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">保存されたテンプレートがありません</p>
          ) : (
            <div className="divide-y">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.name}</p>
                    <p className="text-xs text-gray-400">
                      {t.outputColumns.length} 列 · {new Date(t.updatedAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleLoad(t)}
                    className="shrink-0 text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    読込
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="shrink-0 text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded hover:bg-red-50"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
