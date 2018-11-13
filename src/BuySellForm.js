import PropTypes from 'prop-types'
import React from 'react'
import { withStyles } from 'material-ui/styles'
import Card, { CardContent } from 'material-ui/Card'
import TextField from 'material-ui/TextField'
import { InputAdornment } from 'material-ui/Input'
import Typography from 'material-ui/Typography'
import { CircularProgress } from 'material-ui/Progress'
import { core, ui } from 'edge-libplugin'

import * as API from './api'
import { formatRate, setFiatInput, setCryptoInput } from './utils'
import {
  DailyLimit,
  EdgeButton,
  ConfirmDialog,
  Support,
  PoweredBy,
  WalletDrawer
} from './components'

import './inline.css'
import styles from './FormStyles'

class BuySellForm extends React.Component {
  constructor (props) {
    super(props)
    /* sessionId can be regenerated each time we come to this form */
    this.sessionId = API.sessionId()
    /* this only needs to persist with an install. localStorage will do */
    this.uaid = API.installId()

    this.state = {
      dialogOpen: false,
      drawerOpen: false,
      wallets: this.props.wallets,
      rate: null,
      quote: null,
      fiatSupport: true,
      fiat: 'USD',
      defaultFiat: 'USD'
    }
  }

  UNSAFE_componentWillMount () {
    window.scrollTo(0, 0)
    if (this.state.wallets.length > 0) {
      this.selectWallet(this.state.wallets[0])
    }
    this.loadWallets()
  }

  loadWallets = async () => {
    try {
      const data = await core.wallets()
      this.setState({
        wallets: data.filter((wallet) =>
          this.props.supported_digital_currencies.indexOf(wallet.currencyCode) >= 0)
      }, () => {
        if (this.state.wallets.length > 0) {
          let i = 0
          const lastWallet = window.localStorage.getItem('last_wallet')
          if (lastWallet) {
            for (; i < this.state.wallets.length; ++i) {
              if (this.state.wallets[i].id === lastWallet) {
                break
              }
            }
            if (i >= this.state.wallets.length) {
              i = 0
            }
          }
          this.selectWallet(this.state.wallets[i])
        } else {
          // Probably exit...not available wallets
        }
      })
    } catch (err) {
      this.setState({
        error: 'Unable to fetch wallets. Please try again later.'
      })
      ui.showAlert(false, 'Error', 'Unable to fetch wallets. Please try again later.')
      ui.exit()
    }
  }

  loadConversion = async () => {
    const c = this.state.selectedWallet.currencyCode
    const v = 1
    try {
      const r = await this.props.requestCryptoQuote(
        v, c, this.state.defaultFiat, this.state.selectedWallet)
      this.setState({rate: r.rate})
    } catch (err) {
      this.setState({
        error: 'Unable to retrieve rates. Please try again later.'
      })
      ui.showAlert(false, 'Error', 'Unable to retrieve rates. Please try again later.')
      ui.exit()
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

  openWallets = () => {
    this.setState({
      drawerOpen: true
    })
  }

  closeWallets = () => {
    this.setState({
      drawerOpen: false
    })
  }

  changeDefaultFiat = (event) => {
    this.setState({
      defaultFiat: event.target.value,
      fiat: event.target.value,
      rate: null,
      quote: null
    }, () => {
      this.loadConversion()
    })
  }

  selectWallet = (wallet) => {
    if (!wallet || !wallet.id) {
      return
    }
    /* Check if this wallets fiat currency is supported */
    const fiatSupport = this.props.supported_fiat_currencies.indexOf(wallet.fiatCurrencyCode) !== -1
    /* If we don't support this wallet's currency switch to the default */
    const fiat = fiatSupport ? wallet.fiatCurrencyCode : this.state.defaultFiat
    this.closeWallets()
    this.setState({
      selectedWallet: wallet,
      rate: null,
      quote: null,
      fiatSupport,
      fiat,
      defaultFiat: fiat
    }, () => {
      const lastCrypto = window.localStorage.getItem('last_crypto_amount')
      const lastFiat = window.localStorage.getItem('last_fiat_amount')
      if (lastCrypto) {
        setCryptoInput(lastCrypto)
        this.calcFiat({target: {value: lastCrypto}})
      } else if (lastFiat) {
        setFiatInput(lastFiat)
        this.calcCrypto({target: {value: lastFiat}})
      } else {
        setFiatInput('')
        setCryptoInput('')
        this.loadConversion()
      }
      window.localStorage.removeItem('last_crypto_amount')
      window.localStorage.removeItem('last_fiat_amount')
    })
    ui.title(`Sell ${wallet.currencyCode}`)
    window.localStorage.setItem('last_wallet', wallet.id)
  }

  calcFiat = async (event) => {
    window.localStorage.setItem('last_crypto_amount', event.target.value)
    window.localStorage.removeItem('last_fiat_amount')
    if (event.target.value && event.target.value > 0) {
      this.setState({
        cryptoLoading: false,
        fiatLoading: true
      })
      const v = event.target.value
      const c = this.state.selectedWallet.currencyCode
      try {
        const r = await this.props.requestFiatQuote(
          v, c, this.state.defaultFiat, this.state.selectedWallet)
        this.setState({
          fiatLoading: false,
          quote: r.quote,
          rate: r.rate,
          error: null
        })
        setFiatInput(r.quote.fiat_amount)
      } catch (err) {
        console.log(err)
        this.setState({
          error: 'Unable to retrieve rates. Please try again later.'
        })
      }
    } else {
      API.requestAbort()
      this.setState({
        quote: null,
        fiatLoading: false,
        cryptoLoading: false
      }, () => {
        setFiatInput('')
      })
    }
  }

  calcCrypto = async (event) => {
    window.localStorage.setItem('last_fiat_amount', event.target.value)
    window.localStorage.removeItem('last_crypto_amount')
    if (event.target.value && event.target.value > 0) {
      this.setState({
        fiatLoading: false,
        cryptoLoading: true
      })
      const v = event.target.value
      const c = this.state.selectedWallet.currencyCode
      try {
        const r = await this.props.requestCryptoQuote(
          v, c, this.state.defaultFiat, this.state.selectedWallet)
        this.setState({
          cryptoLoading: false,
          quote: r.quote,
          rate: r.rate,
          error: null
        })
        setCryptoInput(r.quote.crypto_amount)
      } catch (err) {
        console.log(err)
        this.setState({
          error: 'Unable to calculate conversion rate. Please try again later.'
        })
      }
    } else {
      API.requestAbort()
      this.setState({
        quote: null,
        fiatLoading: false,
        cryptoLoading: false
      }, () => {
        setCryptoInput('')
      })
    }
  }

  handleAccept = async () => {
    try {
      await this.props.handleAccept(this.uaid, this.state.quote)
      this.setState({error: null})
    } catch (err) {
      this.setState({
        error: 'Unable to proceed. Please try again later.',
        quote: null
      })
      setFiatInput('')
      setCryptoInput('')
      this.loadConversion()
    }
  }

  dialogMessage = () => {
    return this.props.dialogMessage(this.state.quote)
  }

  render () {
    const { classes } = this.props
    const { fiat, fiatSupport, selectedWallet, quote } = this.state
    let errors = {
      error: false, helperText: ''
    }
    if (1 === 0 && quote) {
      if (quote.fiat_amount > API.LIMITS[fiat].daily) {
        errors = {error: true, helperText: 'Exceeding daily limit'}
      } else if (quote.fiat_amount > API.LIMITS[fiat].monthly) {
        errors = {error: true, helperText: 'Exceeding monthly limit'}
      } else if (quote.fiat_amount < API.LIMITS[fiat].min) {
        errors = {
          error: true,
          helperText: `Below the minimum of ${formatRate(API.LIMITS[fiat].min, fiat)}`
        }
      }
    }
    return (
      <div>
        {this.state.error && (
          <div className={this.props.classes.error}>
            <p>
              {this.state.error}
            </p>
          </div>
        )}
        {this.state.quote && (
          <ConfirmDialog
            message={this.dialogMessage}
            open={this.state.dialogOpen}
            onAccept={this.handleAccept}
            onClose={this.handleClose}
          />
        )}
        {selectedWallet && !fiatSupport && (
          <Typography
            component="h2"
            className={classes.warning}>
            Please note that {selectedWallet.fiatCurrencyCode} is not supported by Simplex.
            Defaulting to
            <select defaultValue={fiat} onChange={this.changeDefaultFiat}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </Typography>
        )}
        {!this.state.error && (
          <Card className={classes.card}>
            <CardContent>
              <Typography
                component="h3"
                className={classes.h3}>
                Conversion Rate
              </Typography>
              {!this.state.rate && (
                <CircularProgress size={25} />
              )}
              {this.state.rate && (
                <Typography component="p" className={classes.conversion}>
                  1{this.state.rate.currency} = {formatRate(this.state.rate, fiat)}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        <Card className={classes.card}>
          <CardContent>
            <Typography
              variant="headline"
              component="h3"
              className={classes.h3}>
              Source Wallet
              {this.state.selectedWallet && (
                <span>: {this.state.selectedWallet.name}</span>
              )}
            </Typography>
            <EdgeButton color="primary" onClick={this.openWallets}>
              Change Source Wallet
            </EdgeButton>
          </CardContent>
        </Card>

        <Card className={classes.card}>
          <CardContent>
            <Typography
              variant="headline"
              component="h3"
              className={classes.h3}>
              Sell Amount
            </Typography>

            <TextField id="cryptoInput" type="number" label="Enter Amount"
              margin="none" fullWidth
              disabled={this.state.cryptoLoading}
              InputLabelProps={{
                shrink: true
              }}
              tabIndex={1}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {this.state.cryptoLoading && <CircularProgress size={25} />}
                    {!this.state.cryptoLoading && selectedWallet && this.state.selectedWallet.currencyCode}
                  </InputAdornment>)
              }}
              onChange={this.calcFiat}
            />

            <TextField id="fiatInput" type="number" label="Enter Amount"
              {...errors}
              margin="none" fullWidth
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
                  </InputAdornment>)
              }}
              onChange={this.calcCrypto}
            />

            <DailyLimit
              fiat={fiat}
              dailyLimit={API.LIMITS[fiat].daily}
              monthlyLimit={API.LIMITS[fiat].monthly} />
          </CardContent>
        </Card>

        <Card className={classes.card}>
          <CardContent>
            <Typography component='p' className={classes.p}>
              You will see a confirmation screen before you buy.
            </Typography>
            {quote && quote.address && (
              <p style={{textAlign: 'center', maxWidth: '100%', wordWrap: 'break-word', overflowWrap: 'break-word', flexWrap: 'wrap'}} component='p'>
                Payment will be sent to<br />
                <strong style={{maxWidth: '100%', wordWrap: 'break-word', overflowWrap: 'break-word', flexWrap: 'wrap'}} className={classes.address}>{quote.address}</strong>
              </p>
            )}
            <EdgeButton
              tabIndex={3}
              color='primary'
              onClick={this.next}
              disabled={quote === null || errors.error}>
              Next
            </EdgeButton>
            <EdgeButton onClick={this.cancel} tabIndex={4}>Cancel</EdgeButton>
          </CardContent>
        </Card>

        {quote &&
          <API.SimplexForm quote={this.state.quote} />}

        <Support />
        <PoweredBy />
        <WalletDrawer
          open={this.state.drawerOpen}
          selectWallet={this.selectWallet}
          onHeaderClick={this.closeWallets}
          onClose={this.closeWallets}
          wallets={this.state.wallets} />
      </div>
    )
  }
}

BuySellForm.propTypes = {
  classes: PropTypes.object,
  history: PropTypes.object,
  wallets: PropTypes.array,
  supported_fiat_currencies: PropTypes.array.isRequired,
  supported_digital_currencies: PropTypes.array.isRequired,
  requestCryptoQuote: PropTypes.func.isRequired,
  requestFiatQuote: PropTypes.func.isRequired,
  handleAccept: PropTypes.func.isRequired,
  dialogMessage: PropTypes.func.isRequired
}

export default withStyles(styles)(BuySellForm)
