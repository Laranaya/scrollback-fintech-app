import { duolingo } from './duolingo.js'
import { github } from './github.js'
import { linkedin } from './linkedin.js'

const providers = {
  [github.id]: github,
  [duolingo.id]: duolingo,
  [linkedin.id]: linkedin,
}

export const getIntegration = (source) => providers[source]
