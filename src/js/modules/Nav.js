import $ from 'cash-dom'

import Body from './Body'
import ModuleFactory from '../utils/ModuleFactory'
import Trigger from './Trigger'

export default class Nav {
  static name = 'Nav'
  static values = {
    classes: {
      barIndicatorStarted: 'c-nav__bar-indicator--started',
      linkActive: 'c-nav__link--active',
      sticky: 'c-nav--sticky',
    },
    selectors: {
      barIndicator: '.c-nav__bar-indicator',
      link: '.c-nav__link',
      trigger: '.c-nav-trigger',
    }
  }

  constructor ({ $container }) {
    this.$container = $container
    this.linkMouseLeaveTimoutDuration = 150

    this.constructElements()

    this.constructEvents()

    this.doBarIndicatorStart()
  }

  constructElements () {
    this.$barIndicator = this.$container.find(Nav.values.selectors.barIndicator)
    this.$link = this.$container.find(Nav.values.selectors.link)

    this.$linkActive = this.$link.filter(`.${Nav.values.classes.linkActive}`)
  }

  constructEvents () {
    this.$container
      .on('mouseenter', Nav.values.selectors.link, (e) => this.handleLinkMouseEnter({ e }))
      .on('mouseleave', Nav.values.selectors.link, (e) => this.handleLinkMouseLeave({ e }))

    App
      .on(Body.values.events.linkClickPageUpdate, (e, data) => this.handleBodyLinkClickPageUpdate({ urlPathName: data.urlPathName }))
      .on(Trigger.values.events.nav.hidden, () => this.handleNavTriggerHidden())
      .on(Trigger.values.events.nav.visible, () => this.handleNavTriggerVisible())
  }

  doBarIndicatorMove ({ $link }) {
    if (!$link.length) {
      return
    }

    const linkLeft = $link.position().left
    const linkWidth = $link.outerWidth()

    this.$barIndicator.css({
      '--nav-bar-indicator-x': `${linkLeft * 0.0625}rem`,
      'width': linkWidth,
    })
  }

  doBarIndicatorReset () {
    this.doBarIndicatorMove({ $link: this.$linkActive })
  }

  async doBarIndicatorStart () {
    this.doBarIndicatorReset()

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.$barIndicator.addClass(Nav.values.classes.barIndicatorStarted)
      })
    })
  }

  doLinkMouseLeaveTimeoutStart ({ callback }) {
    this.doLinkMouseLeaveTimeoutStop()

    this.linkMouseLeaveTimeout = setTimeout(() => callback(), this.linkMouseLeaveTimoutDuration)
  }

  doLinkMouseLeaveTimeoutStop () {
    if (!this.linkMouseLeaveTimeout) {
      return
    }

    clearTimeout(this.linkMouseLeaveTimeout)

    this.linkMouseLeaveTimeout = null
  }

  handleLinkClick ({ e }) {
    this.doLinkMouseLeaveTimeoutStop()

    const $link = $(e.currentTarget)

    if ($link === this.$linkActive) {
      return
    }

    this.$linkActive = $link
  }

  handleLinkMouseEnter ({ e }) {
    this.doLinkMouseLeaveTimeoutStop()

    this.doBarIndicatorMove({ $link: $(e.currentTarget) })
  }

  handleLinkMouseLeave ({ e }) {
    this.doLinkMouseLeaveTimeoutStart({ callback: () => this.doBarIndicatorReset() })
  }

  handleBodyLinkClickPageUpdate ({ urlPathName }) {
    const $link = this.$link.filter(`[href="${urlPathName}"]`)

    if (!$link.length || this.$linkActive === $link) {
      return
    }

    this.doLinkMouseLeaveTimeoutStop()

    this.$linkActive = $link

    this.doBarIndicatorMove({ $link: $link })
  }

  handleNavTriggerHidden () {
    this.$container.addClass(Nav.values.classes.sticky)
  }

  handleNavTriggerVisible () {
    this.$container.removeClass(Nav.values.classes.sticky)
  }
}

ModuleFactory.init({ Module: Nav })
