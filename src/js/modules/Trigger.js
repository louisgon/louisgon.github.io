import $ from 'cash-dom'
import { camelCase } from 'lodash'

import ModuleFactory from '../utils/ModuleFactory'

export default class Trigger {
  constructor ({ $container }) {
    this.$container = $container
    this.visible = false

    this.constructObserver()
  }

  constructObserver () {
    this.observer = new IntersectionObserver((entries) => this.handleObserver({ entries }))

    this.observer.observe(this.$container[0])
  }

  doTriggerHidden ({ type }) {
    this.visible = false

    App.trigger(Trigger.events[camelCase(type)].hidden)
  }

  doTriggerVisible ({ type }) {
    this.visible = true

    App.trigger(Trigger.events[camelCase(type)].visible)
  }

  handleObserver ({ entries }) {
    entries.forEach((entry) => {
      const type = $(entry.target).data('type') || 'None'

      if (entry.isIntersecting) {
        this.doTriggerVisible({ type })

        return
      }

      this.doTriggerHidden({ type })
    })
  }
}

Trigger.events = {
  nav: {
    hidden: 'triggerNavHidden',
    visible: 'triggerNavVisible',
  },
  topOfPage: {
    hidden: 'triggerTopOfPageHidden',
    visible: 'triggerTopOfPageVisible',
  }
}

Trigger.moduleName = 'Trigger'

Trigger.types = {
  nav: 'nav',
  topOfPage: 'top-of-page',
}

ModuleFactory.init({ Module: Trigger, moduleName: Trigger.moduleName })
