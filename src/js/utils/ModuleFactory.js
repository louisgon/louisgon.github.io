import $ from 'cash-dom'

export default class ModuleFactory {
  static init ({
    Module,
    moduleName,
    waitForLoad = false
  } = {}) {
    const doAttach = () => ModuleFactory.doAttach({ Module, moduleName })

    if (waitForLoad) {
      App.on('load', doAttach)

      return
    }

    doAttach()
  }

  static doAttach ({ Module, moduleName }) {
    const $containers = ModuleFactory.get({ moduleName })

    if (!$containers.length) {
      return
    }

    $containers.each((i, elem) => {
      if (elem[moduleName]) {
        return
      }

      elem[moduleName] = new Module({ $container: $(elem) })
    })
  }

  static get ({ moduleName }) {
    return $(`[data-module~="${moduleName}"]`)
  }
}
