import $ from 'cash-dom'

import Body from './Body'
import ModuleFactory from '../utils/ModuleFactory'
import Trigger from './Trigger'

export default class Nav {
  constructor ({ $container }) {
    this.$container = $container
    this.linkMouseLeaveTimoutDuration = 150

    this.constructElements()

    this.constructEvents()

    this.doBarIndicatorStart()
  }

  constructElements () {
    this.$barIndicator = this.$container.find(Nav.selectors.barIndicator)
    this.$body = $('body')
    this.$link = this.$container.find(Nav.selectors.link)

    this.$linkActive = this.$link.filter(`.${Nav.classes.linkActive}`)
  }

  constructEvents () {
    this.$container
      .on('mouseenter', Nav.selectors.link, (e) => this.handleLinkMouseEnter({ e }))
      .on('mouseleave', Nav.selectors.link, (e) => this.handleLinkMouseLeave({ e }))

    App
      .on(Body.events.linkClickPageUpdate, (e, data) => this.handleBodyLinkClickPageUpdate({ urlPathName: data.urlPathName }))
      .on(Trigger.events.nav.hidden, () => this.handleNavTriggerHidden())
      .on(Trigger.events.nav.visible, () => this.handleNavTriggerVisible())
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
        this.$barIndicator.addClass(Nav.classes.barIndicatorStarted)
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
    this.$container.addClass(Nav.classes.sticky)
  }

  handleNavTriggerVisible () {
    this.$container.removeClass(Nav.classes.sticky)
  }
}

Nav.classes = {
  barIndicatorStarted: 'c-nav__bar-indicator--started',
  linkActive: 'c-nav__link--active',
  sticky: 'c-nav--sticky',
}

Nav.moduleName = 'Nav'

Nav.selectors = {
  barIndicator: '.c-nav__bar-indicator',
  link: '.c-nav__link',
  trigger: '.c-nav-trigger',
}

ModuleFactory.init({ Module: Nav, moduleName: Nav.moduleName })
