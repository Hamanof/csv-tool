import { create } from 'zustand'
import { arrayMove } from '@dnd-kit/sortable'
import type { Rule, OutputColumn } from '../types/rule'

export interface ColumnConfig {
  sourceName: string
  outputName: string
  order: number
  rules: Rule[]
  included: boolean
}

interface ConfigState {
  columnConfigs: ColumnConfig[]

  initFromHeaders: (headers: string[]) => void
  toggleColumn: (sourceName: string) => void
  setOutputName: (sourceName: string, outputName: string) => void
  /** 選択中の全列の outputName 先頭 n 文字を削除する */
  stripPrefixChars: (n: number) => void
  reorderColumns: (activeId: string, overId: string) => void
  addRule: (sourceName: string, rule: Rule) => void
  updateRule: (sourceName: string, ruleIndex: number, rule: Rule) => void
  removeRule: (sourceName: string, ruleIndex: number) => void
  moveRuleUp: (sourceName: string, ruleIndex: number) => void
  moveRuleDown: (sourceName: string, ruleIndex: number) => void
}

export const useConfigStore = create<ConfigState>()((set, get) => ({
  columnConfigs: [],

  initFromHeaders: (headers) => {
    const configs: ColumnConfig[] = headers.map((h, i) => ({
      sourceName: h,
      outputName: h,
      order: i,
      rules: [],
      included: true,
    }))
    set({ columnConfigs: configs })
  },

  toggleColumn: (sourceName) => {
    set((s) => ({
      columnConfigs: s.columnConfigs.map((c) =>
        c.sourceName === sourceName ? { ...c, included: !c.included } : c,
      ),
    }))
  },

  setOutputName: (sourceName, outputName) => {
    set((s) => ({
      columnConfigs: s.columnConfigs.map((c) =>
        c.sourceName === sourceName ? { ...c, outputName } : c,
      ),
    }))
  },

  stripPrefixChars: (n) => {
    if (n <= 0) return
    set((s) => ({
      columnConfigs: s.columnConfigs.map((c) =>
        c.included ? { ...c, outputName: c.outputName.slice(n) } : c,
      ),
    }))
  },

  reorderColumns: (activeId, overId) => {
    const configs = get().columnConfigs
    const oldIndex = configs.findIndex((c) => c.sourceName === activeId)
    const newIndex = configs.findIndex((c) => c.sourceName === overId)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(configs, oldIndex, newIndex).map((c, i) => ({
      ...c,
      order: i,
    }))
    set({ columnConfigs: reordered })
  },

  addRule: (sourceName, rule) => {
    set((s) => ({
      columnConfigs: s.columnConfigs.map((c) =>
        c.sourceName === sourceName ? { ...c, rules: [...c.rules, rule] } : c,
      ),
    }))
  },

  updateRule: (sourceName, ruleIndex, rule) => {
    set((s) => ({
      columnConfigs: s.columnConfigs.map((c) => {
        if (c.sourceName !== sourceName) return c
        const rules = c.rules.map((r, i) => (i === ruleIndex ? rule : r))
        return { ...c, rules }
      }),
    }))
  },

  removeRule: (sourceName, ruleIndex) => {
    set((s) => ({
      columnConfigs: s.columnConfigs.map((c) => {
        if (c.sourceName !== sourceName) return c
        return { ...c, rules: c.rules.filter((_, i) => i !== ruleIndex) }
      }),
    }))
  },

  moveRuleUp: (sourceName, ruleIndex) => {
    if (ruleIndex === 0) return
    set((s) => ({
      columnConfigs: s.columnConfigs.map((c) => {
        if (c.sourceName !== sourceName) return c
        const rules = arrayMove(c.rules, ruleIndex, ruleIndex - 1)
        return { ...c, rules }
      }),
    }))
  },

  moveRuleDown: (sourceName, ruleIndex) => {
    set((s) => ({
      columnConfigs: s.columnConfigs.map((c) => {
        if (c.sourceName !== sourceName) return c
        if (ruleIndex >= c.rules.length - 1) return c
        const rules = arrayMove(c.rules, ruleIndex, ruleIndex + 1)
        return { ...c, rules }
      }),
    }))
  },
}))

export function toOutputColumn(c: ColumnConfig): OutputColumn {
  return {
    sourceName: c.sourceName,
    outputName: c.outputName,
    order: c.order,
    rules: c.rules,
  }
}

export function getActiveOutputColumns(configs: ColumnConfig[]): OutputColumn[] {
  return configs
    .filter((c) => c.included)
    .sort((a, b) => a.order - b.order)
    .map(toOutputColumn)
}
