export const cookiesController = {
  handler (_request, h) {
    return h.view('cookies/index', {
      pageTitle: 'Cookies',
      heading: 'Cookies',
      breadcrumbs: [
        {
          text: 'Home',
          href: '/'
        },
        {
          text: 'Cookies'
        }
      ]
    })
  }
}
