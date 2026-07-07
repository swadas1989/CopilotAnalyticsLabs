import { useEffect, useState } from 'react'
import App from './App.tsx'
import TemplatesPage from './TemplatesPage.tsx'
import CodesPage from './CodesPage.tsx'
import ResearchPage from './ResearchPage.tsx'

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

  if (route === '/templates') return <TemplatesPage />
  if (route === '/codes') return <CodesPage />
  if (route === '/research') return <ResearchPage />
  return <App />
}
