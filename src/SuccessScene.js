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

  async componentDidMount () {
    if (window && window.edgeProvider && window.edgeProvider.trackConversion) {
      /*
      const type EdgeTrackConversionOptions = {
        // Currency code of the conversion amount
        // I.e., "btc" or "iso:USD"
        currencyCode: string,

        // Amount of the conversion
        amount: number,

        // Unique orderID
        orderId: string
      }
       */
      // let searchStr = window.location.search
      // searchStr = searchStr.replace('?', '')
      // const keyValuePairs = searchStr.split('&')
      //
      const edgeTrackConversionOptions = {
        currencyCode: 'USD',
        amount: 12,
        orderId: '1111111111'
      };
      await window.edgeProvider.trackConversion(edgeTrackConversionOptions)
    }
  }

  render () {
    const classes = this.props.classes
    return (
      <div className={classes.container}>
        <h1>BUY SUCCEEDED</h1>
      </div>
    )
  }
}

export default withStyles(startStyles)(SuccessScene)
