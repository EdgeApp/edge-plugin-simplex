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
import { DEV, formatRate, formatStatus, formatAmount, describeSpend } from './utils'
import moment from 'moment'

import * as API from './api'
import { ui } from 'edge-libplugin'

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
    padding: '10px 0'
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
  container: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#d9e3ec'
  },
  logo: {
    height: '30px',
    padding: 0,
    margin: 0
  },
  p: {
    fontColor: theme.palette.primary.main,
    textAlign: 'center',
    padding: '20px 0',
    marginLeft: '10%'
  }
})

export const PoweredBy = withStyles(powerThemes)((props) => {
  return (
    <div className={props.classes.container}>
      <div className={`iconLogo ${props.classes.logo}`} />
      <Typography component="p" className={props.classes.p}>
        Powered by Simplex
      </Typography>
    </div>

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
            {!this.state.loading && this.props.header}
          </Typography>
        </DialogTitle>
        {this.state.loading && (
          <DialogContent>
            <DialogContentText id="alert-dialog-description" className={this.props.classes.p}>
              {this.props.pendingMsg}
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
                {this.props.acceptMsg}
              </EdgeButton>
              <EdgeButton color="default" onClick={this.props.onClose}>
                {this.props.rejectMsg}
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
  message: PropTypes.func.isRequired,
  header: PropTypes.string.isRequired,
  pendingMsg: PropTypes.string.isRequired,
  rejectMsg: PropTypes.string.isRequired,
  acceptMsg: PropTypes.string.isRequired
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
            <span style={{ fontWeight: 'bold' }}>{this.props.chooseWalletText}</span>
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
  chooseWalletText: PropTypes.string,
  wallets: PropTypes.array
}

export const TransactionRow = (props) => {
  const transaction = props.transaction
  const status = formatStatus(transaction.status)
  const fiatAmount = transaction.fiat_total_amount
  const fiatCurrency = transaction.fiat_currency
  const cryptoAmount = transaction.requested_digital_amount
  const cryptoCurrency = transaction.requested_digital_currency
  let transactionId
  if (props.transactionType === 'sell') {
    transactionId = transaction.id
  } else {
    transactionId = transaction.payment_id
  }

  const transactionFiat = formatAmount(fiatAmount, fiatCurrency)
  const transactionCrypto = formatAmount(cryptoAmount, cryptoCurrency)
  const date = moment(transaction.created_at)
  const onClick = () => {
    if (props.history) {
      props.history.push(`/${props.transactionType}/events/${transactionId}/`)
    }
  }
  return (
    <Grid container key={transaction.id} onClick={onClick}>
      <Grid item xs={5} scope="row">
        <Typography variant="body1">{date.format('LL')}</Typography>
        <Typography variant="caption">{date.format('LT')}</Typography>
      </Grid>
      <Grid item xs={4}>
        <Typography variant="caption">{transactionFiat}</Typography>
        <Typography variant="caption">{transactionCrypto}</Typography>
      </Grid>
      <Grid item xs={3}>{status}</Grid>
    </Grid>
  )
}

TransactionRow.propTypes = {
  transaction: PropTypes.object,
  transactionType: PropTypes.string,
  history: PropTypes.object
}

export const PaymentDetails = (props) => {
  const transaction = props.transaction
  const fiatAmount = formatRate(
    transaction.fiat_total_amount,
    transaction.fiat_currency)
  const cryptoAmount = formatRate(
    transaction.requested_digital_amount,
    transaction.requested_digital_currency)
  const date = moment(transaction.created_at)
  return (
    <Grid container key={transaction.id}>
      <Grid item xs={12}>
        <Grid container className="header">
          <Grid item xs={6}><Typography>Id</Typography></Grid>
          <Grid item xs={6}><Typography>
            {transaction.url
              ? (<span>
                <a href={transaction.url}>
                  {transaction.id}
                </a>
                <small>
                  {` (click to view)`}
                </small>
              </span>)
              : (<span>{transaction.id}</span>)}
          </Typography></Grid>
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
              {formatAmount(fiatAmount, transaction.fiat_currency)} / {formatAmount(cryptoAmount, transaction.requested_digital_currency)}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

PaymentDetails.propTypes = {
  transaction: PropTypes.object
}

const pendingStyles = theme => ({
  progress: {
    textAlign: 'center'
  },
  info: {
    backgroundColor: '#fafafa',
    color: '#000',
    padding: '10px 20px',
    marginBottom: '20px',
    borderRadius: '2px',
    boxShadow: '1px 1px 1px 1px rgba(0, 0, 0, 0.25)',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column'
  }
})

class PendingSellUnstyled extends Component {
  constructor (props) {
    super(props)
    this.state = {
      executionOrder: this.props.executionOrder,
      displayConfirmDialog: false,
      pending: false
    }
  }
  _cancel = async () => {
    if (!this.state.executionOrder) {
      throw new Error('Could not find spend info')
    }
    try {
      await API.executionOrderNotifyStatus(this.state.executionOrder, 'cancelled')
    } catch (e) {
      ui.showAlert(false, 'Error', 'Unable to cancel transaction at this time.')
    }
    this._refreshExecutionOrder(this.state.executionOrder.id)
    this._closeDialog()
  }
  async _refreshExecutionOrder (executionOrderId) {
    const data = await API.getExecutionOrder(executionOrderId)
    const pendingExecutionOrder = await data.json()
    if (pendingExecutionOrder) {
      this.setState({executionOrder: pendingExecutionOrder.res})
    }
  }
  _closeDialog = () => {
    this.setState({displayConfirmDialog: false})
  }
  _showDialog = () => {
    this.setState({displayConfirmDialog: true})
  }
  _sendFunds = async () => {
    this.setState({pending: true})
    const executionOrder = this.state.executionOrder
    if (!executionOrder) {
      throw new Error('Could not find sendCrypto info')
    }
    const info = {
      currencyCode: executionOrder.requested_digital_currency,
      publicAddress: executionOrder.destination_crypto_address.trim(),
      nativeAmount: Math.round(executionOrder.requested_digital_amount * 100).toString() // simplex amount in MicroBit
    }

    let edgeTransaction
    try {
      if (!DEV) {
        edgeTransaction = await window.edgeProvider.requestSpend([info])
      } else {
        edgeTransaction = {txid: 'blockchain_txn_hash'}
        console.log(info)
      }
      await API.executionOrderNotifyStatus(executionOrder, 'completed', info.nativeAmount, edgeTransaction.txid)
    } catch (e) {
      await API.executionOrderNotifyStatus(executionOrder, 'failed')
    }
    await this._refreshExecutionOrder(this.state.executionOrder.id)
    this.setState({pending: false})
  }

  render () {
    const getBody = () => {
      switch (executionOrder.status) {
        case 'completed': return (
          <p> Your crypto was sent to broker, please wait until transaction will be confirmed by blockchain.
            You will receive an email with update from Simplex.</p>
        )
        case 'cancelled': return (
          <p>Transaction was cancelled.</p>
        )
        case 'failed': return (<p>Transaction Failed</p>)
        default: return (<div>
          <p>
            Your details were verified and you can proceed In order to sell your crypto, please approve sending <strong>{describeSpend(this.state.executionOrder)}</strong> to the broker.
          </p>
          <div>
            <EdgeButton color="primary" onClick={this._sendFunds}>Approve</EdgeButton>
            <EdgeButton color="secondary" onClick={this._showDialog}>Cancel Transaction</EdgeButton>
          </div>
        </div>)
      }
    }
    const executionOrder = this.state.executionOrder
    if (executionOrder) {
      const body = this.state.pending
        ? (
          <div className={this.props.classes.progress}>
            <CircularProgress />
          </div>
        )
        : getBody()
      return (<div className={this.props.classes.info}>
        {this.state.displayConfirmDialog && <ConfirmDialog
          message={() => 'Are you sure? This will cancel transaction and you will need to start over again if you still want to sell your crypto.'}
          open={true}
          acceptMsg={'No, let me think a little'}
          rejectMsg={'Yes, I’m sure'}
          header={'Cancel Transaction'}
          pendingMsg={'Cancelling...'}
          onClose={this._cancel}
          onAccept={this._closeDialog}
        />}
        {body}
      </div>)
    } else {
      return null
    }
  }
}

PendingSellUnstyled.propTypes = {
  classes: PropTypes.object,
  history: PropTypes.object,
  executionOrder: PropTypes.object
}

export const PendingSell = withStyles(pendingStyles)(PendingSellUnstyled)

export class PendingSellFromURLUnStyled extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      executionOrder: null
    }
  }
  componentDidMount () {
    this._fetchExecutionOrder()
  }
  async _fetchExecutionOrder () {
    const data = await API.getExecutionOrder(this.props.match.params.executionOrderId)
    const pendingExecutionOrder = await data.json()
    if (pendingExecutionOrder) {
      this.setState({executionOrder: pendingExecutionOrder.res})
    }
  }

  _home = () => {
    this.props.history.push('/')
  }

  render () {
    return (<div className={this.props.classes.container}>
      {this.state.executionOrder && <div>
        <h3 className={this.props.classes.header}> Selling <strong>{describeSpend(this.state.executionOrder)}</strong> to Credit Card</h3>
        <PendingSell history={this.props.history} executionOrder={this.state.executionOrder} />
      </div>}
      <EdgeButton onClick={this._home}>Back to Wallet</EdgeButton>

    </div>)
  }
}

PendingSellFromURLUnStyled.propTypes = {
  match: PropTypes.object,
  classes: PropTypes.object,
  history: PropTypes.object
}

const pendingUrlStyles = theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%'
  },
  header: {
    textAlign: 'center'
  }
})
export const PendingSellFromURL = withStyles(pendingUrlStyles)(PendingSellFromURLUnStyled)
