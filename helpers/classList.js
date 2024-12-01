import { ensureProperty, getArrayWithPrefix, getObject } from './general'

export default function classList (args = '', debug = false) {
  if (typeof args !== 'object') {
    return typeof args === 'string' ? args : ''
  }

  const object = getObject(args)

  const name = object['name'] ?? ''

  // background
  const background = (object['background'] ?? '')
    ? `u-bg-${object['background']}`
    : ''

  // blocks
  const block = (object['block'] ?? '')
    ? getBlockClasses(object['block'])
    : ''

  // classes
  const classes = ensureProperty(object['classes'], 'object', 'classes')
    ? classList(object['classes'], true)
    : object['classes']

  // modifiers
  const modifiers = ensureProperty(object['modifiers'], 'object')
    ? getArrayWithPrefix(object['modifiers'] ?? [], `${name}--`)
    : []

  // scopes
  const scopes = ensureProperty(object['scopes'], 'object')
    ? getArrayWithPrefix(object['scopes'], 's-')
    : []

  // scripts
  const scripts = ensureProperty(object['scripts'], 'object')
    ? getArrayWithPrefix(object['scripts'], 'js-')
    : []

  // spacing
  const spacing = ensureProperty(object['spacing'], 'object')
    ? getSpacingClasses(object['spacing'])
    : ''

  // utilities
  const utilities = ensureProperty(object['utilities'], 'object')
    ? getUtilityClasses(object['utilities'])
    : []

  // vendors
  const vendors = object['vendors'] ?? []

  // merge classes
  return [classes, name, block, ...modifiers, ...scopes, background, spacing, ...utilities, ...vendors, ...scripts]
    .filter(Boolean)
    .join(' ')
}

function getSpacingClasses (object) {
  let classes = []

  // get object
  object = getObject(object)

  const options = getObject(object['options'] ?? [])
  const type = object['type'] ?? 'content'

  if (!Object.keys(options).length) {
    return ''
  }

  // loop through options
  for (let key in options) {
    if (!options.hasOwnProperty(key) || options[key] === '') {
      continue
    }

    classes.push(`u-${key}-${type}-${options[key]}`)
  }

  return classes.filter(Boolean).join(' ')
}

function getUtilityBreakpointClasses (object, prefix) {
  let classes = []

  // get object
  object = getObject(object)

  if (typeof object === 'number' || typeof object === 'string') {
    return `u-${prefix}-${object}`
  }

  // base
  let base = (object['base'] ?? '') !== ''
    ? `u-${prefix}-${object['base']}`
    : ''

  // md
  let md = (object['md'] ?? '') !== ''
    ? `md:u-${prefix}-${object['md']}`
    : ''

  // lg
  let lg = (object['lg'] ?? '') !== ''
    ? `lg:u-${prefix}-${object['lg']}`
    : ''

  return [base, md, lg]
    .filter(Boolean)
    .join(' ')
}

function getUtilityClasses (utilities) {
  return Array.isArray(utilities)
    ? getArrayWithPrefix(utilities, 'u-')
    : getUtilityObject(utilities)
}

function getUtilityObject (object) {
  let mergedArray = []

  // get object
  object = getObject(object)

  for (let key in object) {
    if (object.hasOwnProperty(key) && object[key] !== '') {
      const value = (typeof object[key] == 'object')
        ? getUtilityBreakpointClasses(object[key], key)
        : `u-${key}-${object[key]}`

      mergedArray.push(value)
    }
  }

  return mergedArray.filter(Boolean)
}
