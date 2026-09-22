import TopBar from './components/TopBar'
import Header from './components/Header'
import Hero from './components/Hero'
import JoinBanner from './components/JoinBanner'
import MarqueeStrip from './components/MarqueeStrip'
import AboutSection from './components/AboutSection'

function App() {
  return (
    <>
      <div className="SiteChrome">
        <TopBar />
        <Header />
      </div>
      <main id="main-content">
      <Hero />
      <JoinBanner />
      <MarqueeStrip />
      <AboutSection />
      </main>
    </>
  )
}

export default App
