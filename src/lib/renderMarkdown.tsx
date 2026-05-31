import React from 'react'

/** Render inline markdown: **bold**, *italic*, [link](url) */
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  // Pattern: **bold**, *italic*, [text](url)
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)]+)\))/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[0].startsWith('**')) {
      parts.push(<strong key={key++} className="font-semibold text-gray-900">{match[2]}</strong>)
    } else if (match[0].startsWith('*')) {
      parts.push(<em key={key++} className="italic">{match[3]}</em>)
    } else {
      parts.push(<a key={key++} href={match[5]} className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">{match[4]}</a>)
    }
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

/** Render a markdown string as React nodes (paragraphs, lists, inline formatting) */
export function renderMarkdown(body: string): React.ReactNode {
  const lines = body.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // Blank line — render as spacing
    if (line.trim() === '') {
      nodes.push(<div key={key++} className="h-2" />)
      i++
      continue
    }

    // Bullet list block
    if (/^\s*-\s/.test(line)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && /^\s*-\s/.test(lines[i])) {
        items.push(<li key={key++} className="leading-relaxed">{renderInline(lines[i].replace(/^\s*-\s/, ''))}</li>)
        i++
      }
      nodes.push(<ul key={key++} className="my-1 pl-5 list-disc space-y-0.5">{items}</ul>)
      continue
    }

    // Numbered list block
    if (/^\s*\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = []
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
        items.push(<li key={key++} className="leading-relaxed">{renderInline(lines[i].replace(/^\s*\d+\.\s/, ''))}</li>)
        i++
      }
      nodes.push(<ol key={key++} className="my-1 pl-5 list-decimal space-y-0.5">{items}</ol>)
      continue
    }

    // Regular paragraph line
    nodes.push(<p key={key++} className="my-1 leading-relaxed">{renderInline(line)}</p>)
    i++
  }

  return <>{nodes}</>
}
