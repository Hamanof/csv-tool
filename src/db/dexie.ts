import Dexie, { type Table } from 'dexie'
import type { Template } from '../types/template'

class CsvToolDb extends Dexie {
  templates!: Table<Template, string>

  constructor() {
    super('csv-tool-db')
    this.version(1).stores({
      templates: 'id, name, createdAt, updatedAt',
    })
  }
}

export const db = new CsvToolDb()
