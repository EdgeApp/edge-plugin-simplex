// @flow
import * as API from '../api'

import React, {Component} from 'react'

import { EdgeButton } from './EdgeButton'
import { PendingSell } from './PendingSell'
import { describeSpend } from '../utils'
import { withStyles } from 'material-ui/styles'

type Props = {
  match: Object,
  classes: Object,
  history: Object
}
type State = {
  executionOrder: Object | null
}
export class PendingSellFromURLUnStyled extends Component<Props, State> {
  constructor (props: Props) {
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
      this.setState({ executionOrder: pendingExecutionOrder.res })
    }
  }

  _home = () => {
    this.props.history.push('/')
  }

  render () {
    return (
      <div className={this.props.classes.container}>
        {this.state.executionOrder && (
          <div>
            <h3 className={this.props.classes.header}>
              {' '}
              Selling <strong>{describeSpend(this.state.executionOrder)}</strong> to Credit Card
            </h3>
            <PendingSell history={this.props.history} executionOrder={this.state.executionOrder} />
          </div>
        )}
        <EdgeButton onClick={this._home}>Back to Wallet</EdgeButton>
      </div>
    )
  }
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
