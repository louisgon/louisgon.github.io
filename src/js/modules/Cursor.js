import $ from 'cash-dom'
import { gsap } from 'gsap'
import { debounce } from 'lodash'

import ModuleFactory from '../utils/ModuleFactory'

export default class Cursor {
  constructor ({ $container }) {
    this.$container = $container
    this.cursorVisible = false

    this.constructEvents()
  }

  constructEvents () {
    document.addEventListener('mousedown', debounce((event) => this.handleMouseDown({ event }), 5))
    document.addEventListener('mouseleave', debounce((event) => this.handleMouseLeave({ event }), 5))
    document.addEventListener('mousemove', debounce((event) => this.handleMouseMove({ event })), 5)
    document.addEventListener('mouseout', debounce((event) => this.handleMouseHover({ event }), 5))
    document.addEventListener('mouseover', debounce((event) => this.handleMouseHover({ event }), 5))
    document.addEventListener('mouseup', debounce(() => this.handleMouseUp(), 5))
  }

  doCursorHide () {
    this.$container.removeClass(Cursor.classes.visible)

    this.cursorVisible = false
  }

  doCursorMove ({ mouseX, mouseY }) {
    this.$container.css({
      transform: `translate3d(${mouseX}px, ${mouseY}px, 0)`,
    })
  }

  doCursorShow () {
    this.$container.addClass(Cursor.classes.visible)

    this.cursorVisible = true
  }

  getTargetClickableState ({ $target }) {
    return [
      'a',
      'button',
    ].some(tag => $target.is(tag) || $target.closest(tag).length > 0)
  }

  handleMouseDown ({ event }) {
    if (event.button !== 0) {
      return
    }

    this.$container.addClass(Cursor.classes.clicking)
  }

  handleMouseHover ({ event }) {
    if (this.getTargetClickableState({ $target: $(event.target) })) {
      this.$container.addClass(Cursor.classes.hover)

      return
    }

    this.$container.removeClass(Cursor.classes.hover)
  }

  handleMouseLeave ({ event }) {
    if (!this.cursorVisible) {
      return
    }

    this.doCursorHide()
  }

  handleMouseMove ({ event }) {
    const mouseX = event.clientX
    const mouseY = event.clientY

    if (!this.cursorVisible) {
      this.doCursorMove({ mouseX, mouseY })

      requestAnimationFrame(() => {
        this.doCursorShow()
      })

      return
    }

    gsap.to(this.$container, {
      duration: 0.1,
      x: mouseX,
      y: mouseY,
    })
  }

  handleMouseUp () {
    this.$container.removeClass(Cursor.classes.clicking)
  }
}

Cursor.classes = {
  clicking: 'c-cursor--clicking',
  hover: 'c-cursor--hovering',
  visible: 'c-cursor--visible',
}

Cursor.moduleName = 'Cursor'

ModuleFactory.init({ Module: Cursor, moduleName: Cursor.moduleName })
