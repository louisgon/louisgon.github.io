export default class Theme {
  static get () {
    return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  }

  static set ({ $body, theme }) {
    localStorage.setItem('theme', theme)

    $body.attr('data-theme', theme)
  }
}
