import AnimateIn from "../utils/AnimateIn"
import ModuleFactory from "../utils/ModuleFactory"
import Router from "../utils/Router"
import Transitioner from '../utils/Transitioner'
import Trigger from './Trigger'

export default class Body {
  constructor ({ $container }) {
    this.$container = $container
    this.host = window.location.host
    this.loaderAnimationDuration = 300
    this.loaderVisible = false
    this.pageUpdates = 0

    this.constructElements()

    this.constructEvents()

    this.constructParams()

    this.doAnimateIn()

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.$container.addClass(Body.classes.ready)

        App.trigger(AnimateIn.events.start)
      })
    })
  }

  constructElements () {
    this.$data = this.$container.find(Body.selectors.data)
    this.$links = this.$container.find('a')
    this.$loader = this.$container.find(Body.selectors.loader)
    this.$main = this.$container.find(Body.selectors.main)

    this.$topOfPageTrigger = ModuleFactory.get({ moduleName: Trigger.moduleName }).filter(`[data-type="${Trigger.types.topOfPage}"]`).first()
  }

  constructEvents () {
    this.$container.on('click', 'a', (e) => this.handleLinkClick({ e }))

    App.on('popstate', (e) => this.handlePopState({ e }))
  }

  constructParams () {
    console.log(this.$data)

    this.data = JSON.parse(atob(this.$data.text()) || '{}')
  }

  doAnimateIn () {
    AnimateIn.init({ $container: this.$container, waitForStart: true })
  }

  async doLoaderAnimationTimeout () {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, this.loaderAnimationDuration)
    })
  }

  doLoaderHide () {
    Transitioner.doHide({ $element: this.$loader })

    this.$loader.removeClass(Body.classes.loaderVisible)

    this.loaderVisible = false
  }

  doLoaderShow () {
    Transitioner.doShow({ $element: this.$loader, displayValue: 'flex' })

    this.$loader.addClass(Body.classes.loaderVisible)

    this.loaderVisible = true
  }

  async doLoaderStart ({ topOfPage = true }) {
    const promises = [this.doLoaderAnimationTimeout()]

    this.doLoaderShow()

    if (!topOfPage) {
      promises.push(this.doTopOfPageTriggerVisible())
    }

    await Promise.all(promises)
  }

  async doPageUpdate ({ urlPathName, popState = false } = {}) {
    this.pageUpdates++

    const pageUpdateIndex = this.pageUpdates

    const topOfPage = this.$topOfPageTrigger[0][Trigger.moduleName].visible

    if (this.pageUpdates !== pageUpdateIndex) {
      return
    }

    if (!topOfPage) {
      this.doScrollToTop()
    }

    if (!popState && window.location.pathname === urlPathName) {
      return
    }

    App.trigger(Body.events.linkClickPageUpdate, { urlPathName })

    await this.doLoaderStart({ topOfPage })

    if (this.pageUpdates !== pageUpdateIndex) {
      return
    }

    await Router.navigate({ $main: this.$main, fetch: this.data.fetch[urlPathName] || {}, pushState: !popState })

    if (this.pageUpdates !== pageUpdateIndex) {
      return
    }

    this.doAnimateIn()

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.doLoaderHide()

        App.trigger(AnimateIn.events.start)
      })
    })
  }

  doScrollToTop () {
    window.scrollTo(0, 0)
  }

  async doTopOfPageTriggerVisible () {
    return new Promise((resolve) => {
      App.on(Trigger.events.visible, (e, data) => {
        if (data.type !== Trigger.types.topOfPage) {
          return
        }

        resolve()
      })
    })
  }

  handleLinkClick ({ e }) {
    App.on()

    const url = new URL(e.currentTarget.href)

    const host = url.host

    // only handle links on same host
    if (host !== this.host) {
      return
    }

    e.preventDefault()

    this.doPageUpdate({ urlPathName: url.pathname || '/' })
  }

  handlePopState ({ e }) {
    const url = new URL(e.target.location.href)

    this.doPageUpdate({ urlPathName: url.pathname || '/', popState: true })
  }
}

Body.classes = {
  loaderVisible: 'l-body__loader--visible',
  ready: 'l-body--ready',
}

Body.events = {
  linkClickPageUpdate: 'bodyLinkClickPageUpdate',
}

Body.moduleName = 'Body'

Body.selectors = {
  data: '.l-body__data',
  loader: '.l-body__loader',
  main: '.l-body__main',
}

ModuleFactory.init({ Module: Body, moduleName: Body.moduleName })
