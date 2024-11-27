import fs from 'node:fs'
import { JSDOM } from 'jsdom'

import classList from './classList'

export default function htmlSvg (name = '', classes = '') {
  const svgPath = `./src/includes/svgs/${name}.svg`

  return fs.existsSync(svgPath)
    ? cleanSvg(fs.readFileSync(svgPath, 'utf8'), classes)
    : null
}

function cleanSvg (svg, classes = '') {
  const dom = new JSDOM(svg)
  const document = dom.window.document

  const svgElement = document.querySelector('svg')

  const svgViewBox = svgElement.getAttribute('viewBox')
  const svgXmlns = svgElement.getAttribute('xmlns') || 'http://www.w3.org/2000/svg'

  // Remove all attributes
  while (svgElement.attributes.length > 0) {
    svgElement.removeAttribute(svgElement.attributes[0].name)
  }

  if (classes) {
    svgElement.setAttribute('class', classList(classes))
  }

  if (svgViewBox) {
    svgElement.setAttribute('viewBox', svgViewBox)
  }

  svgElement.setAttribute('xmlns', svgXmlns)

  return svgElement.outerHTML
}
