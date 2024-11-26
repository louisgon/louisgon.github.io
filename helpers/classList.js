import { getArrayWithPrefix, getObject } from './general'

export default function classList (args = '') {
  if (typeof args !== 'object') {
    return typeof args === 'string' ? args : ''
  }

  const object = getObject(args)

  const name = object['name'] ?? ''

  // blocks
  const block = (object['block'] ?? '')
    ? getBlockClasses(object['block'])
    : ''

  // classes (check if string or )
  const classes = typeof object['classes'] === 'string' || typeof object['classes'] === null
    ? object['classes']
    : classList(object['classes'])

  // modifiers
  const modifiers = (object['modifiers'] ?? '')
    ? getArrayWithPrefix(object['modifiers'] ?? [], `${name}--`)
    : []

  // scopes
  const scopes = (object['scopes'] ?? '')
    ? getArrayWithPrefix(object['scopes'], 's-')
    : []

  // spacing
  const spacing = (object['spacing'] ?? '')
    ? getSpacingClasses(object['spacing'])
    : ''

  // utilities
  const utilities = (object['utilities'] ?? '')
    ? getUtilityClasses(object['utilities'])
    : []

  // vendors
  const vendors = object['vendors'] ?? []

  // scripts
  const scripts = (object['scripts'] ?? '')
    ? getArrayWithPrefix(object['scripts'], 'js-')
    : []

  // merge classes
  return [classes, name, block, ...modifiers, ...scopes, spacing, ...utilities, ...vendors, ...scripts]
    .filter(Boolean)
    .join(' ')
}

function getSpacingClasses (object) {
  let classes = []

  // get object
  object = getObject(object)

  // margin top
  let margin_top = (object['mt'] ?? '') !== ''
    ? getUtilityBreakpointClasses(object['mt'], 'mt')
    : ''

  // padding top
  let padding_top = (object['pt'] ?? '') !== ''
    ? getUtilityBreakpointClasses(object['pt'], 'pt')
    : ''

  // padding top
  let padding_bottom = (object['pb'] ?? '') !== ''
    ? getUtilityBreakpointClasses(object['pb'], 'pb')
    : ''

  // margin top
  let margin_bottom = (object['mb'] ?? '') !== ''
    ? getUtilityBreakpointClasses(object['mb'], 'mb')
    : ''

  // merge classes
  return [margin_top, padding_top, padding_bottom, margin_bottom]
    .filter(Boolean)
    .join(' ')
}

function getUtilityBreakpointClasses (object, prefix) {
  let classes = []

  // get object
  object = getObject(object)

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
