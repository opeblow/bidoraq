import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const ignoredDirectories = new Set(['node_modules', 'dist', '.git'])
const markdownFiles = []

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath)
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      markdownFiles.push(fullPath)
    }
  }
}

function slugify(heading) {
  return heading
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
}

function anchorsFor(file) {
  const text = fs.readFileSync(file, 'utf8')
  const anchors = new Set()
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^#{1,6}\s+(.+?)\s*#*$/)
    if (match) anchors.add(slugify(match[1]))
  }
  return anchors
}

walk(root)

const anchorCache = new Map()
const errors = []
let fileLinks = 0
let anchorLinks = 0

for (const file of markdownFiles) {
  const text = fs.readFileSync(file, 'utf8')
  const relativeFile = path.relative(root, file).replaceAll(path.sep, '/')

  for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    const rawTarget = match[1].trim()
    if (/^(https?:|mailto:|data:)/i.test(rawTarget)) continue

    const separatorIndex = rawTarget.indexOf('#')
    const rawPath = separatorIndex === -1 ? rawTarget : rawTarget.slice(0, separatorIndex)
    const rawAnchor = separatorIndex === -1 ? '' : rawTarget.slice(separatorIndex + 1)
    const targetFile = rawPath ? path.resolve(path.dirname(file), decodeURIComponent(rawPath)) : file

    if (rawPath) {
      fileLinks += 1
      if (!fs.existsSync(targetFile)) {
        errors.push(`${relativeFile}: missing link target ${rawTarget}`)
      }
    }

    if (rawAnchor && fs.existsSync(targetFile) && targetFile.toLowerCase().endsWith('.md')) {
      anchorLinks += 1
      if (!anchorCache.has(targetFile)) anchorCache.set(targetFile, anchorsFor(targetFile))
      const anchors = anchorCache.get(targetFile)
      if (!anchors.has(decodeURIComponent(rawAnchor).toLowerCase())) {
        errors.push(`${relativeFile}: missing anchor ${rawAnchor} in ${rawTarget}`)
      }
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log(`Checked ${markdownFiles.length} markdown files, ${fileLinks} file links, and ${anchorLinks} anchors.`)
