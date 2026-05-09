declare module 'encoding-japanese' {
  type EncodingLabel =
    | 'UTF8' | 'UTF16' | 'UTF16BE' | 'UTF16LE'
    | 'SJIS' | 'SHIFT_JIS' | 'EUCJP' | 'JIS'
    | 'UNICODE' | 'ASCII' | 'BINARY' | 'AUTO'

  interface ConvertOptions {
    to: EncodingLabel
    from?: EncodingLabel
    type?: 'string' | 'arraybuffer' | 'array'
  }

  function detect(data: Uint8Array | number[]): EncodingLabel | false
  function convert(data: Uint8Array | number[] | string, options: ConvertOptions): string | ArrayBuffer | number[]

  export { detect, convert }
  export default { detect, convert }
}
