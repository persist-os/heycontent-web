export interface TextAreaRef {
  current: HTMLTextAreaElement | null;
}

export interface FormatTextParams {
  content: string;
  textAreaRef: TextAreaRef;
  onContentChange: (content: string) => void;
}

// Calculate cursor position for command palette
export const getCursorCoordinates = (
  textAreaRef: TextAreaRef,
  containerRef?: React.RefObject<HTMLElement>
) => {
  if (!textAreaRef.current) return { top: 100, left: 100 }
  
  const textarea = textAreaRef.current
  const rect = textarea.getBoundingClientRect()
  const start = textarea.selectionStart
  const value = textarea.value
  
  const textBeforeCursor = value.substring(0, start)
  const lines = textBeforeCursor.split('\n')
  const currentLineIndex = lines.length - 1
  const currentLineText = lines[currentLineIndex] || ''
  
  const computed = window.getComputedStyle(textarea)
  const fontSize = parseInt(computed.fontSize, 10) || 16
  const lineHeight = computed.lineHeight === 'normal' 
    ? fontSize * 1.2 
    : parseInt(computed.lineHeight, 10) || fontSize * 1.2
  const paddingTop = parseInt(computed.paddingTop, 10) || 0
  const paddingLeft = parseInt(computed.paddingLeft, 10) || 0
  const borderLeft = parseInt(computed.borderLeftWidth, 10) || 0
  const borderTop = parseInt(computed.borderTopWidth, 10) || 0
  
  const span = document.createElement('span')
  span.style.font = computed.font
  span.style.fontSize = computed.fontSize
  span.style.fontFamily = computed.fontFamily
  span.style.fontWeight = computed.fontWeight
  span.style.letterSpacing = computed.letterSpacing
  span.style.visibility = 'hidden'
  span.style.position = 'absolute'
  span.style.top = '-9999px'
  span.style.whiteSpace = 'pre'
  span.textContent = currentLineText || ' '
  
  document.body.appendChild(span)
  const textWidth = span.getBoundingClientRect().width
  document.body.removeChild(span)
  
  const cursorX = paddingLeft + borderLeft + textWidth
  const cursorY = paddingTop + borderTop + (currentLineIndex * lineHeight) + lineHeight
  
  const scrollLeft = textarea.scrollLeft || 0
  const scrollTop = textarea.scrollTop || 0
  
  const visibleCursorX = cursorX - scrollLeft
  const visibleCursorY = cursorY - scrollTop
  
  // Default: relative to viewport
  let baseLeft = rect.left
  let baseTop = rect.top
  
  // If containerRef is provided, calculate relative to container
  if (containerRef && containerRef.current) {
    const containerRect = containerRef.current.getBoundingClientRect()
    baseLeft = rect.left - containerRect.left
    baseTop = rect.top - containerRect.top
  }
  
  const paletteWidth = 600
  const paletteHeight = 400
  const margin = 20
  
  let finalLeft = baseLeft + visibleCursorX
  let finalTop = baseTop + visibleCursorY + 10
  
  // Clamp to container or viewport
  if (containerRef && containerRef.current) {
    const containerRect = containerRef.current.getBoundingClientRect()
    // Clamp within container
    if (finalLeft + paletteWidth > containerRect.width - margin) {
      finalLeft = containerRect.width - paletteWidth - margin
    }
    if (finalLeft < margin) {
      finalLeft = margin
    }
    if (finalTop + paletteHeight > containerRect.height - margin) {
      const abovePosition = baseTop + visibleCursorY - paletteHeight - 10
      if (abovePosition >= margin) {
        finalTop = abovePosition
      } else {
        finalTop = Math.max(margin, (containerRect.height - paletteHeight) / 2)
      }
    }
    finalTop = Math.max(margin, finalTop)
  } else {
    // Clamp within viewport
    if (finalLeft + paletteWidth > window.innerWidth - margin) {
      finalLeft = window.innerWidth - paletteWidth - margin
    }
    if (finalLeft < margin) {
      finalLeft = margin
    }
    if (finalTop + paletteHeight > window.innerHeight - margin) {
      const abovePosition = baseTop + visibleCursorY - paletteHeight - 10
      if (abovePosition >= margin) {
        finalTop = abovePosition
      } else {
        finalTop = Math.max(margin, (window.innerHeight - paletteHeight) / 2)
      }
    }
    finalTop = Math.max(margin, finalTop)
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 Cursor coordinates debug:', {
      textAreaRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      cursorPos: { x: cursorX, y: cursorY },
      visibleCursor: { x: visibleCursorX, y: visibleCursorY },
      base: { left: baseLeft, top: baseTop },
      final: { left: finalLeft, top: finalTop },
      scroll: { left: scrollLeft, top: scrollTop },
      textContent: `"${currentLineText}"`,
      textWidth,
      computed: {
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight,
        paddingTop: computed.paddingTop,
        paddingLeft: computed.paddingLeft,
        borderLeft: computed.borderLeftWidth,
        borderTop: computed.borderTopWidth,
        boxSizing: computed.boxSizing,
      },
      window: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
      },
      container: containerRef && containerRef.current ? containerRef.current.getBoundingClientRect() : null
    });
  }
  
  return {
    top: Math.round(finalTop),
    left: Math.round(finalLeft)
  }
}

// Format selected text or apply to new line
export const formatText = ({ content, textAreaRef, onContentChange }: FormatTextParams, prefix: string, suffix: string = '', newLineIfEmpty: boolean = false) => {
  if (!textAreaRef.current) return
  
  const textarea = textAreaRef.current
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.substring(start, end)
  
  let newContent: string
  let newCursorPosition: number
  
  if (selectedText) {
    const formattedText = `${prefix}${selectedText}${suffix}`
    newContent = content.substring(0, start) + formattedText + content.substring(end)
    newCursorPosition = start + formattedText.length
  } else if (newLineIfEmpty) {
    const textToInsert = `${prefix}${suffix}`
    newContent = content.substring(0, start) + textToInsert + content.substring(end)
    newCursorPosition = start + prefix.length
  } else {
    return
  }
  
  onContentChange(newContent)
  
  setTimeout(() => {
    if (textAreaRef.current) {
      textAreaRef.current.selectionStart = newCursorPosition
      textAreaRef.current.selectionEnd = newCursorPosition
      textAreaRef.current.focus()
    }
  }, 0)
}

// Insert content at cursor position
export const insertAtCursor = ({ content, textAreaRef, onContentChange }: FormatTextParams, text: string) => {
  if (!textAreaRef.current) return
  
  const textarea = textAreaRef.current
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  
  const newContent = content.substring(0, start) + text + content.substring(end)
  const newCursorPosition = start + text.length
  
  onContentChange(newContent)
  
  setTimeout(() => {
    if (textAreaRef.current) {
      textAreaRef.current.selectionStart = newCursorPosition
      textAreaRef.current.selectionEnd = newCursorPosition
      textAreaRef.current.focus()
    }
  }, 0)
}

// Bullet list handler
export const insertBulletList = (params: FormatTextParams) => {
  const { content, textAreaRef, onContentChange } = params
  if (!textAreaRef.current) return
  
  const textarea = textAreaRef.current
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.substring(start, end)
  
  if (selectedText) {
    const lines = selectedText.split('\n').filter(line => line.trim())
    const bulletList = lines.map(line => `- ${line.trim()}`).join('\n')
    const newContent = content.substring(0, start) + bulletList + content.substring(end)
    onContentChange(newContent)
    
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.selectionStart = start + bulletList.length
        textAreaRef.current.selectionEnd = start + bulletList.length
        textAreaRef.current.focus()
      }
    }, 0)
  } else {
    insertAtCursor(params, '\n- ')
  }
}

// Numbered list handler
export const insertNumberedList = (params: FormatTextParams) => {
  const { content, textAreaRef, onContentChange } = params
  if (!textAreaRef.current) return
  
  const textarea = textAreaRef.current
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.substring(start, end)
  
  if (selectedText) {
    const lines = selectedText.split('\n').filter(line => line.trim())
    const numberedList = lines.map((line, index) => `${index + 1}. ${line.trim()}`).join('\n')
    const newContent = content.substring(0, start) + numberedList + content.substring(end)
    onContentChange(newContent)
    
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.selectionStart = start + numberedList.length
        textAreaRef.current.selectionEnd = start + numberedList.length
        textAreaRef.current.focus()
      }
    }, 0)
  } else {
    insertAtCursor(params, '\n1. ')
  }
}

// Heading insertion
export const insertHeading = (params: FormatTextParams, level: number) => {
  const prefix = '#'.repeat(level) + ' '
  formatText(params, prefix, '', true)
}

// Link insertion
export const insertLink = (params: FormatTextParams, url: string, text: string) => {
  const linkMarkdown = `[${text}](${url})`
  insertAtCursor(params, linkMarkdown)
}

// Link embed insertion
export const insertLinkEmbed = (params: FormatTextParams, url: string) => {
  const embedMarkdown = `[embed](${url})`
  insertAtCursor(params, `\n\n${embedMarkdown}\n\n`)
}

// Table insertion
export const insertTable = (params: FormatTextParams, rows: number = 3, cols: number = 3) => {
  const headers = Array(cols).fill('Header').map((h, i) => `${h} ${i + 1}`).join(' | ')
  const separator = Array(cols).fill('---').join(' | ')
  const tableRows = Array(rows - 1).fill(null).map((_, rowIndex) => 
    Array(cols).fill('Cell').map((c, colIndex) => `${c} ${rowIndex + 1}-${colIndex + 1}`).join(' | ')
  )
  
  const tableMarkdown = [
    `| ${headers} |`,
    `| ${separator} |`,
    ...tableRows.map(row => `| ${row} |`)
  ].join('\n')
  
  insertAtCursor(params, `\n\n${tableMarkdown}\n\n`)
} 