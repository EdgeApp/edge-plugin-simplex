// @flow
import './inline.css'

import * as API from './api'

import Card, { CardContent } from 'material-ui/Card'
import { DailyLimit, PoweredBy, Support } from './components'
import type { Quote, QuoteAndRate, WalletDetails } from './types'
import React, { Component } from 'react'
import { convertFromMillionsUnits, formatRate, setCryptoInput, setFiatInput } from './utils'

import { CircularProgress } from 'material-ui/Progress'
import { ConfirmDialog } from './components/ConfirmDialog'
import { EdgeButton } from './components/EdgeButton'
import { InputAdornment } from 'material-ui/Input'
import TextField from 'material-ui/TextField'
import Typography from 'material-ui/Typography'
import styles from './FormStyles'
import { withStyles } from 'material-ui/styles'

// wallets: PropTypes.array,
type Props = {
  classes: Object,
  history: Object,
  supported_fiat_currencies: Array<string>,
  supported_digital_currencies: Array<string>,
  requestCryptoQuote(string, string, string): QuoteAndRate,
  requestFiatQuote(number, string, string): QuoteAndRate,
  handleAccept(Quote): void,
  dialogMessage(Quote): void
}

type State = {
  wallet: WalletDetails | null,
  dialogOpen: boolean,
  currentWalletCurrencyCode: string | null,
  rate: string | null,
  quote: Quote | null,
  fiatSupport: boolean,
  fiat: string,
  defaultFiat: string,
  cryptoLoading: boolean,
  fiatLoading: boolean,
  error: string | null
}

class BuySellForm extends Component<Props, State> {
  constructor (props) {
    super(props)
    this.state = {
      currentWalletCurrencyCode: 'BTC',
      dialogOpen: false,
      rate: null,
      quote: null,
      fiatSupport: true,
      fiat: 'EUR',
      defaultFiat: 'EUR',
      cryptoLoading: false,
      fiatLoading: false,
      error: null,
      wallet: null
    }
    this.loadConversion()
  }

  componentDidMount () {
    window.scrollTo(0, 0)
    const lastWallet = window.localStorage.getItem('last_selected_wallet')
    if (lastWallet) {
      this.setState({
        currentWalletCurrencyCode: lastWallet.currencyCode,
        rate: null,
        quote: null
      },
      () => {
        window.localStorage.setItem('last_selected_currency', lastWallet)
        setFiatInput('')
        setCryptoInput('')
        this.loadConversion()
      })
    } else {
      this.openWallets()
    }
  }

  loadConversion = async () => {
    const cryptoCurrency = this.state.currentWalletCurrencyCode
    const cryptoAmount = 1
    try {
      if (cryptoCurrency) {
        const fiatQuote = await this.props.requestFiatQuote(cryptoAmount, cryptoCurrency, this.state.defaultFiat)
        this.setState({ rate: fiatQuote.rate })
      }
    } catch (err) {
      console.log('loadConversion ', err)
      this.errorHandler(err)
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

  handleClose = () => {
    this.setState({
      dialogOpen: false
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
        setCryptoInput('')
        setFiatInput('')
        this.loadConversion()
      }
    )
  }
  getWalletDetails = () => {
    window.edgeProvider.getCurrentWalletInfo()
      .then(result => {
        if (this.props.supported_digital_currencies.includes(result.currencyCode)) {
          this.setState({
            wallet: result
          })
        }
      })
  }
  openWallets = () => {
    window.edgeProvider.chooseCurrencyWallet(this.props.supported_digital_currencies)
      .then(result => {
        this.setState(
          {
            currentWalletCurrencyCode: result/* ,
            rate: null,
            quote: null */
          },
          () => {
            window.localStorage.setItem('last_selected_currency', result)
            /*  setFiatInput('')
            setCryptoInput('') */
            this.loadConversion()
            this.getWalletDetails()
          }
        )
      })
  }

  calcFiat = async event => {
    window.localStorage.setItem('last_crypto_amount', event.target.value)
    window.localStorage.removeItem('last_fiat_amount')
    if (event.target.value && event.target.value > 0) {
      this.setState({
        cryptoLoading: false,
        fiatLoading: true
      })
      const cryptoValue = event.target.value
      const cryptoCurrency = this.state.currentWalletCurrencyCode
      try {
        if (cryptoCurrency) {
          const fiatQuote = await this.props.requestFiatQuote(cryptoValue, cryptoCurrency, this.state.defaultFiat)
          this.setState({
            fiatLoading: false,
            quote: fiatQuote.quote,
            rate: fiatQuote.rate,
            error: null
          })
          setFiatInput(fiatQuote.quote.fiat_amount)
        }
      } catch (err) {
        console.log('calcFiat  Error', err)
        this.errorHandler(err)
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
      const fiatValue = event.target.value
      const fiatCurrency = this.state.currentWalletCurrencyCode //  this has to be wrong.
      try {
        if (fiatCurrency) {
          const r = await this.props.requestCryptoQuote(fiatValue, fiatCurrency, this.state.defaultFiat)
          this.setState({
            cryptoLoading: false,
            quote: r.quote,
            rate: r.rate,
            error: null
          })
          setCryptoInput(r.quote.crypto_amount)
        }
      } catch (err) {
        console.log('calcCrypto ', err)
        this.errorHandler(err)
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
  errorHandler = e => {
    if (e.isCanceled) {
      return
    }
    let errorMessage
    try {
      const error = JSON.parse(e.message)
      if (error.code === 'user_limit_exceeded') {
        errorMessage = 'Sorry, you have exceeded your limit, please try again tomorrow.'
      } else if (error.code === 'amounts_too_small') {
        const { limit_amount: limitAmount, currency } = error.params
        errorMessage = `Amount is too small, should be at least ${convertFromMillionsUnits(limitAmount)} ${currency} or more.`
      }
    } catch (e) {
      console.log('Error ', e)
      errorMessage = 'Unable to proceed. Please try again later.'
    }
    this.setState({
      error: errorMessage,
      quote: null
    })
    window.scrollTo(0, 0)
  }

  handleAccept = async () => {
    try {
      const { wallet, quote } = this.state
      if (quote && wallet) {
        quote.refund_address = wallet.receiveAddress.publicAddress
        await this.props.handleAccept(quote)
        this.setState({ error: null, dialogOpen: false })
      }
    } catch (e) {
      console.log('handleAccept ', e)
      this.errorHandler(e)
    }
  }

  dialogMessage = () => {
    if (this.state.quote) {
      return this.props.dialogMessage(this.state.quote)
    }
  }

  render () {
    const { classes } = this.props
    const { fiat, quote } = this.state
    let errors = {
      error: false,
      helperText: ''
    }
    if (1 === 0 && quote) {
      if (quote.fiat_amount > API.LIMITS[fiat].daily) {
        errors = { error: true, helperText: 'Exceeding daily limit' }
      } else if (quote.fiat_amount > API.LIMITS[fiat].monthly) {
        errors = { error: true, helperText: 'Exceeding monthly limit' }
      } else if (quote.fiat_amount < API.LIMITS[fiat].min) {
        errors = {
          error: true,
          helperText: `Below the minimum of ${formatRate(API.LIMITS[fiat].min, fiat)}`
        }
      }
    }
    const buttonText = this.state.wallet ? 'Change Source Wallet' : 'Select Source Wallet'
    // quote === null || errors.error || !this.state.wallet
    console.log('Quote : ', quote)
    console.log('errors.error : ', errors.error)
    console.log('this.state.wallet : ', this.state.wallet)
    return (
      <div>
        {this.state.error && (
          <div className={this.props.classes.error}>
            <p>{this.state.error}</p>
          </div>
        )}
        {this.state.quote && (
          <ConfirmDialog
            message={this.dialogMessage}
            open={this.state.dialogOpen}
            acceptMsg={'Yes, start the process'}
            rejectMsg={'Cancel'}
            header={'Confirm Transaction Details'}
            pendingMsg={'We are connecting to Simplex'}
            onAccept={this.handleAccept}
            onClose={this.handleClose}
          />
        )}
        <Typography component="h2" className={classes.warning}>
          Please note that at the moment only Visa cards issued in EU are supported. More options will be available soon.
        </Typography>
        {!this.state.error && (
          <Card className={classes.card}>
            <CardContent>
              <Typography component="h3" className={classes.h3}>
                Exchange rate
              </Typography>
              {!this.state.rate && <CircularProgress size={25} />}
              {this.state.rate && (
                <Typography component="p" className={classes.conversion}>
                  1 {this.state.currentWalletCurrencyCode} = {this.state.rate} {fiat}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        <Card className={classes.card}>
          <CardContent>
            <Typography variant="headline" component="h3" className={classes.h3}>
              Source Wallet
              {this.state.wallet && <span>: {this.state.wallet.name}</span>}
            </Typography>
            <EdgeButton color="primary" onClick={this.openWallets}>
              {buttonText}
            </EdgeButton>
          </CardContent>
        </Card>

        <Card className={classes.card}>
          <CardContent>
            <TextField
              id="cryptoInput"
              type="number"
              label={'Enter amount you wish to sell'}
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
                    {!this.state.cryptoLoading && this.state.currentWalletCurrencyCode}
                  </InputAdornment>
                )
              }}
              onChange={this.calcFiat}
            />

            <TextField
              id="fiatInput"
              type="number"
              label="You will receive"
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

            <DailyLimit fiat={fiat} dailyLimit={API.SELL_LIMITS[fiat].daily} monthlyLimit={API.SELL_LIMITS[fiat].monthly} />
          </CardContent>
        </Card>

        <Card className={classes.card}>
          <CardContent>
            <Typography component="p" className={classes.p}>
              You will see a confirmation screen before you sell.
            </Typography>
            <EdgeButton tabIndex={3} color="primary" onClick={this.next} disabled={quote === null || errors.error || !this.state.wallet}>
              Next
            </EdgeButton>
            <EdgeButton onClick={this.cancel} tabIndex={4}>
              Cancel
            </EdgeButton>
          </CardContent>
        </Card>

        {quote && <API.SimplexForm quote={this.state.quote} />}

        <Support />
        <PoweredBy />
      </div>
    )
  }
}

export default withStyles(styles)(BuySellForm)
