import { db } from './dexie'
import type { Template } from '../types/template'
import type { OutputColumn } from '../types/rule'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export async function listTemplates(): Promise<Template[]> {
  return db.templates.orderBy('updatedAt').reverse().toArray()
}

export async function saveTemplate(name: string, outputColumns: OutputColumn[]): Promise<Template> {
  const now = new Date().toISOString()
  const template: Template = {
    schemaVersion: 1,
    id: generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    header: { mode: 'single' },
    outputColumns,
    outputEncoding: 'preserve',
  }
  await db.templates.add(template)
  return template
}

export async function deleteTemplate(id: string): Promise<void> {
  await db.templates.delete(id)
}

export async function getTemplate(id: string): Promise<Template | undefined> {
  return db.templates.get(id)
}
