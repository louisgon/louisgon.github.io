import { ensureProperty, getObject, getObjectSortedByKeys, getObjectWithNestedKeys } from './general'
import classList from './classList'

export default function htmlAttr (args = {}) {
  if (typeof args !== 'object') {
    return typeof args === 'string' ? args : ''
  }

  let object = getObject(args)
  let tag = ''

  // define object props that should be parsed
  object['animateIn'] = object['animateIn'] || ''
  object['aria'] = object['aria'] || ''
  object['class'] = object['class'] || ''
  object['data'] = object['data'] ?? {}
  object['module'] = object['module'] || ''
  object['style'] = object['style'] || ''
  object['tag'] = object['tag'] || ''

  // parse tag and ensure it's a string
  if (ensureProperty(object['tag'], 'string')) {
    tag = object['tag']
  }

  // delete tag property
  delete object['tag']

  // parse aria if object
  if (ensureProperty(object['aria'], 'object')) {
    object = getObjectWithNestedKeys(object, 'aria')
  }

  // delete aria property
  delete object['aria']

  // parse class list if object
  if (ensureProperty(object['class'], 'object')) {
    object['class'] = classList(object['class'])
  }

  // parse animateIn and add to data attribute
  if (ensureProperty(object['animateIn'], 'string')) {
    object['data']['animateIn'] = object['animateIn']
  }

  // delete animateIn property
  delete object['animateIn']

  // parse module and add to data attribute, needs to be before data parsing
  if (ensureProperty(object['module'], 'string')) {
    object['data']['module'] = object['module']
  }

  // delete module property
  delete object['module']

  // parse data if object
  if (ensureProperty(object['data'], 'object')) {
    object = getObjectWithNestedKeys(object, 'data')
  }

  // delete data property
  delete object['data']

  // parse style if object
  if (ensureProperty(object['style'], 'object')) {
    object['style'] = getCssVariables(object['style'])
  }

  return [tag, getAttributes(object)].filter(Boolean).join(' ')
}

function getAttributes (object) {
  const attributes = []

  // sort object
  const sorted = getObjectSortedByKeys(object, [
    'src',
    'class',
    'href',
    'data',
    'aria',
    'role',
    'style',
  ])

  // add attributes
  for (let key in sorted) {
    if (object.hasOwnProperty(key) && object[key] !== '') {
      attributes.push(`${key}="${object[key]}"`)
    }
  }

  return attributes.join(' ')
}

function getCssVariables (object) {
  let variables = []

  // get object
  object = getObject(object)

  for (let key in object) {
    if (object.hasOwnProperty(key) && object[key] !== '') {
      variables.push(`--${key}: ${object[key]};`)
    }
  }

  return variables.join(' ')
}
