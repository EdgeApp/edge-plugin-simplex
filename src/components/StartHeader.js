// @flow
import React from 'react'
import Typography from 'material-ui/Typography'

type Props = {
  classes: Object,
  text: string
}

const StartHeader = (props: Props) => {
  return (
    <Typography variant="headline" component="h3" className={props.classes.h3}>
      {props.text}
    </Typography>
  )
}

export { StartHeader }
