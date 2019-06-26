// @flow
const SANDBOX = false

export const edgeUrl = SANDBOX ? 'https://edge-sandbox.test-simplexcc.com' : 'https://edge-prod.simplex.com'

export const simplexUrl = SANDBOX ? 'https://sandbox.test-simplexcc.com/payments/new' : 'https://checkout.simplexcc.com/payments/new'

export const edgeLegacyBuyUrl = /* SANDBOX ? 'https://simplex-sandbox-api.edgesecure.co' :  */'https://simplex-api.edgesecure.co'
export const edgeSimplexBuyUrl = /* SANDBOX ? 'https://sandbox.test-simplexcc.com/payments/new' :  */'https://checkout.simplexcc.com/payments/new'
