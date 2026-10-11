import { useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import Tracker from './Tracker.jsx'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_204221_5339e40b-e73d-4ab0-9c65-79c18c66fd50.mp4'

const links = [
  { label: 'Home', href: '#home' },
  { label: 'Tracker', href: '#tracker' },
  { label: 'Insights', href: '#insights' },
  { label: 'Reach us', href: '#reach' },
]

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <div id="home" className="relative h-screen w-full overflow-hidden bg-black font-geist">
        {/* Video background */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: '70% center' }}
          src={VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
        />

        {/* Navbar */}
        <nav className="relative z-30 flex items-center justify-between px-6 py-5 md:px-12 lg:px-16">
          <div className="flex items-center gap-10">
            <span className="text-lg font-semibold tracking-tight text-white sm:text-xl">
              MoneyMitra
            </span>
            <div className="hidden items-center gap-8 md:flex">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-sm text-white/80 transition-colors hover:text-white"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          <div className="hidden md:block">
            <a
              href="#tracker"
              className="inline-block rounded-lg bg-white px-5 py-2 text-sm font-medium text-black transition-transform hover:scale-105"
            >
              Let's Talk
            </a>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="relative z-50 h-10 w-10 text-white active:scale-90 md:hidden"
          >
            <Menu
              size={24}
              className={`absolute inset-0 m-auto transition-all duration-300 ${
                mobileMenuOpen ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'
              }`}
            />
            <X
              size={24}
              className={`absolute inset-0 m-auto transition-all duration-300 ${
                mobileMenuOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'
              }`}
            />
          </button>
        </nav>

        {/* Mobile menu */}
        <div
          className={`absolute inset-x-0 top-0 z-20 bg-black/98 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${
            mobileMenuOpen ? 'h-screen opacity-100' : 'pointer-events-none h-0 opacity-0'
          }`}
        >
          <div
            className={`flex h-full flex-col justify-center px-8 transition-all duration-500 delay-100 ${
              mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <div className="flex flex-col gap-6">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-3xl font-medium text-white/90 hover:text-white"
                >
                  {l.label}
                </a>
              ))}
            </div>
            <a
              href="#tracker"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-6 inline-block w-fit rounded-full bg-white px-8 py-3.5 text-base font-medium text-black hover:scale-105"
            >
              Let's Talk
            </a>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex h-[calc(100vh-80px)] flex-col justify-between px-6 pb-10 pt-12 sm:pb-12 sm:pt-16 md:px-12 md:pb-16 md:pt-20 lg:px-16">
          <div className="max-w-3xl">
            <p className="mb-4 animate-[fadeSlideUp_0.8s_ease_0.2s_both] text-xs text-white/90 sm:mb-6 sm:text-sm">
              AI Expense Tracking & Smart Saving
            </p>
            <h1 className="animate-[fadeSlideUp_0.8s_ease_0.4s_both] text-3xl font-medium leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Know where
              <br />
              every rupee goes,
              <br />
              and keep more of it.
            </h1>
          </div>

          <div>
            <p className="mb-5 max-w-sm animate-[fadeSlideUp_0.8s_ease_0.7s_both] text-sm leading-relaxed text-white/60 sm:mb-6 sm:max-w-lg sm:text-base md:text-lg">
              MoneyMitra tracks your spending, spots the leaks in your budget, and shows how much you can save each month.
            </p>
            <a
              href="#tracker"
              className="inline-flex animate-[fadeSlideUp_0.8s_ease_0.9s_both] items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform hover:scale-105 sm:px-6 sm:py-3"
            >
              Start Tracking
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>

      <Tracker />
    </>
  )
}
