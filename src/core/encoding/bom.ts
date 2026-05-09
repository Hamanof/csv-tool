/** UTF-8 BOM バイト列 */
const UTF8_BOM = new Uint8Array([0xef, 0xbb, 0xbf])

/** バイナリ先頭に UTF-8 BOM があるかを判定する */
export function hasUtf8Bom(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 3 &&
    bytes[0] === UTF8_BOM[0] &&
    bytes[1] === UTF8_BOM[1] &&
    bytes[2] === UTF8_BOM[2]
  )
}

/**
 * BOM を除去した Uint8Array を返す。
 * BOM がなければそのまま返す（コピーなし）。
 */
export function stripUtf8Bom(bytes: Uint8Array): Uint8Array {
  return hasUtf8Bom(bytes) ? bytes.slice(3) : bytes
}

/** UTF-8 BOM を先頭に付与した Uint8Array を返す */
export function prependUtf8Bom(bytes: Uint8Array): Uint8Array {
  const result = new Uint8Array(bytes.length + 3)
  result.set(UTF8_BOM)
  result.set(bytes, 3)
  return result
}
