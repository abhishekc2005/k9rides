import React, { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Users, Truck, Clock, ShieldCheck } from 'lucide-react'

function StatCounter({ value, duration = 2 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (!isInView) return

    let start = 0
    // Parse target number (e.g. "500K+" -> 500, "15+" -> 15)
    const end = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0
    if (start === end) return

    const totalMiliseconds = duration * 1000
    const stepTime = Math.max(Math.floor(totalMiliseconds / end), 20)
    
    const timer = setInterval(() => {
      start += Math.ceil(end / 40) // speed increment
      if (start >= end) {
        clearInterval(timer)
        start = end
      }
      setCount(start)
    }, stepTime)

    return () => clearInterval(timer)
  }, [isInView, value, duration])

  // Re-append the symbol (e.g., K+, +)
  const suffix = value.replace(/[0-9]/g, '')

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  )
}

export default function WhyUs() {
  const stats = [
    { label: 'Platform Downloads', value: '500K+' },
    { label: 'Registered Drivers', value: '10K+' },
    { label: 'Partner Restaurants', value: '2K+' },
    { label: 'Supported Cities', value: '15+' }
  ]

  const props = [
    {
      icon: ShieldCheck,
      title: 'Safety First, Always',
      description: 'Every driver undergoes strict criminal background verification and vehicle safety checkouts before joining the platform.'
    },
    {
      icon: Clock,
      title: '24/7 Client Dispatch',
      description: 'Need a late-night ride or order help? Access our instant chat support panel directly from the app dashboard.'
    },
    {
      icon: Users,
      title: 'Fair Payouts & Rates',
      description: 'Vibrant local networks, competitive fare calculations, and low platform commission rates keep our riders and providers happy.'
    }
  ]

  return (
    <section id="why-us" className="py-24 bg-slate-50 dark:bg-slate-950/60 overflow-hidden relative border-t border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Statistics Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, idx) => (
            <div key={idx} className="p-6 bg-white dark:bg-slate-900 rounded-[20px] shadow-sm border border-slate-100 dark:border-slate-800 text-center space-y-2">
              <p className="text-3xl sm:text-4xl font-black text-[#C5902A] dark:text-[#F5D476]">
                <StatCounter value={stat.value} />
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Heading */}
          <div className="lg:col-span-5 text-left space-y-6">
            <h2 className="text-xs font-black tracking-widest text-[#C5902A] dark:text-[#F5D476] uppercase">
              Why Choose Us
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              A Unified Ecosystem Built for Modern Commute
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
              We started with a simple vision: to construct an on-demand delivery and transportation service that benefits everyone—riders, delivery professionals, local kitchens, and corporate logistics providers. 
            </p>
            <div className="pt-2">
              <a
                href="/login"
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-[#C5902A] dark:hover:bg-[#8E5C0D] text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg transition-all duration-300"
              >
                Try the Super-App
              </a>
            </div>
          </div>

          {/* Right Column: Values */}
          <div className="lg:col-span-7 space-y-8">
            {props.map((prop, index) => {
              const Icon = prop.icon
              return (
                <motion.div
                  key={prop.title}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: index * 0.15, type: 'spring', stiffness: 70 }}
                  className="flex gap-5 p-6 bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800/80 hover:shadow-md transition-shadow text-left"
                >
                  <div className="p-3 bg-[#C5902A]/10 dark:bg-[#C5902A]/5 text-[#C5902A] dark:text-[#F5D476] rounded-2xl h-fit shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {prop.title}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                      {prop.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

      </div>
    </section>
  )
}
