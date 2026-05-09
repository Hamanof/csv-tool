/**
 * ヘッダ行を元に「出力する列名のリスト」を構築する。
 * MVP では先頭1行がヘッダ（extractHeaders で取得済みを想定）。
 */
export function buildHeaderRow(
  outputColumnNames: string[],
): string[] {
  return outputColumnNames
}
