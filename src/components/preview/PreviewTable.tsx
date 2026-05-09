import type { CsvRow } from '../../types/csv'
import { cn } from '../../lib/utils'

interface Props {
  headers: string[]
  rows: CsvRow[]
  label?: string
  empty?: string
}

export function PreviewTable({ headers, rows, label, empty = 'データなし' }: Props) {
  if (headers.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        {empty}
      </div>
    )
  }

  return (
    <div className="overflow-auto h-full">
      {label && (
        <p className="text-xs text-gray-500 mb-2 px-1">
          {label} ({rows.length} 行)
        </p>
      )}
      <table className="min-w-full text-xs border-collapse">
        <thead className="sticky top-0 bg-gray-100 z-10">
          <tr>
            <th className="px-2 py-1.5 border border-gray-200 text-gray-500 font-medium text-right w-10 bg-gray-50">
              #
            </th>
            {headers.map((h) => (
              <th
                key={h}
                className="px-3 py-1.5 border border-gray-200 text-left font-medium text-gray-700 bg-gray-100 whitespace-nowrap max-w-[200px] truncate"
                title={h}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={cn('hover:bg-blue-50', i % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
              <td className="px-2 py-1 border border-gray-200 text-gray-400 text-right">
                {i + 1}
              </td>
              {headers.map((h) => (
                <td
                  key={h}
                  className="px-3 py-1 border border-gray-200 text-gray-700 max-w-[200px] truncate"
                  title={row[h]}
                >
                  {row[h] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
