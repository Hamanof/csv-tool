import type { Rule } from '../../types/rule'
import { applyTrim } from './transformers/trim'
import { applyRegexReplace } from './transformers/regexReplace'

/** 1つの値に適用できる変換関数の型 */
export type Transformer = (value: string) => string

/**
 * ルール配列を順番付きの変換関数チェーンにコンパイルする。
 * コンパイル結果の関数を行ごとに再利用することで、
 * ルールの解釈コストを1回にまとめる。
 */
export function compileRules(rules: Rule[]): Transformer {
  // ルールが空のときは恒等関数を返す
  if (rules.length === 0) return (v) => v

  const transformers: Transformer[] = rules.map((rule) => {
    switch (rule.type) {
      case 'trim':
        return applyTrim
      case 'regexReplace': {
        const captured = rule
        return (value: string) => applyRegexReplace(value, captured)
      }
    }
  })

  return (value: string) => {
    let result = value
    for (const fn of transformers) {
      result = fn(result)
    }
    return result
  }
}
