import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useFileLoader } from '../../hooks/useFileLoader'
import { useFileStore } from '../../store/fileStore'
import { cn } from '../../lib/utils'

export function DropZone() {
  const { loadFile } = useFileLoader()
  const { file, reset: resetFile } = useFileStore()

  const onDrop = useCallback(
    (accepted: File[]) => {
      const f = accepted[0]
      if (f) loadFile(f)
    },
    [loadFile],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.txt', '.tsv'] },
    multiple: false,
  })

  if (file) {
    return (
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="flex-1 truncate text-blue-800 font-medium">{file.name}</span>
        <button
          onClick={(e) => { e.stopPropagation(); resetFile() }}
          className="text-blue-400 hover:text-red-500 transition-colors"
          title="ファイルを閉じる"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragActive
          ? 'border-blue-400 bg-blue-50 text-blue-600'
          : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-gray-400 hover:bg-gray-100',
      )}
    >
      <input {...getInputProps()} />
      <svg className="mx-auto mb-3 w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <p className="text-sm font-medium">
        {isDragActive ? 'ここにドロップ' : 'CSVファイルをドラッグ＆ドロップ'}
      </p>
      <p className="text-xs mt-1 text-gray-400">または クリックしてファイルを選択</p>
    </div>
  )
}
