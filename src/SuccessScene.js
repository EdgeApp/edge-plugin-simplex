// @flow
import './inline.css'

import React, { Component } from 'react'

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
}

class SuccessScene extends Component<Props, State> {
  render () {
    const classes = this.props.classes
    return (
      <div className={classes.container}>
        <h1>BUY SUCCESS</h1>
      </div>
    )
  }
}

export default withStyles(startStyles)(SuccessScene)
