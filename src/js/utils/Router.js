import $ from 'cash-dom'

export default class Router {
  static async content ({ url }) {
    try {
      const response = await fetch(url)
      const html = await response.text()

      // create div to parse html
      const $div = $('<div></div>')

      $div.html(html)

      const fetchPartial = $div.find('[data-fetch-page]').html()

      if (!fetchPartial) {
        return null
      }

      return fetchPartial
    } catch (error) {
      console.error(error)
    }
  }

  static async navigate ({ $main, fetch, pushState = true }) {
    const slug = fetch.slug || '404'
    const url = fetch.url || '404'

    if (!$main) {
      return
    }

    // get content from url, prepend with /fetch
    const content = await Router.content({ url: `/fetch/${slug}` })

    // set content
    $main.html(content)

    // do not push state if not needed, most likely popstate
    if (!pushState) {
      return
    }

    // update url
    window.history.pushState({
      slug,
    }, '', url)
  }
}
