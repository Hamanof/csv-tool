import type { OutputColumn } from '../../types/rule'

export interface MatchResult {
  matched: OutputColumn[]
  unmatched: string[]
}

/**
 * テンプレートの OutputColumn 一覧と CSV のヘッダを厳密一致で照合する。
 * 一致した列のみ処理対象とし、未マッチ列は unmatched として返す。
 *
 * 「厳密一致」 = 大文字小文字・前後空白・全角半角をすべて区別する完全一致。
 */
export function matchColumns(
  outputColumns: OutputColumn[],
  csvHeaders: string[],
): MatchResult {
  const headerSet = new Set(csvHeaders)
  const matched: OutputColumn[] = []
  const unmatched: string[] = []

  for (const col of outputColumns) {
    if (headerSet.has(col.sourceName)) {
      matched.push(col)
    } else {
      unmatched.push(col.sourceName)
    }
  }

  return { matched, unmatched }
}
