import { edgeUrl, simplexUrl } from './config'

import PropTypes from 'prop-types'
import React from 'react'
import { cancelableFetch } from './utils'
// import { core } from 'edge-libplugin'
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
    min: 50,
    daily: 16972,
    monthly: 42431
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

export const SUPPORTED_DIGITAL_CURRENCIES = ['BTC', 'ETH', 'BCH', 'LTC', 'XRP']

export const SUPPORTED_FIAT_CURRENCIES = ['USD', 'EUR']

export const SUPPORTED_SELL_FIAT_CURRENCIES = ['EUR']

export const SUPPORTED_SELL_DIGITAL_CURRENCIES = ['BTC']

export const RETURN_URL = `${edgeUrl}/redirect/`

export function sessionId () {
  return uuidv1()
}

export async function getUserId () {
  let id = null
  let inCore = true
  try {
    id = await window.edgeProvider.readData(['simplex_user_id'])
    // core.debugLevel(0, 'Found user key in core')
  } catch (e) {
    // core.debugLevel(0, 'No existing key in core')
    inCore = false
  }
  if (!id) {
    id = window.localStorage.getItem('simplex_user_id')
  }
  if (!id) {
    id = uuidv1()
    // core.debugLevel(0, 'Generating id "' + id + "' ")
  }
  if (!inCore) {
    try {
      await window.edgeProvider.writeData({'simplex_user_id': id})
      // core.debugLevel(0, 'Wrote key to core')
    } catch (e) {
      // core.debugLevel(0, 'Unable to write key to core. Storing in localStorage')
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
  lastRequest = cancelableFetch(edgeUrl + '/partner/data', data)
  return lastRequest.promise
}

export async function requestQuote (requested, amount, digitalCurrency, fiatCurrency) {
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
  lastRequest = cancelableFetch(edgeUrl + '/quote', data)
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
  console.log('requestSellQuote ', params)
  const data = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }
  console.log('request quote url.', edgeUrl + '/sell/quote/?' + encode(params))
  lastRequest = cancelableFetch(edgeUrl + '/sell/quote/?' + encode(params), data)
  return lastRequest.promise
}

export async function initiateSell (quote) {
  requestAbort()
  console.log('API initiateSell  ---  quote', quote)
  console.log('API initiateSell refundAddress', quote.refund_address)
  const userId = await getUserId()
  const data = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      quote,
      refund_crypto_address: quote.refund_address,
      user_id: userId,
      return_url: RETURN_URL
    })
  }
  console.log('API initiateSell data', data)
  console.log('API initiateSell data', data)
  console.log(' API: ', edgeUrl + '/sell/initiate/')
  lastRequest = cancelableFetch(edgeUrl + '/sell/initiate/', data)
  console.log(' lastRequest: ', lastRequest)
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
    <form id="payment_form" action={simplexUrl} method="POST" target="_self">
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
