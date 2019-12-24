// @flow
import * as API from './api'

import React, { Component } from 'react'
import { convertToMillionsUnits, formatAmount } from './utils'

import BuySellForm from './BuySellForm'
import type { Quote } from './types'

const formatResponse = async (response: any, valueType: string, value: number, cryptoCode: string, fiatCode: string): any => {
  const { res, err } = response
  if (err) {
    throw new Error(err)
  }
  if (!res.quote_id) {
    throw new Error('Invalid response')
  }
  let [fiatAmount, cryptoAmount] = [0, 0]
  if (valueType === 'fiat') {
    fiatAmount = value
    cryptoAmount = cryptoCode === 'BTC' ? Math.round((value / res.rate) * 1000000) / 1000000 : value / res.rate
  } else {
    cryptoAmount = value
    fiatAmount = value * res.rate
  }
  const rate = res.rate
  const quote = {
    quote_id: res.quote_id,
    rate: res.rate,
    fiat_amount: fiatAmount,
    fiat_currency: fiatCode,
    crypto_currency: cryptoCode,
    crypto_amount: cryptoAmount
  }
  return { quote, rate }
}
type Props = {
  history: Object
}

class SellScene extends Component<Props> {
  requestFiatQuote = async (value: number, cryptoCode: string, fiatCode: string): any => {
    const data = await API.requestSellQuote({
      base_currency: cryptoCode,
      base_amount: convertToMillionsUnits(value),
      quote_currency: fiatCode
    })
    const r = await data.json()
    return formatResponse(r, 'crypto', value, cryptoCode, fiatCode)
  }

  requestCryptoQuote = async (value: number, cryptoCode: string, fiatCode: string): any => {
    const data = await API.requestSellQuote({
      base_currency: cryptoCode,
      quote_amount: convertToMillionsUnits(value, cryptoCode),
      quote_currency: fiatCode
    })
    const r = await data.json()
    window.edgeProvider.consoleLog('Here is the conversion ')
    window.edgeProvider.consoleLog(r)
    return formatResponse(r, 'fiat', value, cryptoCode, fiatCode)
  }

  handleAccept = async (quote: Quote) => {
    const data = await API.initiateSell(quote) // TODO: Get refund address from the wallet
    const transaction = await data.json()
    if (transaction.err) {
      throw new Error(transaction.err)
    }
    window.location.href = transaction.res.txn_url
  }

  render () {
    return (
      <BuySellForm
        history={this.props.history}
        supported_fiat_currencies={API.SUPPORTED_SELL_FIAT_CURRENCIES}
        supported_digital_currencies={API.SUPPORTED_SELL_DIGITAL_CURRENCIES}
        requestFiatQuote={this.requestFiatQuote}
        requestCryptoQuote={this.requestCryptoQuote}
        handleAccept={this.handleAccept}
        dialogMessage={quote => {
          return `Are you sure you want to sell ${formatAmount(quote.crypto_amount, quote.crypto_currency)}?`
        }}
      />
    )
  }
}

export default SellScene
