import $ from 'cash-dom'

import ModuleFactory from '../utils/ModuleFactory'
import Theme from '../utils/Theme.js'

export default class Header {
  constructor ({ $container }) {
    this.$container = $container
    this.themeActive = Theme.get()

    this.constructElements()

    this.constructEvents()

    this.doThemeSet()
  }

  constructElements () {
    this.$body = $('body')
    this.$theme = this.$container.find(Header.selectors.theme)
  }

  constructEvents () {
    this.$container
      .on('click', Header.selectors.theme, (e) => this.handleThemeClick({ e }))
  }

  doThemeSet () {
    const theme = this.themeActive

    this.$theme.attr('aria-checked', (theme === 'dark').toString())

    Theme.set({ $body: this.$body, theme })
  }

  doThemeToggle () {
    this.themeActive = this.themeActive === 'dark' ? 'light' : 'dark'

    this.doThemeSet()
  }

  handleThemeClick ({ e }) {
    this.doThemeToggle()
  }
}

Header.moduleName = 'Header'

Header.selectors = {
  theme: '.c-header__theme',
}

ModuleFactory.init({ Module: Header, moduleName: Header.moduleName })
