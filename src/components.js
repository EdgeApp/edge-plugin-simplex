import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { withStyles } from 'material-ui/styles'
import Button from 'material-ui/Button'
import Typography from 'material-ui/Typography'
import Grid from 'material-ui/Grid'
import Drawer from 'material-ui/Drawer'
import Dialog, {
  DialogContent,
  DialogContentText,
  DialogTitle
} from 'material-ui/Dialog'
import { CircularProgress } from 'material-ui/Progress'
import { DEV, formatRate, formatStatus } from './utils'
import moment from 'moment'

import * as API from './api'
import { ui, core } from 'edge-libplugin'

const limitStyles = theme => ({
  p: {
    fontColor: theme.palette.primary.main,
    backgroundColor: '#d9e3ec',
    textAlign: 'center',
    padding: '10px 0',
    margin: '5px 0'
  }
})

const buttonStyle = {
  textTransform: 'none',
  padding: '15px 0',
  margin: '5px 0',
  borderRadius: '5px'
}

export const DailyLimit = withStyles(limitStyles)((props) => {
  const {dailyLimit, monthlyLimit, fiat} = props
  return (
    <Typography component="p" className={props.classes.p}>
      Daily Limit: {formatRate(dailyLimit, fiat)} /
      Monthly Limit: {formatRate(monthlyLimit, fiat)}
    </Typography>
  )
})

DailyLimit.propTypes = {
  classes: PropTypes.object,
  dailyLimit: PropTypes.number,
  monthlyLimit: PropTypes.number,
  fiat: PropTypes.string
}

export const EdgeButton = (props) => {
  return (
    <Button
      variant="raised"
      color={props.color || 'default'}
      onClick={props.onClick}
      disabled={props.disabled}
      style={{
        textTransform: 'none',
        padding: '15px 0',
        margin: '5px 0'
      }}
      fullWidth>
      {props.children}
    </Button>
  )
}

EdgeButton.propTypes = {
  color: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool
}

export const SupportLink = (props) => {
  return (<a href="mailto:support@simplex.com">support@simplex.com</a>)
}

const supportThemes = theme => ({
  p: {
    textAlign: 'center',
    padding: '0 0 20px 0'
  }
})

export const Support = withStyles(supportThemes)((props) => {
  return (
    <Typography component="p" className={props.classes.p}>
      For support, please contact <SupportLink />.
    </Typography>
  )
})

Support.propTypes = {
  classes: PropTypes.object
}

const powerThemes = (theme) => ({
  p: {
    backgroundColor: '#d9e3ec',
    fontColor: theme.palette.primary.main,
    textAlign: 'center',
    padding: '20px 0'
  }
})

export const PoweredBy = withStyles(powerThemes)((props) => {
  return (
    <Typography component="p" className={props.classes.p}>
      Powered by Simplex
    </Typography>
  )
})

PoweredBy.propTypes = {
  classes: PropTypes.object
}

const confirmStyles = (theme) => ({
  title: {
    textAlign: 'center',
    color: theme.palette.primary.main,
    fontSize: '18pt'
  },
  p: {
    textAlign: 'center'
  },
  progress: {
    textAlign: 'center'
  }
})

class ConfirmUnstyled extends Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: false
    }
  }

  onAccept = () => {
    this.setState({
      loading: true
    })
    this.props.onAccept()
  }

  render () {
    return (
      <Dialog open={this.props.open} onClose={this.props.onClose}>
        <DialogTitle id="alert-confirm-title" disableTypography>
          <Typography component="h2" className={this.props.classes.title}>
            {this.state.loading && 'Please Wait'}
            {!this.state.loading && 'Confirm Purchase Details'}
          </Typography>
        </DialogTitle>
        {this.state.loading && (
          <DialogContent>
            <DialogContentText id="alert-dialog-description" className={this.props.classes.p}>
              We are connecting to Simplex!
            </DialogContentText>
            <div className={this.props.classes.progress}>
              <CircularProgress />
            </div>
          </DialogContent>
        )}
        {!this.state.loading && (
          <DialogContent>
            <DialogContentText id="alert-dialog-description" className={this.props.classes.p}>
              { this.props.message() }
            </DialogContentText>
            <div>
              <EdgeButton color="primary" onClick={this.onAccept}>
                Yes, go to payment
              </EdgeButton>
              <EdgeButton color="default" onClick={this.props.onClose}>
                Cancel
              </EdgeButton>
            </div>
          </DialogContent>
        )}
      </Dialog>
    )
  }
}

ConfirmUnstyled.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired,
  classes: PropTypes.object,
  message: PropTypes.func.isRequired
}

export const ConfirmDialog = withStyles(confirmStyles)(ConfirmUnstyled)

export const WalletButton = (props) => {
  return (
    <Button
      variant="raised"
      onClick={props.onClick}
      disabled={props.disabled}
      style={{
        ...buttonStyle,
        backgroundColor: props.backgroundColor,
        color: props.textColor,
        margin: '0',
        borderRadius: '0',
        borderTop: '1px solid #d8d6d8'
      }}
      fullWidth>
      {props.children}
    </Button>
  )
}

WalletButton.propTypes = {
  textColor: PropTypes.string,
  backgroundColor: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool
}

export class WalletDrawer extends Component {
  renderWallet = (wallet) => {
    return (
      <WalletButton key={wallet.id} onClick={() => this.props.selectWallet(wallet)} backgroundColor='white'>
        {wallet.name} ({wallet.currencyCode})
      </WalletButton>
    )
  }
  renderWallets = () => {
    return this.props.wallets.map((wallet) =>
      this.renderWallet(wallet))
  }
  render () {
    return (
      <Drawer
        anchor="bottom"
        variant="temporary"
        open={this.props.open}
        onClose={this.props.onClose}>
        <div>
          <WalletButton color="primary" onClick={this.props.onHeaderClick} backgroundColor='white'>
            <span style={{ fontWeight: 'bold' }}>Choose Destination Wallet</span>
          </WalletButton>
          {this.renderWallets()}
        </div>
      </Drawer>
    )
  }
}

WalletDrawer.propTypes = {
  open: PropTypes.bool,
  selectWallet: PropTypes.func.isRequired,
  onHeaderClick: PropTypes.func,
  onClose: PropTypes.func,
  wallets: PropTypes.array
}

export const PaymentRow = (props) => {
  const payment = props.payment
  const status = formatStatus(payment.status)
  const fiatAmount = formatRate(
    payment.fiat_total_amount,
    payment.fiat_currency)
  const cryptoAmount = formatRate(
    payment.requested_digital_amount,
    payment.requested_digital_currency)
  const date = moment(payment.created_at)
  const onClick = () => {
    if (props.history) {
      props.history.push(`/events/${payment.payment_id}/`)
    }
  }
  return (
    <Grid container key={payment.payment_id} onClick={onClick}>
      <Grid item xs={6} scope="row">
        <Typography variant="body1">{date.format('LL')}</Typography>
        <Typography variant="caption">{date.format('LT')}</Typography>
      </Grid>
      <Grid item xs={3}>
        <Typography variant="caption">{fiatAmount} {payment.fiat_currency}</Typography>
        <Typography variant="caption">{cryptoAmount} {payment.requested_digital_currency}</Typography>
      </Grid>
      <Grid item xs={3}>{status}</Grid>
    </Grid>
  )
}

PaymentRow.propTypes = {
  payment: PropTypes.object,
  history: PropTypes.object
}

export const PaymentDetails = (props) => {
  const payment = props.payment
  const fiatAmount = formatRate(
    payment.fiat_total_amount,
    payment.fiat_currency)
  const cryptoAmount = formatRate(
    payment.requested_digital_amount,
    payment.requested_digital_currency)
  const date = moment(payment.created_at)
  return (
    <Grid container key={payment.payment_id}>
      <Grid item xs={12}>
        <Grid container className="header">
          <Grid item xs={6}><Typography>Payment Id</Typography></Grid>
          <Grid item xs={6}><Typography>{payment.payment_id}</Typography></Grid>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Grid container className="header">
          <Grid item xs={6}><Typography>Date</Typography></Grid>
          <Grid item xs={6}>
            <Typography variant="body1">{date.format('LL')} {date.format('LT')}</Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Grid container className="header">
          <Grid item xs={6}><Typography>Amount</Typography></Grid>
          <Grid item xs={6}>
            <Typography>
              {fiatAmount} {payment.fiat_currency} / {cryptoAmount} {payment.requested_digital_currency}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

PaymentDetails.propTypes = {
  payment: PropTypes.object
}

const pendingStyles = theme => ({
  info: {
    backgroundColor: '#fafafa',
    color: '#000',
    padding: '10px 20px',
    borderRadius: '2px',
    boxShadow: '1px 1px 1px 1px rgba(0, 0, 0, 0.25)'
  }
})

class PendingSellUnstyled extends Component {
  state = {
    pendingSpend: false
  }

  componentDidMount () {
    this.checkQueue()
  }

  _cancel = async () => {
    if (!this.state.pendingSpend) {
      throw new Error('Could not find spend info')
    }
    const msg = this.state.pendingSpend
    try {
      await API.userMessageStatus(msg.msg_id, 'failed', null, null)
    } catch (e) {
      ui.showAlert(false, 'Error', 'Unable to cancel transaction at this time.')
    }
    return this.checkQueue()
  }

  _sendFunds = async () => {
    if (!this.state.pendingSpend) {
      throw new Error('Could not find spend info')
    }
    const msg = this.state.pendingSpend
    const data = msg.msg
    const info = {
      currencyCode: data.crypto_currency,
      publicAddress: data.destination_crypto_address.trim(),
      nativeAmount: Math.round(data.amount * 100000000).toString()
    }
    if (!DEV) {
      try {
        const tx = await core.makeSpendRequest(info)
        if (tx) {
          await API.userMessageStatus(msg.msg_id, 'complete', data.amount, tx)
          await API.userMessageAck(msg.msg_id)
        } else {
          await API.userMessageAck(msg.msg_id)
        }
      } catch (e) {
        window.alert(e)
      }
    } else {
      console.log(info)
      console.log(`Send ${this.describeSpend()} to ${data.destination_crypto_address}`)
      await API.userMessageAck(msg.msg_id)
    }
    return this.checkQueue()
  }

  describeSpend = () => {
    const msg = this.state.pendingSpend
    const data = msg.msg
    return `${data.amount} ${data.crypto_currency}`
  }

  async checkQueue () {
    try {
      const data = await API.userSellMessages()
      const res = await data.json()
      for (let i = 0; i < res.res.length; ++i) {
        const m = res.res[i]
        if (m.msg_type === 'send-crypto') {
          this.setState({
            pendingSpend: m
          })
          return
        }
      }
      // No pending spends...empty out state
      this.setState({
        pendingSpend: null
      })
    } catch (e) {
      this.setState({
        pendingSpend: null
      })
    }
  }

  render () {
    if (!this.state.pendingSpend) {
      return null
    }
    return (
      <div className={this.props.classes.info}>
        <p>
          Your request to sell <strong>{this.describeSpend()}</strong> has been approved! You can send the funds now.
        </p>
        <EdgeButton color="primary" onClick={this._sendFunds}>Send Funds</EdgeButton>
        <EdgeButton color="secondary" onClick={this._cancel}>Cancel</EdgeButton>
      </div>
    )
  }
}

PendingSellUnstyled.propTypes = {
  classes: PropTypes.object
}

export const PendingSell = withStyles(pendingStyles)(PendingSellUnstyled)
