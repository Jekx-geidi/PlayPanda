import { Outlet } from 'react-router-dom'
import TopBar from '../components/TopBar'
import Header from '../components/Header'

export default function MarketingLayout() {
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
