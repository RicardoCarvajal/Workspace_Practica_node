/** Minimal Markdown → safe HTML (escape first, then limited formatting). */
export function renderMarkdownSafe(source: string): string {
  const escaped = escapeHtml(source)
  const withCodeBlocks = escaped.replace(/```([\s\S]*?)```/g, (_m, code: string) => {
    return `<pre class="md-code"><code>${code.trim()}</code></pre>`
  })
  const lines = withCodeBlocks.split('\n')
  const out: string[] = []
  let inList = false

  const flushList = (): void => {
    if (inList) {
      out.push('</ul>')
      inList = false
    }
  }

  for (const line of lines) {
    if (line.startsWith('<pre')) {
      flushList()
      out.push(line)
      continue
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      flushList()
      const level = heading[1].length
      out.push(`<h${level}>${inlineFormat(heading[2])}</h${level}>`)
      continue
    }
    if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        out.push('<ul>')
        inList = true
      }
      out.push(`<li>${inlineFormat(line.replace(/^[-*]\s+/, ''))}</li>`)
      continue
    }
    flushList()
    if (line.trim() === '') {
      out.push('')
      continue
    }
    out.push(`<p>${inlineFormat(line)}</p>`)
  }
  flushList()
  return out.join('\n')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inlineFormat(s: string): string {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noreferrer">$1</a>')
}
