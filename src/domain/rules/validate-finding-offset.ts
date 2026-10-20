export interface ValidatedOffset {
  startOffset: number;
  endOffset: number;
}

/**
 * A IA nunca pode apontar trechos que não existem na mensagem original (CLAUDE.md seção 4).
 * Se os offsets não baterem com original_text, tenta relocalizar o texto antes de descartar.
 */
export function validateFindingOffset(
  messageContent: string,
  startOffset: number,
  endOffset: number,
  originalText: string,
): ValidatedOffset | null {
  if (messageContent.slice(startOffset, endOffset) === originalText) {
    return { startOffset, endOffset };
  }

  const relocatedIndex = messageContent.indexOf(originalText);
  if (relocatedIndex === -1) return null;

  return { startOffset: relocatedIndex, endOffset: relocatedIndex + originalText.length };
}
