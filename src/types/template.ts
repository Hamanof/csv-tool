import type { OutputColumn } from './rule'

export interface Template {
  schemaVersion: 1
  id: string
  name: string
  createdAt: string
  updatedAt: string
  header: {
    mode: 'single'
  }
  outputColumns: OutputColumn[]
  outputEncoding: 'preserve'
}
