export default function base64 (data = '', type = 'encode') {
  return type === 'encode'
    ? encode(data)
    : decode(data)
}

function decode (data = '') {
  return btoa(typeof data === 'object'
    ? JSON.stringify(data)
    : data)
}

function encode (data = '') {
  return btoa(typeof data === 'object'
    ? JSON.stringify(data)
    : data)
}
