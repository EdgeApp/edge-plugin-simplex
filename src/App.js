// @flow
import React, { Component } from 'react'
import { Route, HashRouter as Router } from 'react-router-dom'
import { createMuiTheme, withStyles } from 'material-ui/styles'

import BuyScene from './BuyScene'
import EventsScene from './EventsScene'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { PendingSellFromURL } from './components'
import SellScene from './SellScene'
import StartScene from './StartScene'
import TransactionsScene from './TransactionsScene'

const theme = createMuiTheme({
  palette: {
    primary: {
      light: '#4876a4',
      main: '#0e4b75',
      dark: '#002449',
      contrastText: '#fff'
    }
  },
  typography: {
    fontFamily: "'Source Sans Pro', sans-serif !important"
  },
  shadows: Array(25).fill('none')
})

export const routes = [
  {
    path: '/',
    main: StartScene,
    exact: true
  },
  {
    path: '/buy/',
    main: BuyScene,
    exact: true
  },
  {
    path: '/sell/',
    main: SellScene,
    exact: true
  },
  {
    path: '/sell/execution-orders/:executionOrderId',
    main: PendingSellFromURL,
    exact: true
  },
  {
    path: '/transactions/',
    main: TransactionsScene,
    exact: true
  },
  {
    path: '/:type/events/:transactionId/',
    main: EventsScene,
    exact: true
  }
]

const appStyles = theme => ({
  content: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  }
})

type Props = {
  classes: Object
}
type State = {}

class App extends Component<Props, State> {
  render () {
    return (
      <MuiThemeProvider theme={theme}>
        <Router>
          <div className={this.props.classes.content}>
            {routes.map((route, index) => (
              <Route key={index} path={route.path} exact={route.exact} component={route.main} />
            ))}
          </div>
        </Router>
      </MuiThemeProvider>
    )
  }
}

export default withStyles(appStyles)(App)
