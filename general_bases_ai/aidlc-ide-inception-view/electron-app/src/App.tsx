import { useEffect, useState } from 'react'
import type { BootstrapInfo } from '../shared/runtime-config'
import type { SelectedProjectContext } from '../shared/types'
import type { UserProfile } from '../shared/user-profile'
import appIcon from './assets/app-icon.png'
import CognitoAuthLoginPage from './views/CognitoAuthLoginPage'
import CognitoNewPasswordPage from './views/CognitoNewPasswordPage'
import IndexingPage from './views/IndexingPage'
import LoginPage from './views/LoginPage'
import ProfileSetupPage from './views/ProfileSetupPage'
import RepoListPage from './views/RepoListPage'
import WorkspacePage from './views/WorkspacePage'

type View =
  | 'boot'
  | 'cognito'
  | 'cognito-new-password'
  | 'profile'
  | 'login'
  | 'repos'
  | 'indexing'
  | 'workspace'

export default function App(): JSX.Element {
  const [view, setView] = useState<View>('boot')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [cognitoUsername, setCognitoUsername] = useState<string | null>(null)
  const [selected, setSelected] = useState<SelectedProjectContext | null>(null)
  const [bootstrap, setBootstrap] = useState<BootstrapInfo | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [passwordChallenge, setPasswordChallenge] = useState<{
    username: string
    session: string
  } | null>(null)

  async function refreshCognitoUsername(): Promise<void> {
    const status = await window.aidlcApi.getCognitoAuthStatus()
    setCognitoUsername(status.username?.trim() || null)
  }

  async function continueAfterCognito(): Promise<void> {
    await refreshCognitoUsername()
    const existing = await window.aidlcApi.getUserProfile()
    if (!existing) {
      setProfile(null)
      setView('profile')
      return
    }
    setProfile(existing)
    setView('boot')
    const info = await window.aidlcApi.bootstrap()
    setBootstrap(info)
    if (info.authenticated) {
      setView('repos')
      return
    }
    setView('login')
  }

  async function continueAfterProfile(saved: UserProfile): Promise<void> {
    setProfile(saved)
    setEditingProfile(false)
    setView('boot')
    const info = await window.aidlcApi.bootstrap()
    setBootstrap(info)
    if (info.authenticated) {
      setView('repos')
      return
    }
    setView('login')
  }

  function finishProfileEdit(saved: UserProfile): void {
    setProfile(saved)
    setEditingProfile(false)
  }

  useEffect(() => {
    void (async () => {
      const status = await window.aidlcApi.getCognitoAuthStatus()
      if (!status.authenticated || !status.configLoaded) {
        setView('cognito')
        return
      }
      await continueAfterCognito()
    })()
  }, [])

  async function reconnect(): Promise<void> {
    setView('boot')
    const info = await window.aidlcApi.bootstrap()
    setBootstrap(info)
    if (info.authenticated) {
      setView('repos')
      return
    }
    setView('login')
  }

  async function handleFullLogout(): Promise<void> {
    setSelected(null)
    setBootstrap(null)
    setCognitoUsername(null)
    await window.aidlcApi.logout()
    setView('cognito')
  }

  const headerName = cognitoUsername
  const showHeaderName =
    Boolean(headerName) &&
    view !== 'profile' &&
    view !== 'boot' &&
    view !== 'cognito' &&
    view !== 'cognito-new-password'
  const showLogout =
    view === 'repos' || view === 'indexing' || view === 'workspace' || view === 'login'
  const showEditProfile =
    Boolean(profile) &&
    showHeaderName &&
    (view === 'repos' || view === 'indexing' || view === 'workspace')

  return (
    <div className="app-shell" data-testid="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <img src={appIcon} alt="" width={28} height={28} />
          <strong>AIDLC inception view</strong>
        </div>
        <div className="topbar-actions">
          {showHeaderName ? (
            <span
              className="topbar-display-name topbar-cognito-user"
              data-testid="topbar-display-name"
              title="Usuario Cognito"
            >
              {headerName}
            </span>
          ) : null}
          {showEditProfile ? (
            <button
              type="button"
              className="topbar-display-name"
              data-testid="topbar-edit-profile"
              title="Cambiar nombre para observaciones"
              onClick={() => setEditingProfile(true)}
            >
              Perfil
            </button>
          ) : null}
          {showLogout ? (
            <button
              type="button"
              className="btn topbar-logout"
              data-testid="topbar-logout"
              onClick={() => void handleFullLogout()}
            >
              Cerrar sesion
            </button>
          ) : null}
        </div>
      </header>
      {editingProfile && profile ? (
        <ProfileSetupPage
          mode="edit"
          initialProfile={profile}
          onSaved={finishProfileEdit}
          onCancel={() => setEditingProfile(false)}
        />
      ) : null}
      {!editingProfile && view === 'boot' ? (
        <main className="panel">
          <p className="muted">Conectando con la configuracion…</p>
        </main>
      ) : null}
      {!editingProfile && view === 'cognito' ? (
        <CognitoAuthLoginPage
          onAuthenticated={() => void continueAfterCognito()}
          onNeedNewPassword={(ctx) => {
            setPasswordChallenge(ctx)
            setView('cognito-new-password')
          }}
        />
      ) : null}
      {!editingProfile && view === 'cognito-new-password' && passwordChallenge ? (
        <CognitoNewPasswordPage
          username={passwordChallenge.username}
          session={passwordChallenge.session}
          onAuthenticated={() => {
            setPasswordChallenge(null)
            void continueAfterCognito()
          }}
          onCancel={() => {
            setPasswordChallenge(null)
            setView('cognito')
          }}
        />
      ) : null}
      {!editingProfile && view === 'profile' ? (
        <ProfileSetupPage
          initialProfile={profile}
          askAwsCredentials={false}
          onSaved={(p) => void continueAfterProfile(p)}
        />
      ) : null}
      {!editingProfile && view === 'login' ? (
        <LoginPage
          bootstrap={bootstrap}
          onSuccess={() => {
            setView('repos')
          }}
          onRetryLocked={() => void reconnect()}
        />
      ) : null}
      {!editingProfile && view === 'repos' ? (
        <RepoListPage
          credentialsLocked={Boolean(bootstrap?.credentialsLocked)}
          devMode={Boolean(bootstrap?.devMode)}
          testRepoPath={bootstrap?.testRepoPath ?? null}
          onLogout={() => void handleFullLogout()}
          onOpened={(ctx) => {
            setSelected(ctx)
            setView('indexing')
          }}
          selected={selected}
        />
      ) : null}
      {!editingProfile && view === 'indexing' && selected ? (
        <IndexingPage
          context={selected}
          onReady={() => setView('workspace')}
          onBack={() => {
            setSelected(null)
            setView('repos')
          }}
        />
      ) : null}
      {!editingProfile && view === 'workspace' && selected ? (
        <WorkspacePage
          context={selected}
          onBack={() => {
            setSelected(null)
            setView('repos')
          }}
        />
      ) : null}
    </div>
  )
}
