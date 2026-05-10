import { useState, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useConfigStore, type ColumnConfig } from '../../store/configStore'
import { RuleEditor } from '../rules/RuleEditor'
import { cn } from '../../lib/utils'

function SortableColumn({ config }: { config: ColumnConfig }) {
  const { toggleColumn, setOutputName } = useConfigStore()
  const [expanded, setExpanded] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: config.sourceName })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 px-3 py-2">
        {/* ドラッグハンドル */}
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0"
          tabIndex={-1}
        >
          ⠿
        </button>

        {/* 含める/除外 */}
        <input
          type="checkbox"
          checked={config.included}
          onChange={() => toggleColumn(config.sourceName)}
          className="accent-blue-600 shrink-0"
          id={`col-${config.sourceName}`}
        />

        {/* ソース名（長い場合は末尾側を表示） */}
        <label
          htmlFor={`col-${config.sourceName}`}
          className={cn(
            'text-sm shrink-0 w-[130px] overflow-hidden',
            config.included ? 'text-gray-700' : 'text-gray-400 line-through',
          )}
          title={config.sourceName}
          style={{
            direction: 'rtl',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {/* ltr マーカーで文字列の向きを正す（rtlは省略位置を末尾=左端にするためだけに使う） */}
          <span style={{ direction: 'ltr', unicodeBidi: 'embed' }}>
            {config.sourceName}
          </span>
        </label>

        {config.included && (
          <>
            <span className="text-gray-400 text-xs shrink-0">→</span>
            <input
              value={config.outputName}
              onChange={(e) => setOutputName(config.sourceName, e.target.value)}
              className="flex-1 min-w-0 text-sm border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-300"
              placeholder="出力列名"
            />
          </>
        )}

        {/* ルール数・展開ボタン */}
        {config.included && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              'shrink-0 text-xs px-2 py-0.5 rounded border transition-colors',
              config.rules.length > 0
                ? 'border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50',
            )}
          >
            {config.rules.length > 0 ? `ルール ${config.rules.length}` : 'ルール'}
            {expanded ? ' ▲' : ' ▼'}
          </button>
        )}
      </div>

      {expanded && config.included && (
        <div className="px-3 pb-3">
          <RuleEditor sourceName={config.sourceName} rules={config.rules} />
        </div>
      )}
    </div>
  )
}

export function ColumnMapping() {
  const { columnConfigs, reorderColumns, stripPrefixChars } = useConfigStore()
  const [stripN, setStripN] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorderColumns(String(active.id), String(over.id))
    }
  }

  const handleStrip = () => {
    if (stripN > 0) {
      stripPrefixChars(stripN)
      setStripN(0)
      inputRef.current?.focus()
    }
  }

  if (columnConfigs.length === 0) return null

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-600">
          列設定（{columnConfigs.filter((c) => c.included).length}/{columnConfigs.length} 列選択）
        </label>
      </div>

      {/* 一括先頭N文字削除 */}
      <div className="flex items-center gap-1.5 mb-2 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs">
        <span className="text-gray-500 shrink-0">出力名の先頭</span>
        <input
          ref={inputRef}
          type="number"
          min={0}
          value={stripN === 0 ? '' : stripN}
          onChange={(e) => setStripN(Math.max(0, parseInt(e.target.value, 10) || 0))}
          onKeyDown={(e) => e.key === 'Enter' && handleStrip()}
          placeholder="0"
          className="w-12 border border-gray-300 rounded px-1.5 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-blue-300 bg-white"
        />
        <span className="text-gray-500 shrink-0">文字を削除</span>
        <button
          onClick={handleStrip}
          disabled={stripN <= 0}
          className="ml-auto shrink-0 px-2 py-0.5 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          一括適用
        </button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={columnConfigs.map((c) => c.sourceName)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
            {columnConfigs.map((config) => (
              <SortableColumn key={config.sourceName} config={config} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
