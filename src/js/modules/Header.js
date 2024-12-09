import $ from 'cash-dom'

import Body from './Body'
import ModuleFactory from '../utils/ModuleFactory'
import Theme from '../utils/Theme'

export default class Header {
  static name = 'Header'
  static values = {
    selectors: {
      themeToggle: '.c-header__theme-toggle',
    }
  }

  constructor ({ $container }) {
    this.$container = $container

    this.constructElements()

    this.constructEvents()

    this.setTheme({ theme: Theme.get() })
  }

  constructElements () {
    this.$body = ModuleFactory.get({ $container: $(document), moduleName: Body.name })
    this.$theme = this.$container.find(Header.values.selectors.theme)
  }

  constructEvents () {
    this.$container
      .on('click', Header.values.selectors.themeToggle, () => this.handleThemeToggleClick())
  }

  doThemeToggle () {
    this.setTheme({ theme: this.theme === 'dark' ? 'light' : 'dark' })
  }

  handleThemeToggleClick () {
    this.doThemeToggle()
  }

  setTheme ({ theme }) {
    this.theme = theme

    this.$theme.attr('aria-checked', (theme === 'dark').toString())

    Theme.set({ $container: this.$body, theme })
  }
}

ModuleFactory.init({ Module: Header })
