import Encoding from 'encoding-japanese'
import type { EncodingType } from '../../types/encoding'
import { stripUtf8Bom } from './bom'

/**
 * SJIS の第1バイト範囲かを判定する。
 * チャンク境界が2バイト文字の途中で切れる問題を回避するために使用する。
 */
function isSjisMb1(byte: number): boolean {
  return (byte >= 0x81 && byte <= 0x9f) || (byte >= 0xe0 && byte <= 0xfc)
}

/**
 * Uint8Array をエンコーディングに従って文字列にデコードする。
 *
 * UTF-8（BOM有無）は TextDecoder を使ってストリーミングデコード可能。
 * Shift_JIS / CP932 は encoding-japanese を使い、バイト境界処理を自前で行う。
 */
export function createDecoder(encoding: EncodingType): {
  decode: (chunk: Uint8Array, isLast?: boolean) => string
  reset: () => void
} {
  if (encoding === 'UTF-8' || encoding === 'UTF-8-BOM') {
    const decoder = new TextDecoder('utf-8', { fatal: false })
    let firstChunk = true

    return {
      decode(chunk: Uint8Array, isLast = false): string {
        let data = chunk
        // 先頭チャンクの BOM を除去する
        if (firstChunk) {
          data = stripUtf8Bom(chunk)
          firstChunk = false
        }
        return decoder.decode(data, { stream: !isLast })
      },
      reset() {
        firstChunk = true
      },
    }
  }

  // Shift_JIS / CP932
  let remainder: Uint8Array = new Uint8Array(0)

  return {
    decode(chunk: Uint8Array, _isLast = false): string {
      // 前チャンクの余りバイトを先頭に結合する
      let data: Uint8Array
      if (remainder.length > 0) {
        data = new Uint8Array(remainder.length + chunk.length)
        data.set(remainder)
        data.set(chunk, remainder.length)
        remainder = new Uint8Array(0)
      } else {
        data = chunk
      }

      // 末尾が SJIS 第1バイトで終わっていれば次チャンクへ保留する
      const lastByte = data[data.length - 1]
      if (lastByte !== undefined && isSjisMb1(lastByte)) {
        remainder = data.slice(data.length - 1)
        data = data.slice(0, data.length - 1)
      }

      if (data.length === 0) return ''

      const converted = Encoding.convert(data, {
        to: 'UNICODE',
        from: 'SJIS',
        type: 'string',
      })
      return typeof converted === 'string' ? converted : ''
    },
    reset() {
      remainder = new Uint8Array(0)
    },
  }
}

/**
 * Uint8Array 全体を一度にデコードする（小さなファイル用）。
 */
export function decodeAll(bytes: Uint8Array, encoding: EncodingType): string {
  const decoder = createDecoder(encoding)
  return decoder.decode(bytes, true)
}
