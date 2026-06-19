import React from 'react'
import { Mail, Phone, MapPin } from 'lucide-react'
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa'
import k9Logo from '../assets/k9-logo.jpg'

export default function Footer({ settings }) {
  const currentYear = new Date().getFullYear()

  const links = {
    company: [
      { name: 'About Us', href: '/taxi/about' },
      { name: 'Careers', href: '/taxi/careers' },
      { name: 'Newsroom', href: '/taxi/newsroom' }
    ],
    services: [
      { name: 'Ride Hailing', href: '/login/services' },
      { name: 'Food Delivery', href: '/login/services' },
      { name: 'Parcels & Logistics', href: '/login/services' },
      { name: 'Airport Transfers', href: '/login/services' }
    ],
    legal: [
      { name: 'Terms of Service', href: '/taxi/terms' },
      { name: 'Privacy Policy', href: '/taxi/privacy' },
      { name: 'Refund Policy', href: '/taxi/refund' },
      { name: 'Cancellation Policy', href: '/taxi/cancellation' },
      { name: 'FAQs', href: '/taxi/faq' }
    ]
  }

  const socialLinks = [
    { icon: FaFacebook, href: settings?.social_links?.facebook || '#', colorClass: 'text-[#1877F2]' },
    { icon: FaTwitter, href: settings?.social_links?.twitter || '#', colorClass: 'text-[#1DA1F2]' },
    { icon: FaInstagram, href: settings?.social_links?.instagram || '#', colorClass: 'text-[#E4405F]' },
    { icon: FaLinkedin, href: settings?.social_links?.linkedin || '#', colorClass: 'text-[#0A66C2]' }
  ]

  const playStoreUrl = settings?.play_store_url || '/login/services'
  const appStoreUrl = settings?.app_store_url || '/login/services'

  const contactAddress = settings?.contact_address || 'K9 Village, Siliguri, West Bengal, India'
  const contactPhone = settings?.contact_phone || '+91 7358789910'
  const contactEmail = settings?.contact_email || 'k9bharatrides@gmail.com'

  return (
    <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-12">
        
        {/* Left Column: Branding */}
        <div className="lg:col-span-4 text-left space-y-6">
          <a href="#" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg bg-white">
              <img src={settings?.logo_url || k9Logo} alt="K9 Rides" className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              K9 Rides
            </span>
          </a>
          <p className="text-sm leading-relaxed text-slate-400">
            K9 Rides is the leading on-demand super-app platform connecting passengers, diners, merchants, and cargo owners to drivers and logistics providers.
          </p>
          <div className="flex gap-4">
            {socialLinks.map((social, idx) => {
              const Icon = social.icon
              return (
                <a
                  key={idx}
                  href={social.href}
                  className="group p-2 rounded-xl bg-slate-900 hover:bg-[#C5902A] transition-all duration-300 border border-slate-800"
                  aria-label="Social Link"
                >
                  <Icon className={`w-5 h-5 ${social.colorClass} group-hover:text-black transition-colors duration-300`} />
                </a>
              )
            })}
          </div>

          {/* App Download Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={playStoreUrl}
              className="transition-transform duration-200 hover:scale-[1.03]"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                alt="Get it on Google Play" 
                className="h-10 w-auto"
                loading="lazy"
              />
            </a>

            <a
              href={appStoreUrl}
              className="transition-transform duration-200 hover:scale-[1.03]"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                alt="Download on the App Store" 
                className="h-10 w-auto"
                loading="lazy"
              />
            </a>
          </div>
        </div>

        {/* Link Columns */}
        <div className="lg:col-span-2 text-left space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Company</h4>
          <ul className="space-y-2 text-sm">
            {links.company.map((link) => (
              <li key={link.name}>
                <a href={link.href} className="hover:text-white transition-colors duration-200">{link.name}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 text-left space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Services</h4>
          <ul className="space-y-2 text-sm">
            {links.services.map((link) => (
              <li key={link.name}>
                <a href={link.href} className="hover:text-white transition-colors duration-200">{link.name}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 text-left space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Legal</h4>
          <ul className="space-y-2 text-sm">
            {links.legal.map((link) => (
              <li key={link.name}>
                <a href={link.href} className="hover:text-white transition-colors duration-200">{link.name}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: Contact info */}
        <div className="lg:col-span-2 text-left space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Contact Us</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#C5902A] dark:text-[#F5D476] shrink-0 mt-0.5" />
              <span>{contactAddress}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#C5902A] dark:text-[#F5D476] shrink-0" />
              <span>{contactPhone}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#C5902A] dark:text-[#F5D476] shrink-0" />
              <span>{contactEmail}</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-6 border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <p>© {currentYear} K9 Rides Inc. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="/taxi/terms" className="hover:text-white transition-colors duration-200">Terms</a>
          <a href="/taxi/privacy" className="hover:text-white transition-colors duration-200">Privacy</a>
          <a href="/taxi/support" className="hover:text-white transition-colors duration-200">Support</a>
        </div>
      </div>
    </footer>
  )
}
