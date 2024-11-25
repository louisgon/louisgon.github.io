import $ from 'cash-dom'

export default class Transitioner {
  static doElementHide ({
    $element,
    hideMode = Transitioner.defaults.hideMode
  }) {
    $element.attr('aria-hidden', true)

    if (hideMode === 'display') {
      $element.css('display', '')

      return
    }

    $element.attr('hidden', true)
  }

  static doElementShow ({
    $element,
    displayValue = Transitioner.defaults.displayValue,
    hideMode = Transitioner.defaults.hideMode
  }) {
    $element.attr('aria-hidden', false)

    if (hideMode === 'display') {
      $element.css('display', displayValue)

      return
    }

    $element.removeAttr('hidden')
  }

  static doHide ({ $element, hideMode = Transitioner.defaults.hideMode }) {
    Transitioner.doListenerStart({ $element, hideMode })
  }

  static doListenerStart ({ $element, hideMode = '', removeHeight = false }) {
    Transitioner.doListenerStop({ $element })

    $element.each((i, elem) => {
      $(elem).one('transitionend', () => {
        Transitioner.handleTransitionEnd({
          $element: $(elem),
          hideMode,
          removeHeight
        })
      })
    })
  }

  static doListenerStop ({ $element }) {
    $element.each((i, elem) => {
      $(elem).off('transitionend')
    })
  }

  static doShow ({
    $element,
    displayValue = Transitioner.defaults.displayValue,
    hideMode = Transitioner.defaults.hideMode
  }) {
    Transitioner.doListenerStop({ $element })

    Transitioner.doElementShow({ $element, displayValue, hideMode })

    $element.outerHeight() // Force browser to re-paint the element
  }

  static doSlideDown ({
    $element,
    displayValue = Transitioner.defaults.displayValue,
    hideMode = Transitioner.defaults.hideMode
  }) {
    Transitioner.doElementShow({ $element, displayValue, hideMode })

    Transitioner.doListenerStart({
      $element,
      removeHeight: true
    })

    $element.height(0).height($element.prop('scrollHeight'))
  }

  static doSlideDownHidden ({
    $element,
    displayValue = Transitioner.defaults.displayValue
  }) {
    Transitioner.doSlideDown({
      $element,
      displayValue,
      hideMode: 'hidden'
    })
  }

  static doSlideUp ({ $element, hideMode = Transitioner.defaults.hideMode }) {
    Transitioner.doListenerStart({
      $element,
      hideMode,
      removeHeight: true
    })

    $element.height($element.prop('scrollHeight')).height(0)
  }

  static doSlideUpHidden ({
    $element,
    displayValue = Transitioner.defaults.displayValue
  }) {
    Transitioner.doSlideUp({
      $element,
      displayValue,
      hideMode: 'hidden'
    })
  }

  static handleTransitionEnd ({
    $element,
    hideMode = '',
    removeHeight = false
  }) {
    if (hideMode) {
      Transitioner.doElementHide({ $element, hideMode })
    }

    if (removeHeight) {
      $element.css('height', '')
    }
  }
}

Transitioner.defaults = {
  displayValue: 'block',
  hideMode: 'display',
}
