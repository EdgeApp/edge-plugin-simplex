import PropTypes from 'prop-types'
import React from 'react'
import { withStyles } from 'material-ui/styles'
import Card, { CardContent } from 'material-ui/Card'
import TextField from 'material-ui/TextField'
import { InputAdornment } from 'material-ui/Input'
import Typography from 'material-ui/Typography'
import { CircularProgress } from 'material-ui/Progress'
import uuidv1 from 'uuid/v1'
import { core, ui } from 'edge-libplugin'

import * as API from './api'
import {
  DailyLimit,
  EdgeButton,
  ConfirmDialog,
  Support,
  PoweredBy,
  WalletDrawer
} from './components'

import './inline.css'

const DEFAULT_FIAT_CURRENCY = 'USD'

const formatRate = (rate, currency) => {
  return rate.toLocaleString(undefined, {
    style: 'currency',
    currency: currency
  })
}

const setFiatInput = (value) => {
  setDomValue('fiatInput', value)
}

const setCryptoInput = (value) => {
  setDomValue('cryptoInput', value)
}

const setDomValue = (id, value) => {
  if (document.getElementById(id)) {
    document.getElementById(id).value = value
  }
}

const buildObject = async (res, wallet) => {
  // let addressData = await core.getAddress(wallet.id, wallet.currencyCode)
  const addressData = '1BnT87d7jeqmT7kr49kLMUsNzCeKQq2mBT'
  const quote = {
    version: API.API_VERSION,
    partner: API.PROVIDER,
    payment_flow_type: 'wallet',
    return_url: API.RETURN_URL,
    quote_id: res.quote_id,
    wallet_id: res.wallet_id,
    payment_id: res.quote_id,
    order_id: res.quote_id,
    user_id: res.user_id,
    address: addressData,
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
    rate: (quote.fiat_amount / quote.digital_amount)
  }
  return {quote, rate}
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
  }
})

class BuyScene extends React.Component {
  constructor (props) {
    super(props)
    /* sessionId can be regenerated each time we come to this form */
    this.sessionId = uuidv1()
    /* this should be written to the encrypted storage */
    this.userId = window.localStorage.getItem('simplex_user_id') || uuidv1()
    /* this only needs to persist with an install. localStorage will do */
    this.uaid = window.localStorage.getItem('simplex_install_id') || uuidv1()
    window.localStorage.setItem('simplex_install_id', this.uaid)

    const wallets = [
      {id: 'BTC', name: 'BTC', currencyCode: 'BTC', fiatCurrency: 'USD'},
      {id: 'ETH', name: 'ETH', currencyCode: 'ETH', fiatCurrency: 'USD'},
      {id: 'BTC-EUR', name: 'BTC-EUR', currencyCode: 'BTC', fiatCurrency: 'EUR'},
      {id: 'BTC-MXN', name: 'BTC-MXN', currencyCode: 'BTC', fiatCurrency: 'MXN'}
    ]
    this.state = {
      dialogOpen: false,
      drawerOpen: false,
      wallets: wallets,
      rate: null,
      quote: null,
      fiatSupport: true,
      fiat: null
    }
  }
  componentWillMount () {
    window.scrollTo(0, 0)
    if (this.state.wallets.length > 0) {
      this.selectWallet(this.state.wallets[0])
    }
    this.loadWallets()
  }
  loadWallets = () => {
    core.wallets()
      .then((data) => {
        this.setState({
          wallets: data.filter((wallet) =>
            API.SUPPORTED_DIGITAL_CURRENCIES.indexOf(wallet.currencyCode) >= 0)
        }, () => {
          if (this.state.wallets.length > 0) {
            this.selectWallet(this.state.wallets[0])
          } else {
            // Probably exit...not available wallets
          }
        })
      })
      .catch(() => {
        ui.showAlert(false, 'Error', 'Unable to fetch wallets. Please try again later.')
        core.exit()
      })
  }
  loadConversion = () => {
    const c = this.state.selectedWallet.currencyCode
    API.requestQuote(this.userId, c, 1, c, DEFAULT_FIAT_CURRENCY)
      .then(data => data.json())
      .then(r => buildObject(r.res, this.state.selectedWallet))
      .then(r => this.setState({rate: r.rate}))
  }
  next = () => {
    this.setState({
      dialogOpen: true
    })
  }
  cancel = () => {
    this.props.history.goBack()
    ui.navStackPop()
  }
  handleAccept = () => {
    this.setState({
      dialogOpen: false
    })
    API.requestConfirm(
      this.userId, this.sessionId,
      this.uaid, this.state.quote)
      .then((data) => data.json())
      .then((data) => {
        console.log(data)
        document.getElementById('payment_form').submit()
      })
      .catch((err) => {
        /* Tell the user dummy */
        console.log(err)
      })
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
  selectWallet = (wallet) => {
    /* Check if this wallets fiat currency is supported */
    const fiatSupport = API.SUPPORTED_FIAT_CURRENCIES.indexOf(wallet.fiatCurrency) !== -1
    /* If we don't support this wallet's currency switch to the default */
    const fiat = fiatSupport ? wallet.fiatCurrency : DEFAULT_FIAT_CURRENCY
    this.closeWallets()
    this.setState({
      selectedWallet: wallet,
      rate: null,
      quote: null,
      fiatSupport,
      fiat
    }, () => {
      this.loadConversion()
    })
    setFiatInput('')
    setCryptoInput('')
    ui.title(`Buy ${wallet.currencyCode}`)
  }

  calcFiat = (event) => {
    if (event.target.value) {
      this.setState({
        cryptoLoading: false,
        fiatLoading: true
      })
      const v = event.target.value
      const c = this.state.selectedWallet.currencyCode
      API.requestQuote(this.userId, c, v, c, DEFAULT_FIAT_CURRENCY)
        .then(data => data.json())
        .then(r => buildObject(r.res, this.state.selectedWallet))
        .then(r => {
          this.setState({
            fiatLoading: false,
            quote: r.quote,
            rate: r.rate
          })
          setFiatInput(r.quote.fiat_amount)
        })
        .catch(err => {
          core.debugLevel(0, JSON.stringify(err))
        })
    } else {
      API.requestAbort()
      this.setState({
        quote: null,
        fiatLoading: false,
        cryptoLoading: false
      })
    }
  }

  calcCrypto = async (event) => {
    console.log(event)
    if (event.target.value) {
      this.setState({
        fiatLoading: false,
        cryptoLoading: true
      })
      const v = event.target.value
      const c = this.state.selectedWallet.currencyCode
      API.requestQuote(this.userId, DEFAULT_FIAT_CURRENCY, v, c, DEFAULT_FIAT_CURRENCY)
        .then(data => data.json())
        .then(r => buildObject(r.res, this.state.selectedWallet))
        .then(r => {
          this.setState({
            cryptoLoading: false,
            quote: r.quote,
            rate: r.rate
          })
          setCryptoInput(r.quote.digital_amount)
        })
        .catch(err => {
          core.debugLevel(0, JSON.stringify(err))
        })
    } else {
      API.requestAbort()
      this.setState({
        quote: null,
        fiatLoading: false,
        cryptoLoading: false
      })
    }
  }

  render () {
    const { classes } = this.props
    const {fiat, fiatSupport, selectedWallet} = this.state
    return (
      <div>
        {this.state.quote && (
          <ConfirmDialog
            fiatAmount={formatRate(this.state.quote.fiat_amount, this.state.fiat)}
            fee={formatRate(this.state.quote.fee, fiat)}
            currency={this.state.quote.currency}
            open={this.state.dialogOpen}
            onAccept={this.handleAccept}
            onClose={this.handleClose} />
        )}
        {selectedWallet && !fiatSupport && (
          <Typography
            component="h2"
            className={classes.warning}>
            Please note that {selectedWallet.fiatCurrency} is not supported by Simplex. Defaulting to {fiat}.
          </Typography>
        )}
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
                1{this.state.rate.currency} = {formatRate(this.state.rate.rate, fiat)}
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card className={classes.card}>
          <CardContent>
            <Typography
              variant="headline"
              component="h3"
              className={classes.h3}>
              Destination Wallet
              {this.state.selectedWallet && (
                <span>: {this.state.selectedWallet.name}</span>
              )}
            </Typography>
            <EdgeButton color="primary" onClick={this.openWallets}>
              Change Destination Wallet
            </EdgeButton>
          </CardContent>
        </Card>

        <Card className={classes.card}>
          <CardContent>
            <Typography
              variant="headline"
              component="h3"
              className={classes.h3}>
              Purchase Amount
            </Typography>

            <TextField id="cryptoInput" type="number" label="Enter Amount"
              margin="none"
              fullWidth
              disabled={this.state.cryptoLoading}
              InputLabelProps={{
                shrink: true
              }}
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
              margin="none" fullWidth
              disabled={this.state.fiatLoading}
              InputLabelProps={{
                shrink: true
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {this.state.fiatLoading && <CircularProgress size={25} />}
                    {!this.state.fiatLoading && fiat}
                  </InputAdornment>)
              }}
              onChange={this.calcCrypto}
            />

            <DailyLimit dailyLimit="$20,000" monthlyLimit="$50,000" />
          </CardContent>
        </Card>

        <Card className={classes.card}>
          <CardContent>
            <Typography component="p" className={classes.p}>
              You will see a confirmation screen before you buy.
            </Typography>
            <EdgeButton
              color="primary"
              onClick={this.next}
              disabled={this.state.quote === null}>
              Next
            </EdgeButton>
            <EdgeButton onClick={this.cancel}>Cancel</EdgeButton>
          </CardContent>
        </Card>

        {this.state.quote &&
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

BuyScene.propTypes = {
  classes: PropTypes.object,
  history: PropTypes.object
}

export default withStyles(buyStyles)(BuyScene)
