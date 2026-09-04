const SVG_NS = 'http://www.w3.org/2000/svg'

export type CursorConfig = {
  color: string
  pulseStartSize: number
  pulseEndSize: number
  pulseDuration: number
  pulseStrokeWidth: number
}

export type Cursor = {
  moveTo(x: number, y: number): void
  setVisible(visible: boolean): void
  pulse(x: number, y: number): void
  destroy(): void
}

export function createCursor(svg: SVGSVGElement, dot: SVGCircleElement, config: CursorConfig): Cursor {
  let visible = false

  return {
    moveTo(x, y) {
      dot.setAttribute('cx', String(x))
      dot.setAttribute('cy', String(y))
    },
    setVisible(next) {
      if (visible === next) return
      visible = next
      dot.style.opacity = next ? '1' : '0'
    },
    pulse(x, y) {
      const circle = document.createElementNS(SVG_NS, 'circle')
      circle.setAttribute('cx', String(x))
      circle.setAttribute('cy', String(y))
      circle.setAttribute('fill', 'none')
      circle.setAttribute('stroke', config.color)
      circle.setAttribute('stroke-width', String(config.pulseStrokeWidth))
      circle.style.r = `${config.pulseStartSize / 2}px`
      circle.style.opacity = '0.9'
      circle.style.transition = `r ${config.pulseDuration}ms ease-out, opacity ${config.pulseDuration}ms ease-out`
      svg.appendChild(circle)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          circle.style.r = `${config.pulseEndSize / 2}px`
          circle.style.opacity = '0'
        })
      })

      window.setTimeout(() => {
        circle.remove()
      }, config.pulseDuration + 100)
    },
    destroy() {
      svg.querySelectorAll('circle:not([data-cursor-dot])').forEach((node) => node.remove())
    },
  }
}
