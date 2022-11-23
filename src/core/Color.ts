
export class Color {
  public r: number;
  public g: number;
  public b: number;
  public a: number;

  constructor(r: number, g: number, b: number, a: number) {
    this.r = r || 128
    this.g = g || 128
    this.b = b || 128
    this.a = a || 1
  }

  toHex() {
    return '#' + this.r.toString(16) + this.g.toString(16) + this.b.toString(16);
  }

  toRgb() {
    return `rgb(${this.r}, ${this.g}, ${this.b})`;
  }

  toRgba() {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }
}

export function fromHex(s : string) : Color {

  var trimmed = s.trim()

  if (trimmed.indexOf('#') === 0) {
    trimmed = trimmed.substring(trimmed.indexOf('#') + 1)
    const r = parseInt(trimmed.substring(0, 2), 16)
    const g = parseInt(trimmed.substring(2, 2), 16)
    const b = parseInt(trimmed.substring(4, 2), 16)
    return new Color(r,g,b,1)
  } else {
    throw "Invalid Hex Color Spec" 
  }
}

export function fromRGB(rgb: string) : Color { 
  const RGB_COLOR_REGEX = /\((\d+),\s*(\d+),\s*(\d+)(,\s*(\d*.\d*))?\)/;
  const trimmed = rgb.trim()

  if (trimmed.indexOf('rgb') === 0) {
    const res = RGB_COLOR_REGEX.exec(trimmed)
    const r = parseInt(res![1], 10)
    const g = parseInt(res![2], 10)
    const b = parseInt(res![3], 10)
    const a = res![5] ? parseFloat(res![5]) : 1

    return new Color(r,g,b,a)
  } else {
    throw "Invalid RGB Color Spec"
  }
}

export function fromRandom() : Color {

  const max = 200

  const r = Math.floor(Math.random() * max)
  const g = Math.floor(Math.random() * max)
  const b = Math.floor(Math.random() * max)
  const a = (Math.random() * 3 + 1) / 10

  return new Color(r,g,b,a)
}
