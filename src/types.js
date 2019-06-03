// @flow
export type Quote = {
  quote_id: string,
  rate: string,
  fiat_amount: string,
  fiat_currency: string,
  crypto_currency: string,
  crypto_amount: string,
  refund_address: string
}

export type QuoteAndRate = {
  quote: Quote,
  rate: string
}

export type RequestSellQuote = {
  rate: string,
  quote_id: string
}
