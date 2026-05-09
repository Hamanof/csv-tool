/**
 * 文字列の前後の空白（半角スペース・タブ・改行・全角スペース）を除去する。
 */
export function applyTrim(value: string): string {
  // String.prototype.trim は半角スペース・タブ・改行を除去するが全角スペースは除去しない
  // 全角スペース（　）も明示的に除去する
  return value.trim().replace(/^　+|　+$/g, '')
}
