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

export type BuyQuote = {
  version: string,
  partner: string,
  payment_flow_type: string,
  return_url: string,
  quote_id: string,
  wallet_id: string,
  payment_id: string,
  order_id: string,
  user_id: string,
  address: string,
  currency: string,
  fiat_total_amount_amount: number,
  fiat_total_amount_currency: string,
  fee: number,
  fiat_amount: number,
  digital_amount: number,
  digital_currency: string
}

export type QuoteAndRate = {
  quote: Quote,
  rate: string
}

export type RequestSellQuote = {
  rate: string,
  quote_id: string
}

export type WalletDetails = {
  name: string,
  receiveAddress: {
    publicAddress: string
  },
  currencyCode: string,
  fiatCurrencyCode: string,
  currencyIcon: string,
  currencyIconDark: string
}
