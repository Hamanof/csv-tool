export function buildOutputFilename(originalName: string): string {
  const dot = originalName.lastIndexOf('.')
  if (dot === -1) return `${originalName}_processed`
  const base = originalName.slice(0, dot)
  const ext = originalName.slice(dot)
  return `${base}_processed${ext}`
}
