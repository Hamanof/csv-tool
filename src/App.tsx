import { useState, useCallback, useEffect } from 'react'
import { DropZone } from './components/upload/DropZone'
import { EncodingSelector } from './components/csv-config/EncodingSelector'
import { ColumnMapping } from './components/csv-config/ColumnMapping'
import { PreviewTable } from './components/preview/PreviewTable'
import { ProgressDialog } from './components/progress/ProgressDialog'
import { ErrorSummary } from './components/summary/ErrorSummary'
import { SaveTemplateDialog } from './components/templates/SaveTemplateDialog'
import { TemplateList } from './components/templates/TemplateList'
import { useFileStore } from './store/fileStore'
import { useConfigStore, getActiveOutputColumns } from './store/configStore'
import { useUiStore } from './store/uiStore'
import { usePreview } from './hooks/usePreview'
import { useCsvWorker } from './hooks/useCsvWorker'
import { downloadBlob } from './utils/download'
import { buildOutputFilename } from './utils/filename'

type TabKey = 'before' | 'after'
type ModalKey = 'none' | 'saveTemplate' | 'templateList'

function App() {
  const { file, sourceHeaders, encodingOverride, detectedEncoding } = useFileStore()
  const { columnConfigs } = useConfigStore()
  const { isProcessing, processResult, processError, setIsProcessing, setProgress, setProcessResult, setProcessError, resetProcess } = useUiStore()
  const { beforeRows, afterRows, outputColumns } = usePreview()
  const { process: runProcess, cancel: cancelProcess, terminate } = useCsvWorker()
  const [tab, setTab] = useState<TabKey>('before')
  const [modal, setModal] = useState<ModalKey>('none')

  useEffect(() => () => terminate(), [terminate])

  const handleProcess = useCallback(async () => {
    if (!file) return
    const cols = getActiveOutputColumns(columnConfigs)
    if (cols.length === 0) {
      alert('少なくとも1列を選択してください。')
      return
    }
    resetProcess()
    setIsProcessing(true)
    try {
      const result = await runProcess(
        file,
        cols,
        encodingOverride ?? undefined,
        (p) => setProgress(p),
      )
      setProcessResult(result)
      setIsProcessing(false)
      // 自動ダウンロード
      downloadBlob(result.blob, buildOutputFilename(file.name))
    } catch (e) {
      setIsProcessing(false)
      if (e instanceof Error && e.message !== '処理がキャンセルされました') {
        setProcessError(e.message)
      }
    }
  }, [file, columnConfigs, encodingOverride, runProcess, resetProcess, setIsProcessing, setProgress, setProcessResult, setProcessError])

  const handleCancel = useCallback(() => {
    cancelProcess()
    setIsProcessing(false)
    setProgress(null)
  }, [cancelProcess, setIsProcessing, setProgress])

  const beforeHeaders = sourceHeaders
  const afterHeaders = outputColumns.map((c) => c.outputName)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* ヘッダ */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 shadow-sm">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h1 className="text-lg font-bold text-gray-800">CSV加工ツール</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setModal('templateList')}
            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50"
          >
            テンプレート
          </button>
          {file && (
            <button
              onClick={handleProcess}
              disabled={isProcessing || outputColumns.length === 0}
              className="text-sm font-semibold px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? '処理中…' : '実行してダウンロード'}
            </button>
          )}
          <span className="text-xs text-gray-400">完全クライアントサイド処理</span>
        </div>
      </header>

      {/* メインレイアウト */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左パネル（設定） */}
        <aside className="w-96 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* ファイル選択 */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">ファイル</h2>
              <DropZone />
            </section>

            {/* エンコーディング */}
            {file && (
              <section>
                <EncodingSelector />
              </section>
            )}

            {/* 列設定 */}
            {file && columnConfigs.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">列設定</h2>
                <ColumnMapping />
              </section>
            )}
          </div>

          {/* サイドバーフッタ */}
          {file && (
            <div className="mt-auto p-4 border-t border-gray-200 bg-white space-y-2">
              {processError && (
                <p className="text-xs text-red-600">{processError}</p>
              )}
              {processResult && !isProcessing && (
                <p className="text-xs text-green-600">
                  ✓ 完了（{processResult.totalRows} 行）—{' '}
                  <button
                    onClick={() => downloadBlob(processResult.blob, buildOutputFilename(file.name))}
                    className="underline hover:no-underline"
                  >
                    再ダウンロード
                  </button>
                </p>
              )}
              <button
                onClick={() => setModal('saveTemplate')}
                disabled={outputColumns.length === 0}
                className="w-full py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                テンプレート保存
              </button>
              <p className="text-xs text-gray-400 text-center">
                {outputColumns.length} 列 · 先頭30行プレビュー
              </p>
            </div>
          )}
        </aside>

        {/* 右パネル（プレビュー） */}
        <main className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
          {!file ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="mx-auto mb-4 w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">CSVファイルを読み込むとプレビューが表示されます</p>
              </div>
            </div>
          ) : (
            <>
              {/* タブ切り替え */}
              <div className="flex gap-1 bg-gray-200 p-1 rounded-lg self-start">
                {(['before', 'after'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      tab === t
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t === 'before' ? 'ビフォア（入力）' : 'アフター（変換後）'}
                  </button>
                ))}
              </div>

              {/* プレビューテーブル */}
              <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
                {tab === 'before' ? (
                  <PreviewTable
                    headers={beforeHeaders}
                    rows={beforeRows}
                    label={`入力プレビュー（先頭 ${beforeRows.length} 行）`}
                    empty="ファイルを読み込んでください"
                  />
                ) : (
                  <PreviewTable
                    headers={afterHeaders}
                    rows={afterRows}
                    label={`変換後プレビュー（先頭 ${afterRows.length} 行）`}
                    empty="列を1つ以上選択してください"
                  />
                )}
              </div>

              {/* エラーサマリ（処理完了後） */}
              {processResult && processResult.errorRows.length > 0 && (
                <ErrorSummary
                  errorRows={processResult.errorRows}
                  totalRows={processResult.totalRows}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* 処理進捗ダイアログ */}
      <ProgressDialog onCancel={handleCancel} />

      {/* テンプレート保存 */}
      {modal === 'saveTemplate' && (
        <SaveTemplateDialog
          outputColumns={outputColumns}
          onClose={() => setModal('none')}
        />
      )}

      {/* テンプレート一覧 */}
      {modal === 'templateList' && (
        <TemplateList onClose={() => setModal('none')} />
      )}
    </div>
  )
}

export default App
