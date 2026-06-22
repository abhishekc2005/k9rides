import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ArrowRight } from 'lucide-react'
import k9Logo from '../assets/k9-logo.jpg'

export default function Navbar({ settings }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Services', href: '#services' },
    { name: 'Why Us', href: '#why-us' },
    { name: 'Become a Partner', href: '#partners' },
    { name: 'FAQs', href: '#faq' }
  ]

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault()
    setIsMobileMenuOpen(false)
    const element = document.querySelector(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-md py-4 border-b border-black/5 dark:border-white/5' 
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg shadow-[#C5902A]/20 group-hover:scale-105 transition-transform duration-300 bg-white">
              <img src={settings?.logo_url || k9Logo} alt="K9 Rides" className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white group-hover:text-[#C5902A] transition-colors duration-300">
              K9 Rides
            </span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleSmoothScroll(e, link.href)}
                className="text-sm font-semibold text-slate-600 hover:text-[#C5902A] dark:text-slate-300 dark:hover:text-[#F5D476] transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Desktop Right CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a 
              href="/login"
              className="text-sm font-bold text-slate-700 hover:text-[#C5902A] dark:text-slate-200 dark:hover:text-[#F5D476] transition-colors duration-200"
            >
              Sign In
            </a>
            <a
              href="/login"
              className="inline-flex items-center gap-1.5 bg-[#F5D476] hover:bg-[#C5902A] text-slate-950 hover:text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-[#C5902A]/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[#C5902A]/30"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-[#C5902A] dark:text-slate-300 dark:hover:text-[#F5D476] transition-colors duration-200"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 p-8 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-extrabold text-xl text-slate-900 dark:text-white">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-slate-700 hover:text-[#C5902A] dark:text-slate-300 dark:hover:text-[#F5D476] transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex flex-col gap-6 mb-8">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleSmoothScroll(e, link.href)}
                    className="text-lg font-bold text-slate-800 hover:text-[#C5902A] dark:text-slate-200 dark:hover:text-[#F5D476] transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                ))}
              </div>

              <div className="mt-auto flex flex-col gap-4">
                <a
                  href="/login"
                  className="text-center font-bold text-slate-800 dark:text-slate-200 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200"
                >
                  Sign In
                </a>
                <a
                  href="/login"
                  className="text-center bg-[#F5D476] hover:bg-[#C5902A] text-slate-950 hover:text-white font-bold py-3 rounded-xl shadow-lg shadow-[#C5902A]/20 transition-all duration-300"
                >
                  Get Started
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
