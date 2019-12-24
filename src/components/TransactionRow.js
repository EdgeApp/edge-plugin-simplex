// @flow
import { formatAmount, formatStatus } from '../utils'

import Grid from 'material-ui/Grid'
import React from 'react'
import Typography from 'material-ui/Typography'
import moment from 'moment'

type Props = {
  transaction: Object,
  transactionType: string,
  history: Object

}
const TransactionRow = (props: Props) => {
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
      <Grid item xs={3}>
        {status}
      </Grid>
    </Grid>
  )
}

export { TransactionRow }
