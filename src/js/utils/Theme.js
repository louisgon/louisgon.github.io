export default class Theme {
  static get () {
    return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  }

  static set ({ $container, theme = 'light' }) {
    localStorage.setItem('theme', theme)

    $container.attr('data-theme', theme)
  }
}
