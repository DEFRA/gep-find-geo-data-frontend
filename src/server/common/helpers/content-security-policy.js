import Blankie from 'blankie'

/**
 * Manage content security policies.
 * @satisfies {import('@hapi/hapi').Plugin}
 */
const contentSecurityPolicy = {
  plugin: Blankie,
  options: {
    defaultSrc: ['self'],
    fontSrc: ['self'],
    connectSrc: ['self'],
    mediaSrc: ['self'],
    styleSrc: ['self'],
    scriptSrc: ['self'],
    imgSrc: ['self'],
    frameSrc: ['self'],
    objectSrc: ['none'],
    frameAncestors: ['none'],
    formAction: ['self'],
    manifestSrc: ['self'],
    // https://frontend.design-system.service.gov.uk/import-javascript/#use-a-nonce-attribute-to-unblock-inline-javascript
    generateNonces: true
  }
}

export { contentSecurityPolicy }
