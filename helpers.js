// Methods
function getAnimateIn (animation = 'fade') {
  return `data-animate-in="${animation}"`
}

function getArrayWithPrefix (array, prefix) {
  return array
    .filter(Boolean)
    .map(item => `${prefix}${item}`)
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

function getClassList (args) {
  const object = getObject(args)

  const name = object['name'] ?? ''

  // blocks
  const block = (object['block'] ?? '')
    ? getBlockClasses(object['block'])
    : ''

  // classes (check if string or )
  const classes = typeof object['classes'] === 'string' || typeof object['classes'] === null
    ? object['classes']
    : getClassListClasses(object['classes'])

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

function getClassListClasses (object) {
  // if not object return string
  if (typeof object !== 'object') {
    return ''
  }

  return getClassList(object)
}

function getHtmlAttrs (object) {
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

function getObject (object) {
  // delete _keys property
  delete object._keys

  return object
}

function getObjectSorted (object) {
  let cleanObject = {}

  // get object
  object = getObject(object)

  // get object keys
  let sortedKeys = Object.keys(object).reverse()

  // order object keys
  sortedKeys.forEach((key, index) => {
    let value = object[key]

    if (value ?? '') {
      cleanObject[key] = value
    }
  })

  return cleanObject
}

function getObjectSortedByKeys (object, keys) {
  const entries = Object.entries(object)

  entries.sort(([keyA], [keyB]) => {
    const [prefixA, prefixB] = [keyA, keyB].map(key => key.split('-')[0])
    const [indexA, indexB] = [prefixA, prefixB].map(prefix => keys.indexOf(prefix))

    if (indexA === indexB) {
      return keyA.localeCompare(keyB)  // Sort alphabetically if both keys have the same prefix index
    }

    if (indexA === -1) {
      return 1
    }

    if (indexB === -1) {
      return -1
    }

    return indexA - indexB
  })

  return Object.fromEntries(entries)
}

function getObjectWithNestedKeys (object, key) {
  const nested = getObject(object[key])

  for (let nestedKey in nested) {
    if (!nested.hasOwnProperty(nestedKey)) {
      continue
    }

    object[`${key}-${getStringKebabCase(nestedKey)}`] = nested[nestedKey]
  }

  return object
}

function getPropertyValidation (property, type) {
  switch (type) {
    case 'object':
      return typeof property === 'object' && property !== null
    case 'string':
      return typeof property === 'string' && property !== ''
    default:
      return false
  }
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

function getStringKebabCase (string) {
  return string
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase()
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

// Exports
export function animateIn (animation = 'fade') {
  return getAnimateIn(animation)
}

export function base64Decode (data = '') {
  return data
    ? atob(data)
    : ''
}

export function base64Encode (data = '') {
  if (typeof data === 'object') {
    data = JSON.stringify(data)
  }

  return data
    ? btoa(data)
    : ''
}

export function classList (args = {}) {
  return getClassList(args)
}

export function htmlAttr (args = {}) {
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
  if (getPropertyValidation(object['tag'], 'string')) {
    tag = object['tag']
  }

  // delete tag property
  delete object['tag']

  // parse aria if object
  if (getPropertyValidation(object['aria'], 'object')) {
    object = getObjectWithNestedKeys(object, 'aria')
  }

  // delete aria property
  delete object['aria']

  // parse class list if object
  if (getPropertyValidation(object['class'], 'object')) {
    object['class'] = getClassList(object['class'])
  }

  // parse animateIn and add to data attribute
  if (getPropertyValidation(object['animateIn'], 'string')) {
    object['data']['animateIn'] = object['animateIn']
  }

  // delete animateIn property
  delete object['animateIn']

  // parse module and add to data attribute, needs to be before data parsing
  if (getPropertyValidation(object['module'], 'string')) {
    object['data']['module'] = object['module']
  }

  // delete module property
  delete object['module']

  // parse data if object
  if (getPropertyValidation(object['data'], 'object')) {
    object = getObjectWithNestedKeys(object, 'data')
  }

  // delete data property
  delete object['data']

  // parse style if object
  if (getPropertyValidation(object['style'], 'object')) {
    object['style'] = getCssVariables(object['style'])
  }

  return [tag, getHtmlAttrs(object)].filter(Boolean).join(' ')
}
