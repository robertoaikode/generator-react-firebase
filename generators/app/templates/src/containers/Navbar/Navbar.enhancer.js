import { connect } from 'react-redux'
<% if (!materialv1) { %>import { withHandlers, compose, withProps, flattenProp } from 'recompose'<% } %><% if (materialv1) { %>import {
  withHandlers,
  compose,
  withProps,
  flattenProp,
  withStateHandlers
} from 'recompose'<% } %>
import { withFirebase, isEmpty, isLoaded } from 'react-redux-firebase'
import { ACCOUNT_PATH } from 'constants'
import { withRouter, spinnerWhileLoading } from 'utils/components'

export default compose(
  connect(({ firebase: { auth, profile } }) => ({
    auth,
    profile
  })),
  // Wait for auth to be loaded before going further
  spinnerWhileLoading(['profile']),<% if (materialv1) { %>
  withStateHandlers(
    ({ accountMenuOpenInitially = false }) => ({
      accountMenuOpen: accountMenuOpenInitially,
      anchorEl: null
    }),
    {
      closeAccountMenu: ({ accountMenuOpen }) => () => ({
        anchorEl: null
      }),
      handleMenu: () => event => ({
        anchorEl: event.target
      })
    }
  ),<% } %>
  // Add props.router (used in handlers)
  withRouter,
  // Add props.firebase (used in handlers)
  withFirebase,
  // Handlers
  withHandlers({
    handleLogout: props => () => {
      props.firebase.logout()
      props.router.push('/')<% if (materialv1) { %>
      props.closeAccountMenu()<% } %>
    },
    goToAccount: props => () => {
      props.router.push(ACCOUNT_PATH)<% if (materialv1) { %>
      props.closeAccountMenu()<% } %>
    }
  }),
  withProps(({ auth, profile }) => ({
    authExists: isLoaded(auth) && !isEmpty(auth)
  })),
  // Flatten profile so that avatarUrl and displayName are available
  flattenProp('profile')
)
