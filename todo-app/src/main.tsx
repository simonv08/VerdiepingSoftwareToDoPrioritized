import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { SocialLogin } from '@capgo/capacitor-social-login'

const GOOGLE_CLIENT_ID = '188476231988-b5rm9c3319bgmkkud4kehqrn5vgmko4l.apps.googleusercontent.com'

function Root() {
  useEffect(() => {
    SocialLogin.initialize({
      google: {
        webClientId: GOOGLE_CLIENT_ID,
      },
    })
  }, [])

  return (
    <StrictMode>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </StrictMode>
  )
}

createRoot(document.getElementById('root')!).render(<Root />)
