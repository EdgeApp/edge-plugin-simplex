import { edgeLegacyBuyUrl, edgeSimplexBuyUrl, edgeUrl } from './config'

import PropTypes from 'prop-types'
import React from 'react'
import { cancelableFetch } from './utils'
import uuidv1 from 'uuid/v1'

export const PROVIDER = 'edge'
export const API_VERSION = '1'
export const ACCEPT_LANGUAGE = 'en-US;q=0.7,en;q=0.3'
export const HTTP_ACCEPT = 'en-US;q=0.7,en;q=0.3'
export const LIMITS = {
  USD: {
    min: 50,
    daily: 18800,
    monthly: 47000
  },
  EUR: {
    min: 42.35,
    daily: 15923.6,
    monthly: 39809
  },
  GBP: {
    min: 38.15,
    daily: 14344.4,
    monthly: 35861
  },
  ILS: {
    min: 170,
    daily: 63920,
    monthly: 159800
  },
  TRY: {
    min: 368,
    daily: 138368,
    monthly: 345920
  },
  CAD: {
    min: 66,
    daily: 24816,
    monthly: 62040
  },
  CHF: {
    min: 45.5,
    daily: 17108,
    monthly: 42770
  },
  KRW: {
    min: 59315,
    daily: 22302440,
    monthly: 55756100
  },
  JPY: {
    min: 5292.5,
    daily: 1989980,
    monthly: 4974950
  },
  RUB: {
    min: 3721,
    daily: 1399096,
    monthly: 3497740
  },
  AUD: {
    min: 69.5,
    daily: 26132,
    monthly: 65330
  },
  CZK: {
    min: 1103.5,
    daily: 414916,
    monthly: 1037290
  },
  NOK: {
    min: 449.5,
    daily: 169012,
    monthly: 422530
  },
  DKK: {
    min: 314.5,
    daily: 118252,
    monthly: 295630
  },
  NZD: {
    min: 76.5,
    daily: 28764,
    monthly: 71910
  },
  SEK: {
    min: 438.5,
    daily: 164876,
    monthly: 412190
  },
  ZAR: {
    min: 849,
    daily: 319224,
    monthly: 798060
  },
  HUF: {
    min: 14839.5,
    daily: 5579652,
    monthly: 13949130
  },
  PLN: {
    min: 186,
    daily: 69936,
    monthly: 174840
  },
  INR: {
    min: 3711.5,
    daily: 1395524,
    monthly: 3488810
  },
  AED: {
    min: 183.5,
    daily: 68996,
    monthly: 172490
  }
}
export const SELL_LIMITS = {
  EUR: {
    min: 50,
    daily: 4400,
    monthly: 8800
  }
}

let lastRequest = null

export function requestAbort () {
  if (lastRequest) {
    lastRequest.cancel()
  }
}

export const SUPPORTED_DIGITAL_CURRENCIES = ['BTC', 'ETH', 'BCH', 'LTC', 'BSV', 'USDT']

export const SUPPORTED_FIAT_CURRENCIES = ['USD', 'EUR', 'GBP', 'ILS', 'TRY', 'CAD', 'CHF', 'KRW', 'JPY', 'RUB', 'AUD', 'CZK', 'NOK', 'DKK', 'NZD', 'SEK', 'ZAR', 'HUF', 'PLN', 'INR', 'AED']

export const SUPPORTED_SELL_FIAT_CURRENCIES = ['EUR']

export const SUPPORTED_SELL_DIGITAL_CURRENCIES = ['BTC']

export const RETURN_URL = `${edgeUrl}/redirect/`

export function sessionId () {
  return uuidv1()
}

export async function getUserId () {
  let id = null
  let inCore = true

  const obj = await window.edgeProvider.readData(['simplex_user_id'])
  if (obj.simplex_user_id) {
    id = obj.simplex_user_id
  } else {
    inCore = false
  }

  if (!id) {
    id = window.localStorage.getItem('simplex_user_id')
  }
  if (!id) {
    id = uuidv1()
  }
  if (!inCore) {
    try {
      await window.edgeProvider.writeData({'simplex_user_id': id})
      window.localStorage.setItem('simplex_user_id', id)
    } catch (e) {
      window.localStorage.setItem('simplex_user_id', id)
    }
  }
  return id
}

export function installId () {
  const id = window.localStorage.getItem('simplex_install_id') || uuidv1()
  window.localStorage.setItem('simplex_install_id', id)
  return id
}

export async function requestConfirm (sessionId, uaid, quote) {
  const userId = await getUserId()
  const body = {
    account_details: {
      app_provider_id: PROVIDER,
      app_version_id: API_VERSION,
      app_end_user_id: userId,
      signup_login: {
        ip: '4.30.5.194',
        uaid: uaid,
        accept_language: ACCEPT_LANGUAGE,
        http_accept_language: HTTP_ACCEPT,
        user_agent: window.navigator.userAgent,
        cookie_session_id: sessionId,
        timestamp: new Date().toISOString()
      }
    },
    transaction_details: {
      payment_details: {
        quote_id: quote.quote_id,
        payment_id: quote.payment_id,
        order_id: quote.order_id,
        fiat_total_amount: {
          currency: quote.fiat_total_amount_currency,
          amount: quote.fiat_total_amount_amount
        },
        requested_digital_amount: {
          currency: quote.digital_currency,
          amount: quote.digital_amount
        },
        destination_wallet: {
          currency: quote.digital_currency,
          address: quote.address
        },
        original_http_ref_url: 'https://www.edgesecure.co/'
      }
    }
  }
  const data = {
    // signal: abortController.signal,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  lastRequest = cancelableFetch(edgeLegacyBuyUrl + '/partner/data', data)
  return lastRequest.promise
}

export async function requestQuote (requested, amount, digitalCurrency, fiatCurrency) {
  /* window.edgeProvider.consoleLog('requested: ' + requested)
  window.edgeProvider.consoleLog('amount: ' + amount)
  window.edgeProvider.consoleLog('digitalCurrency: ' + digitalCurrency)
  window.edgeProvider.consoleLog('fiatCurrency: ' + fiatCurrency) */
  const userId = await getUserId()
  // Abort any active requests
  requestAbort()
  const data = {
    // signal: abortController.signal,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      digital_currency: digitalCurrency,
      fiat_currency: fiatCurrency,
      requested_currency: requested,
      requested_amount: parseFloat(amount),
      client_id: userId
    })
  }
  // Issue a new request
  lastRequest = cancelableFetch(edgeLegacyBuyUrl + '/quote', data)
  return lastRequest.promise
}

const encode = params => {
  const data = []
  for (const k in params) {
    if (params[k]) {
      data.push(k + '=' + encodeURIComponent(params[k]))
    }
  }
  return data.join('&')
}

export async function requestSellQuote (params) {
  requestAbort()
  const data = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }
  lastRequest = cancelableFetch(edgeUrl + '/sell/quote/?' + encode(params), data)
  return lastRequest.promise
}

export async function initiateSell (quote) {
  requestAbort()
  const userId = await getUserId()
  const d = {
    quote,
    refund_crypto_address: quote.refund_address,
    user_id: userId,
    return_url: RETURN_URL
  }
  const data = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(d)
  }
  lastRequest = cancelableFetch(edgeUrl + '/sell/initiate/', data)
  return lastRequest.promise
}
export async function executionOrderNotifyStatus (executionOrder, status, cryptoAmountSent, txnHash) {
  requestAbort()
  const data = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: executionOrder.id,
      sellId: executionOrder.sell_id,
      status,
      cryptoAmountSent,
      txnHash
    })
  }
  lastRequest = cancelableFetch(edgeUrl + '/execution-order-notify-status/', data)
  return lastRequest.promise
}

export async function payments () {
  const userId = await getUserId()

  const data = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }
  const url = `${edgeUrl}/payments/${userId}/`
  return window.fetch(url, data)
}
export async function sells () {
  const userId = await getUserId()

  const data = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }
  const url = `${edgeUrl}/sells/${userId}`
  return window.fetch(url, data)
}
export async function getExecutionOrder (executionOrderId) {
  const userId = await getUserId()
  const data = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }
  const url = `${edgeUrl}/execution-orders/${executionOrderId}?` + encode({ userId })
  return window.fetch(url, data)
}
export async function getPendingExecutionOrders () {
  const userId = await getUserId()
  const data = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }
  const url = `${edgeUrl}/execution-orders?` + encode({ userId, onlyPending: true })
  return window.fetch(url, data)
}

export async function paymentDetails (paymentId) {
  const userId = await getUserId()
  const data = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }
  const url = `${edgeUrl}/payments/${userId}/${paymentId}/`
  return window.fetch(url, data)
}

export async function sellDetails (sellId) {
  const userId = await getUserId()
  const data = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }
  const url = `${edgeUrl}/sells/${userId}/${sellId}/`
  return window.fetch(url, data)
}

export const SimplexForm = props => {
  return (
    <form id="payment_form" action={edgeSimplexBuyUrl} method="POST" target="_self">
      <input type="hidden" name="version" value={props.quote.version} />
      <input type="hidden" name="partner" value={props.quote.partner} />
      <input type="hidden" name="payment_flow_type" value={props.quote.payment_flow_type} />
      <input type="hidden" name="return_url" value={props.quote.return_url} />
      <input type="hidden" name="quote_id" value={props.quote.quote_id} />
      <input type="hidden" name="payment_id" value={props.quote.payment_id} />
      <input type="hidden" name="user_id" value={props.quote.user_id} />
      <input type="hidden" name="destination_wallet[address]" value={props.quote.address} />
      <input type="hidden" name="destination_wallet[currency]" value={props.quote.currency} />
      <input type="hidden" name="fiat_total_amount[amount]" value={props.quote.fiat_total_amount_amount} />
      <input type="hidden" name="fiat_total_amount[currency]" value={props.quote.fiat_total_amount_currency} />
      <input type="hidden" name="digital_total_amount[amount]" value={props.quote.digital_amount} />
      <input type="hidden" name="digital_total_amount[currency]" value={props.quote.digital_currency} />
    </form>
  )
}

SimplexForm.propTypes = {
  quote: PropTypes.object.isRequired
}
