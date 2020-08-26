// @flow
import './inline.css'

import * as API from './api'

import type { BuyQuote, WalletDetails } from './types'
import Card, { CardContent } from 'material-ui/Card'
import { DailyLimit, PoweredBy, Support } from './components'
import React, { Component } from 'react'

import { CircularProgress } from 'material-ui/Progress'
import { ConfirmDialog } from './components/ConfirmDialog'
import { EdgeButton } from './components/EdgeButton'
import { InputAdornment } from 'material-ui/Input'
import TextField from 'material-ui/TextField'
import Typography from 'material-ui/Typography'
import { formatRate } from './utils'
import uuidv1 from 'uuid/v1'
import { withStyles } from 'material-ui/styles'

const setFiatInput = value => {
  setDomValue('fiatInput', value)
}

const setCryptoInput = value => {
  setDomValue('cryptoInput', value)
}

const setDomValue = (id, value) => {
  if (document.getElementById(id)) {
    // $FlowFixMe
    document.getElementById(id).value = value
  }
}

const buildObject = async (res, wallet) => {
  if (!res.quote_id) {
    throw new Error(res.error)
  }
  let address = null
  const addressData = await window.edgeProvider.getReceiveAddress()
  if (wallet && wallet.currencyCode === 'BCH') {
    address = addressData.publicAddress
  } else {
    address = addressData.legacyAddress
    if (!address) {
      address = addressData.publicAddress
    }
  }
  const quote = {
    version: API.API_VERSION,
    partner: API.PROVIDER,
    payment_flow_type: 'wallet',
    return_url: API.RETURN_URL,
    quote_id: res.quote_id,
    wallet_id: res.wallet_id,
    payment_id: uuidv1(),
    order_id: res.quote_id,
    user_id: res.user_id,
    address: address,
    currency: res.digital_money.currency,
    fiat_total_amount_amount: res.fiat_money.total_amount,
    fiat_total_amount_currency: res.fiat_money.currency,
    fee: res.fiat_money.total_amount - res.fiat_money.base_amount,
    fiat_amount: res.fiat_money.base_amount,
    digital_amount: res.digital_money.amount,
    digital_currency: res.digital_money.currency
  }
  const rate = {
    currency: res.digital_money.currency,
    rate: quote.fiat_amount / quote.digital_amount
  }
  return { quote, rate }
}

const buyStyles = theme => ({
  card: {
    margin: '20px 0px',
    padding: '0px 10px'
  },
  h3: {
    color: theme.palette.primary.main,
    padding: 0,
    margin: '10px 0',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  warning: {
    color: theme.palette.primary.error,
    padding: 10,
    margin: '10px 0',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  conversion: {
    fontSize: '24pt',
    color: theme.palette.primary.main
  },
  p: {
    color: '#999',
    paddingBottom: '10px',
    textAlign: 'center'
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#000',
    padding: '10px 20px'
  }
})

type Props = {
  classes: Object,
  history: Object
}
type State = {
  currentWalletCurrencyCode: string | null,
  dialogOpen: boolean,
  drawerOpen: boolean,
  wallet: WalletDetails | null,
  rate: number | null,
  quote: BuyQuote | null,
  fiatSupport: boolean,
  fiatLoading: boolean,
  cryptoLoading: boolean,
  fiat: string,
  defaultFiat: string,
  error: string | null
}
class BuyScene extends Component<Props, State> {
  sessionId: string
  uaid: string
  constructor (props) {
    super(props)
    /* sessionId can be regenerated each time we come to this form */
    this.sessionId = API.sessionId()
    /* this only needs to persist with an install. localStorage will do */
    this.uaid = API.installId()

    this.state = {
      currentWalletCurrencyCode: null,
      dialogOpen: false,
      drawerOpen: false,
      rate: null,
      quote: null,
      fiatSupport: true,
      fiatLoading: false,
      cryptoLoading: false,
      fiat: 'USD',
      defaultFiat: 'USD',
      wallet: null,
      error: null
    }
  }

  componentDidMount () {
    window.scrollTo(0, 0)
  }

  loadConversion = async () => {
    const { wallet, fiat } = this.state
    if (!wallet) return
    try {
      const c = wallet.currencyCode
      // Use minimum fiat amount in order to return a quote from Simplex for initial conversion rate. Double it to avoid issues with outdated hardcoded limits.
      const result = await API.requestQuote(fiat, API.LIMITS[fiat].min * 2, c, fiat)
      const parsed = await result.json()
      const quoteRate = await buildObject(parsed.res, wallet)
      this.setState({ rate: Math.round(quoteRate.rate.rate * 100) / 100 })
    } catch (e) {
      this.setState({
        error: 'Unable to retrieve rates. Please try again later.'
      })
    }
  }

  next = () => {
    this.setState({
      dialogOpen: true
    })
  }

  cancel = () => {
    this.props.history.goBack()
  }

  handleAccept = async () => {
    API.requestConfirm(this.sessionId, this.uaid, this.state.quote)
      .then(data => data.json())
      .then(data => {
        // $FlowFixMe
        document.getElementById('payment_form').submit()
      })
      .catch(err => {
        console.log(' Error handle accept ', err)
        this.setState({
          dialogOpen: false
        })
      })
  }

  handleClose = () => {
    this.setState({
      dialogOpen: false
    })
  }

  getWalletDetails = () => {
    window.edgeProvider.getCurrentWalletInfo()
      .then(result => {
        if (API.SUPPORTED_DIGITAL_CURRENCIES.includes(result.currencyCode)) {
          /* Check if this wallets fiat currency is supported */
          const fiatSupport = API.SUPPORTED_FIAT_CURRENCIES.indexOf(result.fiatCurrencyCode) !== -1
          /* If we don't support this wallet's currency switch to the default */
          const fiat = fiatSupport ? result.fiatCurrencyCode : this.state.defaultFiat
          this.setState({
            wallet: result,
            fiatSupport,
            fiat
          }, () => {
            this.loadConversion()
          })
        }
      })
  }
  openWallets = () => {
    window.edgeProvider.chooseCurrencyWallet(API.SUPPORTED_DIGITAL_CURRENCIES)
      .then(result => {
        this.setState(
          {
            currentWalletCurrencyCode: result,
            rate: null,
            quote: null
          },
          () => {
            window.localStorage.setItem('last_selected_currency', result)
            setFiatInput('')
            setCryptoInput('')
            this.getWalletDetails()
          }
        )
      })
  }

  changeDefaultFiat = event => {
    this.setState(
      {
        defaultFiat: event.target.value,
        fiat: event.target.value,
        rate: null,
        quote: null
      },
      () => {
        this.loadConversion()
      }
    )
  }

  calcFiat = async event => {
    window.localStorage.setItem('last_crypto_amount', event.target.value)
    window.localStorage.removeItem('last_fiat_amount')
    if (event.target.value && event.target.value > 0) {
      this.setState({
        cryptoLoading: false,
        fiatLoading: true
      })
      if (!this.state.wallet) return
      const v = event.target.value
      const c = this.state.wallet.currencyCode
      try {
        const quote = await API.requestQuote(c, v, c, this.state.fiat)
        const parseQuote = await quote.json()
        const result = await buildObject(parseQuote.res, this.state.wallet)
        this.setState({
          fiatLoading: false,
          quote: result.quote,
          rate: Math.round(result.rate.rate * 100) / 100,
          error: undefined
        }, () => {
          setFiatInput(result.quote.fiat_amount)
        })
      } catch (e) {
        this.setState({error: e.message})
        console.log('calcFiat Error ', e)
      }
    } else {
      API.requestAbort()
      this.setState(
        {
          quote: null,
          fiatLoading: false,
          cryptoLoading: false
        },
        () => {
          setFiatInput('')
        }
      )
    }
  }

  calcCrypto = async event => {
    window.localStorage.setItem('last_fiat_amount', event.target.value)
    window.localStorage.removeItem('last_crypto_amount')
    if (event.target.value && event.target.value > 0) {
      this.setState({
        fiatLoading: false,
        cryptoLoading: true
      })
      if (!this.state.wallet) return
      const v = event.target.value
      const c = this.state.wallet.currencyCode
      try {
        const quote = await API.requestQuote(this.state.fiat, v, c, this.state.fiat)
        const parseQuote = await quote.json()
        const result = await buildObject(parseQuote.res, this.state.wallet)
        this.setState({
          cryptoLoading: false,
          quote: result.quote,
          rate: Math.round(result.rate.rate * 100) / 100,
          error: undefined
        }, () => {
          setCryptoInput(result.quote.digital_amount)
        })
      } catch (e) {
        this.setState({error: e.message})
        console.log(e)
      }
    } else {
      API.requestAbort()
      this.setState(
        {
          quote: null,
          fiatLoading: false,
          cryptoLoading: false
        },
        () => {
          setCryptoInput('')
        }
      )
    }
  }
  renderConfirmDialog = () => {
    if (this.state.quote) {
      const { quote, fiat, dialogOpen } = this.state
      return <ConfirmDialog
        address={quote.address}
        open={dialogOpen}
        acceptMsg={'Yes, go to payment'}
        rejectMsg={'Cancel'}
        header={'Confirm Purchase Details'}
        pendingMsg={'We are connecting to Simplex!'}
        onAccept={this.handleAccept}
        onClose={this.handleClose}
        message={() => {
          return `Are you sure you want to buy ${formatRate(quote.fiat_amount, fiat)}
            worth of ${quote.currency}, with a fee of ${formatRate(quote.fee, fiat)}?`
        }}
      />
    }
    return null
  }
  renderFiatSupportWarning = () => {
    const { classes } = this.props
    const { fiat, fiatSupport, wallet } = this.state
    if (wallet && !fiatSupport) {
      return <Typography component="h2" className={classes.warning}>
        Please note that {wallet.fiatCurrencyCode} is not supported by Simplex. Defaulting to
        <select defaultValue={fiat} onChange={this.changeDefaultFiat}>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="ILS">ILS</option>
          <option value="TRY">TRY</option>
          <option value="CAD">CAD</option>
          <option value="CHF">CHF</option>
          <option value="KRW">KRW</option>
          <option value="JPY">JPY</option>
          <option value="RUB">RUB</option>
          <option value="AUD">AUD</option>
          <option value="CZK">CZK</option>
          <option value="NOK">NOK</option>
          <option value="DKK">DKK</option>
          <option value="NZD">NZD</option>
          <option value="SEK">SEK</option>
          <option value="ZAR">ZAR</option>
          <option value="HUF">HUF</option>
          <option value="PLN">PLN</option>
          <option value="INR">INR</option>
          <option value="AED">AED</option>
        </select>
      </Typography>
    }
    return null
  }
  renderConversionCard = () => {
    if (this.state.currentWalletCurrencyCode) {
      const { classes } = this.props
      return <Card className={classes.card}>
        <CardContent>
          <Typography component="h3" className={classes.h3}>
            Conversion Rate
          </Typography>
          {!this.state.rate && <CircularProgress size={25} />}
          {this.state.rate && (
            <Typography component="p" className={classes.conversion}>
              1 {this.state.currentWalletCurrencyCode} = {this.state.rate} {this.state.fiat}
            </Typography>
          )}
        </CardContent>
      </Card>
    }
    return null
  }
  renderDestinationDetails = () => {
    const { classes } = this.props
    return <Card className={classes.card}>
      <CardContent>
        <Typography variant="headline" component="h3" className={classes.h3}>
          Destination Wallet
          {this.state.wallet && <span>: {this.state.wallet.name}</span>}
        </Typography>
        <EdgeButton color="primary" onClick={this.openWallets}>
          Choose Destination Wallet
        </EdgeButton>
      </CardContent>
    </Card>
  }
  renderAmountSelector = (errors) => {
    const { classes } = this.props
    const { fiat, wallet } = this.state
    if (!this.state.currentWalletCurrencyCode) {
      return null
    }
    return <Card className={classes.card}>
      <CardContent>
        <Typography variant="headline" component="h3" className={classes.h3}>
          Purchase Amount
        </Typography>

        <TextField
          id="cryptoInput"
          type="number"
          label="Enter Amount"
          margin="none"
          fullWidth
          disabled={this.state.cryptoLoading}
          InputLabelProps={{
            shrink: true
          }}
          tabIndex={1}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {this.state.cryptoLoading && <CircularProgress size={25} />}
                {!this.state.cryptoLoading && wallet && this.state.currentWalletCurrencyCode}
              </InputAdornment>
            )
          }}
          onChange={this.calcFiat}
        />

        <TextField
          id="fiatInput"
          type="number"
          label="Enter Amount"
          {...errors}
          margin="none"
          fullWidth
          disabled={this.state.fiatLoading}
          InputLabelProps={{
            shrink: true
          }}
          tabIndex={2}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {this.state.fiatLoading && <CircularProgress size={25} />}
                {!this.state.fiatLoading && fiat}
              </InputAdornment>
            )
          }}
          onChange={this.calcCrypto}
        />

        <DailyLimit fiat={fiat} dailyLimit={API.LIMITS[fiat].daily} monthlyLimit={API.LIMITS[fiat].monthly} />
      </CardContent>
    </Card>
  }
  renderButtonCard = (errors: Object) => {
    const { classes } = this.props
    const { quote } = this.state
    if (!this.state.currentWalletCurrencyCode) {
      return null
    }
    return <Card className={classes.card}>
      <CardContent>
        <Typography component="p" className={classes.p}>
          You will see a confirmation screen before you buy.
        </Typography>
        {quote && quote.address && (
          <p style={{ textAlign: 'center', maxWidth: '100%', wordWrap: 'break-word', overflowWrap: 'break-word', flexWrap: 'wrap' }} component="p">
            Payment will be sent to
            <br />
            <strong style={{ maxWidth: '100%', wordWrap: 'break-word', overflowWrap: 'break-word', flexWrap: 'wrap' }} className={classes.address}>
              {quote.address}
            </strong>
          </p>
        )}
        <EdgeButton tabIndex={3} color="primary" onClick={this.next} disabled={quote === null || errors.error}>
          Next
        </EdgeButton>
        <EdgeButton onClick={this.cancel} tabIndex={4}>
          Cancel
        </EdgeButton>
      </CardContent>
    </Card>
  }
  renderForm = () => {
    if (this.state.quote) {
      return <API.SimplexForm quote={this.state.quote} />
    }
    return null
  }
  renderError = (errors: Object) => {
    if (errors.error) {
      return <div className={this.props.classes.error}>
        <p>{errors.helperText}</p>
      </div>
    }
    if (this.state.error) {
      return <div className={this.props.classes.error}>
        <p>{this.state.error}</p>
      </div>
    }
    return null
  }
  render () {
    const { fiat, quote } = this.state
    let errors = {
      error: false,
      helperText: ''
    }
    if (quote) {
      if (quote.fiat_total_amount_amount > API.LIMITS[fiat].daily) {
        errors = { error: true, helperText: 'Exceeding daily limit' }
      } else if (quote.fiat_total_amount_amount > API.LIMITS[fiat].monthly) {
        errors = { error: true, helperText: 'Exceeding monthly limit' }
      } else if (quote.fiat_total_amount_amount < API.LIMITS[fiat].min) {
        window.edgeProvider.consoleLog('In the error ' + API.LIMITS[fiat].min)
        errors = {
          error: true,
          helperText: `Below the minimum of ${formatRate(API.LIMITS[fiat].min, fiat)}`
        }
      }
    }
    return (
      <div>
        {this.renderConfirmDialog()}
        {this.renderFiatSupportWarning()}
        {this.renderDestinationDetails()}
        {this.renderConversionCard()}
        {this.renderError(errors)}
        {this.renderAmountSelector(errors)}
        {this.renderButtonCard(errors)}
        {this.renderForm()}
        <Support />
        <PoweredBy />
      </div>
    )
  }
}

export default withStyles(buyStyles)(BuyScene)
