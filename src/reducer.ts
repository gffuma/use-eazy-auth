import {
  // Form login auth actions
  LOGIN_LOADING,
  LOGIN_FAILURE,
  LOGIN_SUCCESS,

  // Clear the login error
  CLEAR_LOGIN_ERROR,

  // Auth initialization
  BOOTSTRAP_AUTH_START,
  BOOTSTRAP_AUTH_END,

  // Token refreshed
  TOKEN_REFRESHED,

  // Explicit set tokens
  SET_TOKENS,

  // Update user data
  UPDATE_USER,

  // Patch user data
  PATCH_USER,

  // Logout action
  LOGOUT,
  AuthActions,
  FunctionalUpdaterUser,
} from './actionTypes'
import { InitialAuthData } from './types'

export interface AuthStateShape<A = any, R = any, U = any> {
  // Is auth initialized?
  bootstrappingAuth: boolean
  bootstrappedAuth: boolean
  // Current logged user
  user: U | null
  // Tokens
  accessToken: A | null
  refreshToken: R | null
  expires?: number | null
  // Login state
  loginLoading: boolean
  loginError: any
}

const initialState: AuthStateShape = {
  // Is auth initialized?
  bootstrappingAuth: false,
  bootstrappedAuth: false,
  // Current logged user
  user: null,
  // Tokens
  accessToken: null,
  refreshToken: null,
  expires: null,
  // Login state
  loginLoading: false,
  loginError: null,
}

export function initAuthState<A, R, U>(
  initialData: InitialAuthData<A, R, U> | undefined
): AuthStateShape<A, R, U> {
  if (initialData) {
    // Only fill user and access token together
    if (initialData.user && initialData.accessToken) {
      return {
        ...initialState,
        bootstrappedAuth: true,
        user: initialData.user,
        accessToken: initialData.accessToken,
        refreshToken: initialData.refreshToken ?? null,
        expires: initialData.expires ?? null,
      }
    } else {
      return {
        ...initialState,
        bootstrappedAuth: true,
      }
    }
  }
  return initialState
}

export default function authReducer<A = any, R = any, U = any>(
  previousState: AuthStateShape<A, R, U> = initialState,
  action: AuthActions<A, R, U>
): AuthStateShape<A, R, U> {
  switch (action.type) {
    case LOGIN_LOADING:
      return {
        ...previousState,
        loginLoading: true,
        loginError: null,
      }
    case LOGIN_FAILURE:
      return {
        ...previousState,
        loginLoading: false,
        loginError: action.error,
      }
    case CLEAR_LOGIN_ERROR: {
      if (previousState.loginError === null) {
        return previousState
      }
      return {
        ...previousState,
        loginError: null,
      }
    }
    case LOGIN_SUCCESS:
      return {
        ...previousState,
        loginLoading: false,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken ?? null,
        expires: action.payload.expires,
        // logoutFromPermission: false,
      }
    case BOOTSTRAP_AUTH_START:
      return {
        ...previousState,
        bootstrappingAuth: true,
      }
    case BOOTSTRAP_AUTH_END: {
      let nextState = {
        ...previousState,
        bootstrappedAuth: true,
        bootstrappingAuth: false,
      }
      if (action.payload.authenticated) {
        const {
          user,
          accessToken,
          refreshToken = null,
          expires = null,
        } = action.payload
        return {
          ...nextState,
          user,
          accessToken,
          refreshToken,
          expires,
        }
      }
      return nextState
    }
    case SET_TOKENS:
      return {
        ...previousState,
        expires: action.payload.expires,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
      }
    case TOKEN_REFRESHED:
      return {
        ...previousState,
        expires: action.payload.expires,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
      }
    case UPDATE_USER: {
      const userOrUpdater = action.payload
      return {
        ...previousState,
        // NOTE: Improve types when better solution 2
        // https://github.com/microsoft/TypeScript/issues/37663
        user:
          typeof userOrUpdater === 'function'
            ? (userOrUpdater as FunctionalUpdaterUser<U>)(previousState.user)
            : userOrUpdater,
      }
    }
    case PATCH_USER:
      return {
        ...previousState,
        user: {
          ...previousState.user,
          ...action.payload,
        } as U,
      }
    case LOGOUT:
      return {
        ...initialState,
        // Logout doesn't mean reinitialization
        bootstrappedAuth: previousState.bootstrappedAuth,
      }
    default:
      return previousState
  }
}
