// @flow
import * as API from '../api'

import React, {Component} from 'react'

import { CircularProgress } from 'material-ui/Progress'
import { ConfirmDialog } from './ConfirmDialog'
import { EdgeButton } from './EdgeButton'
import { describeSpend } from '../utils'
import { withStyles } from 'material-ui/styles'

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
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#000',
    padding: '3px 6px'
  }
})

type Props = {
  classes: Object,
  history: Object,
  executionOrder: Object
}
type State = {
  executionOrder: Object,
  displayConfirmDialog: boolean,
  pending: boolean,
  error: string | null
}
class PendingSellUnstyled extends Component<Props, State> {
  constructor (props) {
    super(props)
    this.state = {
      executionOrder: this.props.executionOrder,
      displayConfirmDialog: false,
      pending: false,
      error: null
    }
  }
  _cancel = async () => {
    if (!this.state.executionOrder) {
      throw new Error('Could not find spend info')
    }
    try {
      await API.executionOrderNotifyStatus(this.state.executionOrder, 'cancelled')
    } catch (e) {
      this.setState({
        error: 'Unable to cancel transaction at this time.'
      })
    }
    this._refreshExecutionOrder(this.state.executionOrder.id)
    this._closeDialog()
  }
  async _refreshExecutionOrder (executionOrderId) {
    const data = await API.getExecutionOrder(executionOrderId)
    const pendingExecutionOrder = await data.json()
    if (pendingExecutionOrder) {
      this.setState({ executionOrder: pendingExecutionOrder.res })
    }
  }
  _closeDialog = () => {
    this.setState({ displayConfirmDialog: false })
  }
  _showDialog = () => {
    this.setState({ displayConfirmDialog: true })
  }
  _sendNotify = async (executionOrder, status, amount, txnId) => {
    this.setState({ pending: true })
    await API.executionOrderNotifyStatus(executionOrder, status, amount, txnId)
    await this._refreshExecutionOrder(this.state.executionOrder.id)
    this.setState({ pending: false })
  }
  sendFundsWrapper = () => {
    this._sendFunds()
  }
  _sendFunds = async () => {
    const executionOrder = this.state.executionOrder
    if (!executionOrder) {
      throw new Error('Could not find sendCrypto info')
    }
    const info = {
      currencyCode: executionOrder.requested_digital_currency,
      publicAddress: executionOrder.destination_crypto_address.trim(),
      nativeAmount: Math.round(executionOrder.requested_digital_amount * 100).toString() // simplex amount in MicroBit
    }

    // const edgeTransaction = await window.edgeProvider.requestSpend([info], { metadata })

    let edgeTransaction
    await window.edgeProvider.chooseCurrencyWallet([info.currencyCode])
    const wallet = await window.edgeProvider.getCurrentWalletInfo()
    const metadata = {
      name: 'Simplex',
      category: 'Exchange:Sell ' + info.currencyCode,
      notes: 'Sell ' + info.currencyCode + ' from ' + wallet.name + ' to Simplex at address: ' + executionOrder.destination_crypto_address.trim() + '. Sell amount ' + executionOrder.fiat_amount + '. For assistance, please contact support@simplex.com.'
    }
    try {
      edgeTransaction = await window.edgeProvider.requestSpend([info], { metadata })
    } catch (e) {
      await this._sendNotify(executionOrder, 'failed')
      return
    }
    await this._sendNotify(executionOrder, 'completed', executionOrder.requested_digital_amount, edgeTransaction.txid)
  }

  renderError = () => {
    if (this.state.error) {
      return <div className={this.props.classes.error}>
        <p>{this.state.error}</p>
      </div>
    }
    return null
  }
  render () {
    const getBody = () => {
      switch (executionOrder.status) {
        case 'completed':
          return (
            <p>
              {' '}
              Your crypto was sent to broker, please wait until transaction will be confirmed by blockchain. You will receive an email with update from Simplex.
            </p>
          )
        case 'cancelled':
          return <p>Transaction was cancelled.</p>
        case 'failed':
          return <p>Transaction Failed</p>
        default:
          return (
            <div>
              <p>
                Your details were verified and you can proceed In order to sell your crypto, please approve sending{' '}
                <strong>{describeSpend(this.state.executionOrder)}</strong> to the broker.
              </p>
              <div>
                <EdgeButton color="primary" onClick={this.sendFundsWrapper}>
                  Approve
                </EdgeButton>
                <EdgeButton color="secondary" onClick={this._showDialog}>
                  Cancel Transaction
                </EdgeButton>
              </div>
            </div>
          )
      }
    }
    const executionOrder = this.state.executionOrder
    if (executionOrder) {
      const body = this.state.pending ? (
        <div className={this.props.classes.progress}>
          <CircularProgress />
        </div>
      ) : (
        getBody()
      )
      return (
        <div className={this.props.classes.info}>
          {this.state.displayConfirmDialog && (
            <ConfirmDialog
              message={() => 'Are you sure? This will cancel transaction and you will need to start over again if you still want to sell your crypto.'}
              open={true}
              acceptMsg={'No, let me think a little'}
              rejectMsg={'Yes, I’m sure'}
              header={'Cancel Transaction'}
              pendingMsg={'Cancelling...'}
              onClose={this._cancel}
              onAccept={this._closeDialog}
            />
          )}
          {this.renderError()}
          {body}
        </div>
      )
    } else {
      return null
    }
  }
}

export const PendingSell = withStyles(pendingStyles)(PendingSellUnstyled)
