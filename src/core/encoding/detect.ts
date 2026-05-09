import Encoding from 'encoding-japanese'
import type { DetectedEncoding, EncodingType } from '../../types/encoding'
import { hasUtf8Bom } from './bom'

/**
 * バイト列からエンコーディングを推定する。
 * 先頭の最大 4MB を使って判定する。
 */
export function detectEncoding(bytes: Uint8Array): DetectedEncoding {
  // BOM が付いていれば確実に UTF-8-BOM
  if (hasUtf8Bom(bytes)) {
    return { encoding: 'UTF-8-BOM', confidence: 'high' }
  }

  const sample = bytes.length > 4 * 1024 * 1024
    ? bytes.slice(0, 4 * 1024 * 1024)
    : bytes

  const detected = Encoding.detect(sample)

  // encoding-japanese が返すコード名を正規化
  const mapping: Record<string, EncodingType> = {
    UTF8: 'UTF-8',
    UNICODE: 'UTF-8',
    SJIS: 'SHIFT_JIS',
    SHIFT_JIS: 'SHIFT_JIS',
    EUCJP: 'SHIFT_JIS',
    JIS: 'SHIFT_JIS',
  }

  if (detected && detected in mapping) {
    return {
      encoding: mapping[detected] ?? 'UTF-8',
      confidence: 'high',
    }
  }

  // 判定不能な場合は UTF-8 として扱う
  return { encoding: 'UTF-8', confidence: 'low' }
}
