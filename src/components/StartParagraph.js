// @flow
import React from 'react'
import Typography from 'material-ui/Typography'

type Props = {
  classes: Object,
  children: any
}
const StartParagraph = (props: Props) => {
  return (
    <Typography component="p" className={props.classes.p}>
      {props.children}
    </Typography>
  )
}

export { StartParagraph }
