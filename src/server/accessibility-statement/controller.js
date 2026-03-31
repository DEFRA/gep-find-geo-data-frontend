export const accessibilityStatementController = {
  handler (_request, h) {
    return h.view('accessibility-statement/index', {
      pageTitle: 'Accessibility statement',
      heading: 'Accessibility statement',
      breadcrumbs: [
        {
          text: 'Home',
          href: '/'
        },
        {
          text: 'Accessibility statement'
        }
      ]
    })
  }
}
