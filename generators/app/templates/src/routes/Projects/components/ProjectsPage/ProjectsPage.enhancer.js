import { compose } from 'redux'
import { connect } from 'react-redux'
import { LIST_PATH } from 'constants'
import { withHandlers, withStateHandlers, pure } from 'recompose'
import { <% if (includeRedux && includeFirestore) { %>firestoreConnect<% } %><% if (includeRedux && !includeFirestore) { %>firebaseConnect<% } %> } from 'react-redux-firebase'
import { withNotifications } from 'modules/notification'
import { withRouter, spinnerWhileLoading } from 'utils/components'
import { UserIsAuthenticated } from 'utils/router'

export default compose(
  // redirect to /login if user is not logged in
  UserIsAuthenticated,
  // Map auth uid from state to props
  connect(({ firebase: { auth: { uid } } }) => ({ uid })),
  // Wait for uid to exist before going further
  spinnerWhileLoading(['uid']),
  // Create listeners based on current users UID
  <% if (includeRedux && !includeFirestore) { %>firebaseConnect(({ params, uid }) => [
    {
      path: 'projects',
      queryParams: ['orderByChild=createdBy', `equalTo=${uid}`]
    }
  ]),
  // Map projects from state to props
  connect(({ firebase: { ordered } }) => ({
    projects: ordered.projects
  })),<% } %><% if (includeRedux && includeFirestore) { %>firestoreConnect(({ params, uid }) => [
    // Listener for projects the current user created
    {
      collection: 'projects',
      where: ['createdBy', '==', uid]
    }
  ]),
  // Map projects from state to props
  connect(({ firestore: { ordered } }) => ({
    projects: ordered.projects
  })),<% } %>
  // Show loading spinner while projects and collabProjects are loading
  spinnerWhileLoading(['projects']),
  // Add props.router
  withRouter,
  // Add props.showError and props.showSuccess
  withNotifications,
  // Add state and state handlers as props
  withStateHandlers(
    // Setup initial state
    ({ initialDialogOpen = false }) => ({
      newDialogOpen: initialDialogOpen
    }),
    // Add state handlers as props
    {
      toggleDialog: ({ newDialogOpen }) => () => ({
        newDialogOpen: !newDialogOpen
      })
    }
  ),
  // Add handlers as props
  withHandlers({
    addProject: props => newInstance => {
      const { <% if (includeRedux && includeFirestore) { %>firestore<% } %><% if (includeRedux && !includeFirestore) { %>firebase<% } %>, uid, showError, showSuccess, toggleDialog } = props
      if (!uid) {
        return showError('You must be logged in to create a project')
      }
      return <% if (includeRedux && includeFirestore) { %>firestore
        .add(
          { collection: 'projects' },
          {
            ...newInstance,
            createdBy: uid,
            createdAt: firestore.FieldValue.serverTimestamp()
          }
        )<% } %><% if (includeRedux && !includeFirestore) { %>firebase
        .push('projects', {
          ...newInstance,
          createdBy: uid,
          createdAt: firebase.database.ServerValue.TIMESTAMP
        })<% } %>
        .then(() => {
          toggleDialog()
          showSuccess('Project added successfully')
        })
        .catch(err => {
          console.error('Error:', err) // eslint-disable-line no-console
          showError(err.message || 'Could not add project')
          return Promise.reject(err)
        })
    },
    deleteProject: props => projectId => {
      const { <% if (includeRedux && includeFirestore) { %>firestore<% } %><% if (includeRedux && !includeFirestore) { %>firebase<% } %>, showError, showSuccess } = props
      return <% if (includeRedux && includeFirestore) { %>firestore
        .delete({ collection: 'projects', doc: projectId })<% } %><% if (includeRedux && !includeFirestore) { %>firebase
        .remove(`projects/${projectId}`)<% } %>
        .then(() => showSuccess('Project deleted successfully'))
        .catch(err => {
          console.error('Error:', err) // eslint-disable-line no-console
          showError(err.message || 'Could not delete project')
          return Promise.reject(err)
        })
    },
    goToProject: ({ router }) => projectId => {
      router.push(`${LIST_PATH}/${projectId}`)
    }
  }),
  pure // shallow equals comparison on props (prevent unessesary re-renders)
)
