import { isNumber } from '../is'
import CuElement from './CuElement'

interface TextStyleProps {
  x?: number;
  y?: number;
  text?: string;
  color?: string;
  size?: number;
  fontWeight?: string | number;
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: string;
}
interface TextProps {
  style?: TextStyleProps;
}

class CUText extends CuElement<TextProps> {
  type = 'text';
  measureText: TextMetrics | null = null;

  constructor(opts?: TextProps) {
    super(opts)
  }

  draw() {
    const ctx = this.__cu?.ctx
    if (!ctx) return

    ctx.save()
    ctx.textBaseline = 'top'
    const {
      text = '',
      x = 0,
      y = 0,
      color = 'black',
      size = 16,
      fontWeight = '',
      textAlign = 'left',
      fontFamily
    } = this.style
    
    let font = `${fontWeight}`
    font += isNumber(size) ? ` ${(Math.round(size * 100) / 100)}px` : ` ${size}`
    font += ` ${fontFamily ? fontFamily : 'serif'}`
    ctx.font = font
    this.measureText = ctx.measureText(text)

    ctx.textAlign = textAlign
    ctx.fillStyle = color
    ctx.fillText(text, x, y)
    ctx.restore()
  }
}

export default CUText
