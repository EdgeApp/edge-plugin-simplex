// @flow
import './inline.css'

import * as API from './api'

import Card, { CardContent } from 'material-ui/Card'
import { PaymentDetails, PoweredBy, Support } from './components'
import React, {Component} from 'react'

import { CircularProgress } from 'material-ui/Progress'
import Grid from 'material-ui/Grid'
import Typography from 'material-ui/Typography'
import { formatStatus } from './utils'
import moment from 'moment'
import { withStyles } from 'material-ui/styles'

const eventStyles = theme => ({
  eventScene: {
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

type Props = {
  classes: Object,
  match: Object
}
type State = {
  details: Object,
  loaded: boolean,
  error: string | null
}
class EventsScene extends Component<Props, State> {
  constructor (props) {
    super(props)
    this.state = {
      details: {},
      loaded: false,
      error: null
    }
  }

  UNSAFE_componentWillMount () {
    window.scrollTo(0, 0)
    this.loadEvents()
  }

  loadEvents = () => {
    const { transactionId, type } = this.props.match.params
    const fetchFunction = type === 'sell' ? API.sellDetails : API.paymentDetails
    fetchFunction(transactionId)
      .then(d => d.json())
      .then(data => {
        this.setState({
          details: data.res,
          loaded: true
        })
      })
      .catch(() => {
        this.setState({
          loaded: true,
          error: 'Unable to load payment events at this time.'
        })
        // Unable to load events at this time...
      })
  }

  _renderEvent = event => {
    const status = formatStatus(event.status)
    const date = moment(event.created_at)
    return (
      <Grid container key={event.id}>
        <Grid item xs={6} scope="row">
          <Typography variant="body1">{date.format('LL')}</Typography>
          <Typography variant="caption">{date.format('LT')}</Typography>
        </Grid>
        <Grid item xs={3}>
          {status}
        </Grid>
      </Grid>
    )
  }

  _renderEvents = () => {
    return (
      <Grid container>
        <Grid item xs={12}>
          <PaymentDetails transaction={this.state.details} />
        </Grid>
        <Grid item xs={12}>
          <Grid container className="header">
            <Grid item xs={6}>
              <Typography>Date</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography>Status</Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} className="body">
          {this.state.details &&
            this.state.details.events &&
            this.state.details.events.map(event => {
              return this._renderEvent(event)
            })}
        </Grid>
      </Grid>
    )
  }

  _renderEmpty = () => {
    let block = <CircularProgress size={25} />
    if (this.state.loaded) {
      if (this.state.error) {
        block = <div>{this.state.error}</div>
      } else {
        block = <div>No transactions yet!</div>
      }
    }
    return <div className="d-flex flex-fill empty">{block}</div>
  }

  render () {
    const body = this.state.details && this.state.details.events && this.state.details.events.length > 0 ? this._renderEvents() : this._renderEmpty()
    return (
      <div className={this.props.classes.eventScene}>
        <div className="flex-fill d-flex">
          <Card className={this.props.classes.card}>
            <CardContent className="d-flex flex-fill">{body}</CardContent>
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

export default withStyles(eventStyles)(EventsScene)
