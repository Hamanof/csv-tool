export type EncodingType = 'UTF-8' | 'UTF-8-BOM' | 'SHIFT_JIS' | 'CP932'

export interface DetectedEncoding {
  encoding: EncodingType
  confidence: 'high' | 'low'
}
