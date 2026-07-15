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
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0)
    })
  }, [route])

  if (route === '/templates') return <TemplatesPage />
  if (route === '/codes') return <CodesPage />
  if (route === '/research') return <ResearchPage />
  return <App />
}
