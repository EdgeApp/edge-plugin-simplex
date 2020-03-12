// @flow
import './inline.css'

import * as API from './api'

import { PendingSell, SupportLink } from './components.js'
import React, { Component } from 'react'

import Divider from 'material-ui/Divider'
import { EdgeButton } from './components/EdgeButton'
import Grid from 'material-ui/Grid'
import { StartHeader } from './components/StartHeader'
import { StartParagraph } from './components/StartParagraph'
import { withStyles } from 'material-ui/styles'

const startStyles = theme => ({
  container: {
    backgroundColor: '#FFF',
    padding: '20px'
  },
  h3: {
    color: theme.palette.primary.main,
    fontSize: '17pt',
    padding: '5px 0'
  },
  p: {
    fontSize: '14pt'
  },
  divider: {
    margin: '15px 0',
    height: '2px'
  },
  feeList: {
    listStyleType: '-'
  }
})

type Props = {
  classes: Object,
  history: Object
}
type State = {
  executionOrder: Object | null
}

class StartScene extends Component<Props, State> {
  constructor (props) {
    super(props)
    this.state = {
      executionOrder: null
    }
  }
  UNSAFE_componentWillMount () {
    window.scrollTo(0, 0)
    window.localStorage.removeItem('last_crypto_amount')
    window.localStorage.removeItem('last_fiat_amount')
  }
  componentDidMount () {
    setTimeout(this.fetchPendingExecutionOrders, 1500)
  }
  fetchPendingExecutionOrders = async () => {
    const data = await API.getPendingExecutionOrders()
    const pendingExecutionOrders = await data.json()
    if (pendingExecutionOrders) {
      this.setState({ executionOrder: pendingExecutionOrders.res[0] })
    }
  }
  _buy = () => {
    this.props.history.push('/buy/')
  }
  _sell = () => {
    this.props.history.push('/sell/')
  }
  _gotoEvents = () => {
    this.props.history.push('/transactions/')
  }

  render () {
    console.log('simplex window.edgeProvider.simplexPluginQuote:', window.edgeProvider.simplexPluginQuote)
    const classes = this.props.classes
    return (
      <div className={classes.container}>
        <div className="text-center">
          <div className="iconLogo" />
        </div>
        {this.state.executionOrder && <PendingSell executionOrder={this.state.executionOrder} />}
        <div>
          <StartHeader text="Simplex" classes={classes} />
          <StartParagraph classes={classes}>
            Simplex is an Edge Wallet bank and card processing partner. It is the service which allows you to purchase Bitcoin, Bitcoin Cash, Ethereum, Litecoin
            and Ripple/XRP and sell Bitcoin, Bitcoin Cash and Litecoin. You can do this safely and quickly in just a few short minutes.
          </StartParagraph>
        </div>
        <Divider className={classes.divider} />
        <div>
          <StartHeader text="Time" classes={classes} />
          <StartParagraph classes={classes}>Estimated transaction time is 30 minutes to 5 business days.</StartParagraph>
        </div>
        <Divider className={classes.divider} />
        <div>
          <StartHeader text="Support" classes={classes} />
          <StartParagraph classes={classes}>
            For support, please contact <SupportLink />.
          </StartParagraph>
        </div>
        <Divider className={classes.divider} />
        <div>
          <Grid container spacing={24}>
            <Grid item xs>
              <EdgeButton color="primary" onClick={this._buy}>
                Buy Crypto
              </EdgeButton>
            </Grid>
            <Grid item xs>
              <EdgeButton color="secondary" onClick={this._sell}>
                Sell Crypto
              </EdgeButton>
            </Grid>
          </Grid>
          <EdgeButton color="default" onClick={this._gotoEvents}>
            Transactions
          </EdgeButton>
        </div>
      </div>
    )
  }
}

export default withStyles(startStyles)(StartScene)
