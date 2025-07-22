import { PALETTE_CONFIG } from '../components/InlineCommandPalette.constants';

export interface Position {
  left: number;
  top: number;
}

export function calculatePalettePosition(position: Position): Position {
  const { width, maxHeight, margin } = PALETTE_CONFIG;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let finalLeft = position.left;
  let finalTop = position.top;
  
  // Adjust horizontal position
  if (finalLeft + width > viewportWidth - margin) {
    finalLeft = Math.max(margin, viewportWidth - width - margin);
  }
  if (finalLeft < margin) {
    finalLeft = margin;
  }
  
  // Adjust vertical position
  if (finalTop + maxHeight > viewportHeight - margin) {
    finalTop = Math.max(margin, viewportHeight - maxHeight - margin);
  }
  if (finalTop < margin) {
    finalTop = margin;
  }
  
  return { left: finalLeft, top: finalTop };
} 