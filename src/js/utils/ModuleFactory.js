import $ from 'cash-dom'

export default class ModuleFactory {
  static init ({
    Module,
    waitForLoad = false
  } = {}) {
    const doAttach = () => ModuleFactory.doAttach({ Module })

    if (waitForLoad) {
      App.on('load', doAttach)

      return
    }

    doAttach()
  }

  static doAttach ({ Module }) {
    const moduleName = Module.name || ''

    if (!moduleName) {
      return
    }

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
