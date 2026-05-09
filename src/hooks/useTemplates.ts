import { useState, useEffect, useCallback } from 'react'
import type { Template } from '../types/template'
import type { OutputColumn } from '../types/rule'
import { listTemplates, saveTemplate, deleteTemplate } from '../db/templates'
import { matchColumns } from '../core/columns/match'
import { useConfigStore } from '../store/configStore'
import { useFileStore } from '../store/fileStore'

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await listTemplates()
      setTemplates(list)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const save = useCallback(
    async (name: string, outputColumns: OutputColumn[]): Promise<Template> => {
      const t = await saveTemplate(name, outputColumns)
      await refresh()
      return t
    },
    [refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      await deleteTemplate(id)
      await refresh()
    },
    [refresh],
  )

  return { templates, isLoading, save, remove, refresh }
}

// テンプレート読み込み時の列名照合結果
export interface LoadResult {
  matched: string[]
  unmatched: string[]
}

export function useTemplateLoader() {
  const { initFromHeaders } = useConfigStore()
  const { sourceHeaders } = useFileStore()

  const loadTemplate = useCallback(
    (template: Template): LoadResult => {
      const { matched, unmatched } = matchColumns(template.outputColumns, sourceHeaders)
      // マッチした列だけを使い、ストアを更新
      initFromHeaders(sourceHeaders)
      // ソースヘッダ→ColumnConfig の初期化後、テンプレートの設定を上書き
      const { columnConfigs } = useConfigStore.getState()
      const matchedSourceNames = new Set(matched.map((c) => c.sourceName))

      // included と outputName を上書き
      const updated = columnConfigs.map((cfg) => {
        if (!matchedSourceNames.has(cfg.sourceName)) {
          return { ...cfg, included: false }
        }
        const tmplCol = template.outputColumns.find(
          (c) => c.sourceName === cfg.sourceName,
        )
        if (!tmplCol) return cfg
        return {
          ...cfg,
          outputName: tmplCol.outputName,
          rules: tmplCol.rules,
          order: tmplCol.order,
          included: true,
        }
      })

      useConfigStore.setState({ columnConfigs: updated })

      return {
        matched: matched.map((c) => c.sourceName),
        unmatched,
      }
    },
    [initFromHeaders, sourceHeaders],
  )

  return { loadTemplate }
}
