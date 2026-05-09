import { describe, it, expect } from 'vitest'
import { hasUtf8Bom, stripUtf8Bom, prependUtf8Bom } from '../../src/core/encoding/bom'
import { decodeAll } from '../../src/core/encoding/decode'
import { encodeText } from '../../src/core/encoding/encode'

// --- BOM ---

describe('hasUtf8Bom', () => {
  it('BOM 付き配列を検出する', () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x41])
    expect(hasUtf8Bom(bytes)).toBe(true)
  })

  it('BOM なし配列を false にする', () => {
    const bytes = new Uint8Array([0x41, 0x42])
    expect(hasUtf8Bom(bytes)).toBe(false)
  })

  it('3バイト未満は false', () => {
    expect(hasUtf8Bom(new Uint8Array([0xef, 0xbb]))).toBe(false)
  })
})

describe('stripUtf8Bom', () => {
  it('BOM を除去する', () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x41, 0x42])
    const stripped = stripUtf8Bom(bytes)
    expect(stripped).toEqual(new Uint8Array([0x41, 0x42]))
  })

  it('BOM がなければそのまま返す', () => {
    const bytes = new Uint8Array([0x41, 0x42])
    expect(stripUtf8Bom(bytes)).toBe(bytes)
  })
})

describe('prependUtf8Bom', () => {
  it('BOM を先頭に付与する', () => {
    const bytes = new Uint8Array([0x41])
    const result = prependUtf8Bom(bytes)
    expect(result[0]).toBe(0xef)
    expect(result[1]).toBe(0xbb)
    expect(result[2]).toBe(0xbf)
    expect(result[3]).toBe(0x41)
  })
})

// --- decode / encode ラウンドトリップ ---

describe('UTF-8 ラウンドトリップ', () => {
  it('ASCII テキスト', () => {
    const text = 'hello,world\nfoo,bar'
    const encoded = encodeText(text, 'UTF-8')
    const decoded = decodeAll(encoded, 'UTF-8')
    expect(decoded).toBe(text)
  })

  it('日本語テキスト', () => {
    const text = '氏名,年齢\n山田太郎,30'
    const encoded = encodeText(text, 'UTF-8')
    const decoded = decodeAll(encoded, 'UTF-8')
    expect(decoded).toBe(text)
  })

  it('BOM 付き UTF-8 のデコードで BOM が除去される', () => {
    const text = 'hello'
    const encoded = encodeText(text, 'UTF-8-BOM')
    expect(encoded[0]).toBe(0xef)
    const decoded = decodeAll(encoded, 'UTF-8-BOM')
    expect(decoded).toBe('hello')
  })
})
