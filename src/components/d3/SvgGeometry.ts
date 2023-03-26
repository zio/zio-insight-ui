export class SvgGeometry {
  svgWidth: number
  svgHeight: number
  width: number
  height: number

  constructor(ref: HTMLElement, padding = 0) {
    this.svgWidth = ref.getBoundingClientRect().width
    this.svgHeight = ref.getBoundingClientRect().height
    this.width = this.svgWidth - 2 * padding
    this.height = this.svgHeight - 2 * padding
  }
}
