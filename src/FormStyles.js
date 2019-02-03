
export const styles = theme => ({
  card: {
    margin: '20px 0px',
    padding: '0px 10px'
  },
  h3: {
    color: theme.palette.primary.main,
    padding: 0,
    margin: '10px 0',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  warning: {
    color: theme.palette.primary.error,
    padding: 10,
    margin: '10px 0',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  conversion: {
    fontSize: '20pt',
    color: theme.palette.primary.main
  },
  p: {
    color: '#999',
    paddingBottom: '10px',
    textAlign: 'center'
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#000',
    padding: '10px 20px'
  }
})

export default styles
