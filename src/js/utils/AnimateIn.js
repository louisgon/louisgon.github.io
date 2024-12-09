import $ from 'cash-dom'

export default class AnimateIn {
  constructor ({ $container, waitForStart = false } = {}) {
    this.$container = $container
    this.intersecting = false
    this.ready = false

    this.doStart()

    if (waitForStart) {
      App.on(AnimateIn.events.start, () => this.constructObservers())

      return
    }

    this.constructObservers()
  }

  static init ({ $container, waitForStart = false } = {}) {
    $container
      .find(AnimateIn.selectors.dataAnimateIn)
      .each((i, elem) => new AnimateIn({ $container: $(elem), waitForStart }))
  }

  constructAnimateObserver () {
    this.animateObserver = new IntersectionObserver((entries) => this.handleAnimateObserver({ entries }))

    this.animateObserver.observe(this.$container[0])
  }

  constructLoadObserver () {
    if (!this.$container.attr('src') || this.$container[0].complete) {
      this.ready = true

      return
    }

    this.$container.one('load', () => {
      this.ready = true

      if (this.intersecting) {
        this.doAnimate()
      }
    })
  }

  constructObservers () {
    this.constructAnimateObserver()

    this.constructLoadObserver()
  }

  doAnimate () {
    this.$container
      .addClass(AnimateIn.classes[this.animation] || AnimateIn.classes.fade)
      .addClass(AnimateIn.classes.visible)
  }

  doStart () {
    let animation = this.$container.data('animateIn') || 'fade'

    if (animation === 'fadeY') {
      animation = window.scrollY > this.initialPosition
        ? 'fadeUp'
        : 'fadeDown'
    }

    this.$container.addClass(AnimateIn.classes.container)

    this.animation = animation
  }

  handleAnimateObserver ({ entries }) {
    entries.forEach((entry) => {
      this.intersecting = entry.isIntersecting

      if (!this.ready || !this.intersecting) {
        return
      }

      this.doAnimate()
    })
  }
}

AnimateIn.classes = {
  container: 'u-animate-in',
  fade: 'u-animate-in--fade',
  fadeDown: 'u-animate-in--fade-down',
  fadeLeft: 'u-animate-in--fade-left',
  fadeRight: 'u-animate-in--fade-right',
  fadeUp: 'u-animate-in--fade-up',
  fadeZoom: 'u-animate-in--fade-zoom',
  visible: 'u-animate-in--visible',
}

AnimateIn.events = {
  start: 'animateInStart',
}

AnimateIn.selectors = {
  dataAnimateIn: '[data-animate-in]',
}
