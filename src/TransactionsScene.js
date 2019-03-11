import PropTypes from 'prop-types'
import React from 'react'
import { withStyles } from 'material-ui/styles'
import Typography from 'material-ui/Typography'
import Card, { CardContent } from 'material-ui/Card'
import AppBar from 'material-ui/AppBar'
import Tabs from 'material-ui/Tabs/Tabs'
import Tab from 'material-ui/Tabs/Tab'
import Grid from 'material-ui/Grid'
import { CircularProgress } from 'material-ui/Progress'
import { ui } from 'edge-libplugin'

import * as API from './api'
import {
  TransactionRow,
  Support,
  PoweredBy
} from './components'

import './inline.css'

const eventStyles = (theme) => ({
  paymentScene: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1
  },
  h3: {
    color: theme.palette.primary.main,
    fontSize: '17pt',
    padding: '5px 0',
    textAlign: 'center'

  },
  card: {
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'scroll'
  }
})

class TransactionsScene extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      currentTab: 0,
      transactions: [],
      loaded: false
    }
  }

  componentWillMount () {
    window.scrollTo(0, 0)
    ui.title('Transactions')
    this.loadTransactions(this.getTransactionType(this.state.currentTab))
  }

  loadTransactions = async (transactionType) => {
    if (transactionType === 'sell') {
      const sells = await API.sells()
      const sellData = await sells.json()
      this.setState({
        transactions: sellData.res || [],
        loaded: true
      })
    } else {
      API.payments()
        .then(d => d.json())
        .then((data) => {
          this.setState({
            transactions: data.res || [],
            loaded: true
          })
        })
        .catch(() => {
          // Unable to load payments at this time...
        })
    }
  }

  _renderTransaction = (transaction) => {
    return (<TransactionRow
      history={this.props.history}
      transaction={transaction}
      transactionType={this.getTransactionType(this.state.currentTab)}
      key={transaction.id} />)
  }

  _renderTransactions = () => {
    return (
      <Grid container>
        <Grid item xs={12}>
          <Grid container className="header">
            <Grid item xs={5}><Typography>Created</Typography></Grid>
            <Grid item xs={4}><Typography>Amount</Typography></Grid>
            <Grid item xs={3}><Typography>Status</Typography></Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} className="body">
          {this.state.transactions.map(transaction => {
            return this._renderTransaction(transaction)
          })}
        </Grid>
      </Grid>
    )
  }

  _renderEmpty = () => {
    return (
      <div className="d-flex flex-fill empty">
        {this.state.loaded && (
          <div>No transactions yet!</div>
        )}
        {!this.state.loaded && (
          <CircularProgress size={25} />
        )}
      </div>
    )
  }
  getTransactionType = currentTab => {
    const tabs = ['buy', 'sell']
    return tabs[currentTab]
  }
  _changeScreen = (event, currentTab) => {
    const transactionType = this.getTransactionType(currentTab)
    this.setState({currentTab})
    this.loadTransactions(transactionType)
  }

  render () {
    const body = this.state.transactions.length > 0
      ? this._renderTransactions()
      : this._renderEmpty()
    return (
      <div className={this.props.classes.paymentScene}>
        <AppBar position="static">
          <Tabs centered fullWidth indicatorColor={'white'} onChange={this._changeScreen} value={this.state.currentTab} >
            <Tab label={'Buy Crypto'}/>
            <Tab label={'Sell Crypto'}/>
          </Tabs>
        </AppBar>

        <div className="flex-fill d-flex">
          <Card className={this.props.classes.card}>
            <CardContent className="d-flex flex-fill">
              { body }
            </CardContent>
          </Card>
        </div>

        <div className="flex-shrink">
          <Support />
          <PoweredBy />
        </div>
      </div>
    )
  }
}

TransactionsScene.propTypes = {
  classes: PropTypes.object,
  history: PropTypes.object
}

export default withStyles(eventStyles)(TransactionsScene)
