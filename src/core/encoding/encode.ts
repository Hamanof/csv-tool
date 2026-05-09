import Encoding from 'encoding-japanese'
import type { EncodingType } from '../../types/encoding'
import { hasUtf8Bom, prependUtf8Bom } from './bom'

/**
 * 文字列を指定エンコーディングの Uint8Array に変換する。
 *
 * @param text 変換する文字列
 * @param encoding 出力エンコーディング
 * @param addBom BOM を付与するか（UTF-8-BOM のときのみ有効）
 */
export function encodeText(
  text: string,
  encoding: EncodingType,
  addBom = false,
): Uint8Array {
  if (encoding === 'UTF-8' || encoding === 'UTF-8-BOM') {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(text)
    const shouldAddBom = addBom || encoding === 'UTF-8-BOM'
    return shouldAddBom ? prependUtf8Bom(bytes) : bytes
  }

  // Shift_JIS / CP932
  const result = Encoding.convert(text, {
    to: 'SJIS',
    from: 'UNICODE',
    type: 'arraybuffer',
  })
  return new Uint8Array(result as ArrayBuffer)
}

/**
 * 元の入力バイト列を読んで「同じエンコーディング・同じBOM有無」で出力するための設定を返す。
 */
export function deriveOutputEncoding(
  inputBytes: Uint8Array,
  inputEncoding: EncodingType,
): { encoding: EncodingType; addBom: boolean } {
  const addBom = inputEncoding === 'UTF-8-BOM' || hasUtf8Bom(inputBytes)
  return { encoding: inputEncoding, addBom }
}
