import { MotionConfig } from 'framer-motion'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App'
import { MatchManagerProvider } from './features/matches/MatchManager'
import { TeamManagerProvider } from './features/teams/TeamManager'
import { AuthProvider } from './state/AuthProvider'
import { TournamentProvider } from './state/TournamentProvider'
import '@fontsource-variable/archivo/standard.css'
import '@fontsource-variable/manrope'
import '@fontsource/kaushan-script'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <TournamentProvider>
          <TeamManagerProvider>
            <MatchManagerProvider>
              <App />
            </MatchManagerProvider>
          </TeamManagerProvider>
        </TournamentProvider>
      </AuthProvider>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: '!rounded-card !border !border-white/10 !bg-ink-800 !text-fog-50 !font-sans !shadow-card',
            description: '!text-fog-400',
          },
        }}
      />
    </MotionConfig>
  </StrictMode>,
)
