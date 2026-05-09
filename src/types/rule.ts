export interface TrimRule {
  type: 'trim'
}

export interface RegexReplaceRule {
  type: 'regexReplace'
  pattern: string
  replacement: string
  flags: Array<'g' | 'i'>
}

export type Rule = TrimRule | RegexReplaceRule

/** 1列に対する変換ルールの順番付きリスト */
export type Pipeline = Rule[]

export interface OutputColumn {
  /** 元のCSVの列名 */
  sourceName: string
  /** 出力時のヘッダ名（未指定なら sourceName と同じ） */
  outputName: string
  /** 並び順（0始まり） */
  order: number
  /** この列に適用する変換パイプライン */
  rules: Pipeline
}
