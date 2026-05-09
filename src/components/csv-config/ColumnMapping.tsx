import { useState } from 'react'
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

        {/* ソース名 */}
        <label
          htmlFor={`col-${config.sourceName}`}
          className={cn(
            'text-sm shrink-0 min-w-0 max-w-[120px] truncate',
            config.included ? 'text-gray-700' : 'text-gray-400 line-through',
          )}
          title={config.sourceName}
        >
          {config.sourceName}
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
  const { columnConfigs, reorderColumns } = useConfigStore()

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

  if (columnConfigs.length === 0) return null

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-600">
          列設定（{columnConfigs.filter((c) => c.included).length}/{columnConfigs.length} 列選択）
        </label>
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
