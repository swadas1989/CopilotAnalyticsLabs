import { useEffect, useState } from 'react'
import App from './App.tsx'
import TemplatesPage from './TemplatesPage.tsx'

function getRoute(): string {
  return window.location.hash.replace(/^#/, '')
}

export default function Root() {
  const [route, setRoute] = useState(getRoute())

  useEffect(() => {
    const onHashChange = () => {
      setRoute(getRoute())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route === '/templates' ? <TemplatesPage /> : <App />
}
