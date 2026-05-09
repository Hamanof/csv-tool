import type { RegexReplaceRule } from '../../../types/rule'

/**
 * 正規表現置換ルールで値を変換する。
 *
 * @throws {Error} pattern が不正な正規表現の場合
 */
export function applyRegexReplace(value: string, rule: RegexReplaceRule): string {
  const flags = rule.flags.join('')
  const regex = new RegExp(rule.pattern, flags)
  return value.replace(regex, rule.replacement)
}

/**
 * 正規表現パターンとフラグが有効かどうかを検証する。
 * 不正な場合はエラーメッセージを返し、有効なら null を返す。
 */
export function validateRegexPattern(
  pattern: string,
  flags: string[],
): string | null {
  try {
    new RegExp(pattern, flags.join(''))
    return null
  } catch (e) {
    return e instanceof Error ? e.message : '無効な正規表現です'
  }
}
