import { Outlet } from 'react-router-dom'
import TopBar from '../components/TopBar'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import AuthenticatedShell from '../components/AuthenticatedShell'

export default function MarketingLayout() {
  const { session, loading } = useAuth()
  if (!loading && session) return <AuthenticatedShell />
  return (
    <>
      <div className="SiteChrome">
        <TopBar />
        <Header />
      </div>
      <main id="main-content">
        <Outlet />
      </main>
    </>
  )
}
