// import { core } from 'edge-libplugin'

export function formatRate (rate, currency) {
  if (!rate) {
    return ''
  }
  return rate.toLocaleString(undefined, {
    style: 'currency',
    currency: currency
  })
}
export function formatAmount (rate, currency) {
  if (!rate) {
    return ''
  }
  return `${parseFloat(rate).toFixed(3)} ${currency}`
}

export function formatStatus (status) {
  if (status === 'submitted') {
    return 'Submitted'
  } else if (status === 'pending_simplexcc_approval') {
    return 'Pending Approval'
  } else if (status === 'approved') {
    return 'Approved'
  } else if (status === 'declined') {
    return 'Declined'
  } else if (status === 'cancelled') {
    return 'Cancelled'
  } else if (status === 'sent') {
    return 'Sent'
  } else if (status === 'failed') {
    return 'Failed'
  } else if (status === 'refunded') {
    return 'Refunded'
  }
  return status
}

export const cancelableFetch = (url, data) => {
  let canceled = false
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      if (canceled) {
        reject({ isCanceled: true })
      } else {
        window
          .fetch(url, data)
          .then(val => {
            if (canceled) {
              reject({ isCanceled: true })
            } else {
              resolve(val)
            }
          })
          .catch(error => (canceled ? reject({ isCanceled: true }) : reject(error)))
      }
    }, 250)
  })
  return {
    promise,
    cancel () {
      canceled = true
    }
  }
}

export function setFiatInput (value) {
  setDomValue('fiatInput', value)
}

export function setCryptoInput (value) {
  setDomValue('cryptoInput', value)
}

export function setDomValue (id, value) {
  if (document.getElementById(id)) {
    document.getElementById(id).value = value
  }
}
export const describeSpend = executionOrder => {
  if (!executionOrder) {
    return null
  }
  return `${convertFromMillionsUnits(executionOrder.requested_digital_amount)} ${executionOrder.requested_digital_currency}`
}

export async function retrieveAddress () {
  let address = null
  try {
    const addressData = await window.edgeProvider.getReceiveAddress()
    address = addressData.address.legacyAddress
    if (!address) {
      address = addressData.address.publicAddress
    }
    return address
  } catch (e) {
    return null
  }
}
export function convertToMillionsUnits (val) {
  return val * 1000000
}
export function convertFromMillionsUnits (val) {
  return val / 1000000
}
