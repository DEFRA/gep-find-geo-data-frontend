function initMockLinks () {
  document.querySelectorAll('.js-mock-link').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault()
    })
  })
}

export { initMockLinks }
