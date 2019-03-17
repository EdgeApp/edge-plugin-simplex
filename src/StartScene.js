import PropTypes from 'prop-types'
import React from 'react'
import { withStyles } from 'material-ui/styles'
import Divider from 'material-ui/Divider'
import Typography from 'material-ui/Typography'
import Grid from 'material-ui/Grid'
import { ui } from 'edge-libplugin'
import * as API from './api'

import './inline.css'

import { EdgeButton, SupportLink, PendingSell } from './components'

const startStyles = (theme) => ({
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

const StartHeader = (props) => {
  return (
    <Typography variant="headline" component="h3" className={props.classes.h3}>
      {props.text}
    </Typography>
  )
}

StartHeader.propTypes = {
  classes: PropTypes.object,
  text: PropTypes.string
}

const StartParagraph = (props) => {
  return (
    <Typography component="p" className={props.classes.p}>
      {props.children}
    </Typography>
  )
}

StartParagraph.propTypes = {
  classes: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired
}

class StartScene extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      executionOrder: null
    }
  }
  UNSAFE_componentWillMount () {
    ui.title('Buy with Simplex')
    window.scrollTo(0, 0)
    window.localStorage.removeItem('last_crypto_amount')
    window.localStorage.removeItem('last_fiat_amount')
  }
  componentDidMount () {
    this._fetchPendingExecutionOrders()
  }
  async _fetchPendingExecutionOrders () {
    const data = await API.getPendingExecutionOrders()
    const pendingExecutionOrders = await data.json()
    if (pendingExecutionOrders) {
      this.setState({executionOrder: pendingExecutionOrders.res[0]})
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
    const classes = this.props.classes
    return (
      <div className={classes.container}>
        <div className="text-center">
          <div className="iconLogo" />
        </div>
        {this.state.executionOrder && <PendingSell executionOrder={this.state.executionOrder}/>}
        <div>
          <StartHeader text="Simplex" classes={classes} />
          <StartParagraph classes={classes}>
            Simplex is an Edge Wallet bank and card processing partner. It is
            the service which allows you to purchase Bitcoin, Bitcoin Cash,
            Ethereum, Litecoin and Ripple/XRP and sell Bitcoin, Bitcoin Cash
            and Litecoin. You can do this safely and quickly in just a few
            short minutes.
          </StartParagraph>
        </div>
        <Divider className={classes.divider} />
        <div>
          <StartHeader text="Fee" classes={classes} />
          <StartParagraph classes={classes}>
            Please note that additional fees will be charged, on top of the
            above rate at checkout. Those fees are as follows:
          </StartParagraph>
          <ul className={classes.feeList}>
            <li>Edge Wallet 1%</li>
            <li>Credit Card processing by Simplex 5% ($10 min)</li>
          </ul>
        </div>
        <Divider className={classes.divider} />
        <div>
          <StartHeader text="Time" classes={classes} />
          <StartParagraph classes={classes}>
            Estimated transaction time is about 10-30min.
          </StartParagraph>
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
              <EdgeButton color="primary" onClick={this._buy}>Buy Crypto</EdgeButton>
            </Grid>
            <Grid item xs>
              <EdgeButton color="secondary" onClick={this._sell}>Sell Crypto</EdgeButton>
            </Grid>
          </Grid>
          <EdgeButton color="default" onClick={this._gotoEvents}>Transactions</EdgeButton>
        </div>
      </div>
    )
  }
}

StartScene.propTypes = {
  history: PropTypes.object,
  classes: PropTypes.object
}

export default withStyles(startStyles)(StartScene)
