export function getArrayWithPrefix (array, prefix) {
  return array
    .filter(Boolean)
    .map(item => `${prefix}${item}`)
}

export function getObject (object) {
  // delete _keys property
  delete object._keys

  return object
}

export function getObjectSorted (object) {
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

export function getObjectSortedByKeys (object, keys) {
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

export function getObjectWithNestedKeys (object, key) {
  const nested = getObject(object[key])

  for (let nestedKey in nested) {
    if (!nested.hasOwnProperty(nestedKey)) {
      continue
    }

    object[`${key}-${getStringKebabCase(nestedKey)}`] = nested[nestedKey]
  }

  return object
}

export function getPropertyValidation (property, type) {
  switch (type) {
    case 'object':
      return typeof property === 'object' && property !== null
    case 'string':
      return typeof property === 'string' && property !== ''
    default:
      return false
  }
}

export function getStringKebabCase (string) {
  return string
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase()
}
