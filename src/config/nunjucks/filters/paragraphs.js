/**
 * @param {string} text
 * @returns {string[]}
 */
function paragraphs (text) {
  if (!text) {
    return []
  }
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
}

export { paragraphs }
