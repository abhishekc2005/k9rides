import React from 'react'
import { motion } from 'framer-motion'
import { Car, Utensils, Box, Plane, Calendar, ShieldCheck, ArrowRight, Star } from 'lucide-react'
import k9Logo from '../assets/k9-logo.jpg'

export default function Hero({ settings }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  }

  return (
    <section className="relative min-h-screen pt-32 pb-20 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#C5902A]/5 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-20 right-10 w-96 h-96 rounded-full bg-[#C5902A]/5 dark:bg-[#C5902A]/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-[#C5902A]/10 dark:bg-[#C5902A]/2 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
        
        {/* Left: Headline & Actions */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-7 text-left space-y-8"
        >
          {/* Badge */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C5902A]/10 border border-[#C5902A]/20 dark:bg-[#C5902A]/5 dark:border-[#C5902A]/15"
          >
            <span className="flex h-2 w-2 rounded-full bg-[#C5902A] animate-pulse" />
            <span className="text-xs font-bold tracking-wide text-[#C5902A] dark:text-[#F5D476] uppercase">
              All-In-One Platform Launched
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]"
          >
            {settings?.hero_title || (
              <>
                All-in-One Platform for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C5902A] to-[#F5D476] dark:from-[#C5902A] dark:to-[#F5D476]">
                  Rides, Food & Logistics
                </span>
              </>
            )}
          </motion.h1>

          {/* Supporting Text */}
          <motion.p 
            variants={itemVariants}
            className="text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed"
          >
            {settings?.hero_description || 'K9 Rides is the multi-service super-app designed for modern cities. Easily book a taxi, order from your favorite local restaurants, ship parcels, arrange airport transfers, rent vehicles, and coordinate complex supply chains.'}
          </motion.p>

          {/* Actions */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 pt-2"
          >
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-[#F5D476] hover:bg-[#C5902A] text-slate-950 hover:text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-[#C5902A]/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[#C5902A]/30 text-base"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </a>
            
            <a
              href="#partners"
              className="inline-flex items-center justify-center bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold px-8 py-4 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1 text-base"
            >
              Partner with Us
            </a>
          </motion.div>

          {/* Fast Features */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">100% Secure</span>
            </div>
            
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">4.9 Star Rating</span>
            </div>
            
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#C5902A]/10 dark:bg-[#C5902A]/15 text-[#C5902A] dark:text-[#F5D476]">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Fast Deliveries</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right: Premium Dynamic Card Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 hidden lg:block"
        >
          {settings?.hero_image_url ? (
            <div className="flex justify-center items-center h-full">
              <img 
                src={settings.hero_image_url} 
                alt="K9 Rides Hero" 
                className="w-full max-w-[450px] h-auto object-contain rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500" 
              />
            </div>
          ) : (
            <div className="relative mx-auto w-[340px] h-[640px] bg-slate-950 rounded-[48px] p-4 shadow-2xl border-4 border-slate-800 ring-12 ring-slate-900/50">
              {/* Phone Speaker & Camera cutouts */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-6 w-36 bg-slate-950 rounded-b-2xl z-30 flex items-center justify-center">
                <div className="w-16 h-1.5 bg-slate-800 rounded-full" />
              </div>

              {/* Inner Content */}
              <div className="w-full h-full bg-slate-900 rounded-[38px] overflow-hidden p-5 flex flex-col justify-between relative">
                {/* Header inside mockup */}
                <div className="flex items-center justify-between pt-4 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                      <img src={settings?.logo_url || k9Logo} alt="K9 Rides" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-black text-white">K9 Rides</span>
                  </div>
                  <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C5902A]" />
                  </div>
                </div>

                {/* Main screen inside mockup */}
                <div className="flex-1 my-4 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
                  <div className="p-4 bg-[#1A1A1A] border border-slate-800/80 rounded-2xl text-left space-y-1 relative overflow-hidden">
                    <div className="absolute right-[-10px] bottom-[-10px] w-24 h-24 rounded-full bg-[#C5902A]/5 blur-xl" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Balance</p>
                    <p className="text-2xl font-black text-white">₹142.50</p>
                    <p className="text-[9px] font-semibold text-[#F5D476]">Instant Cashout Enabled</p>
                  </div>

                  <p className="text-left text-xs font-black text-slate-400 tracking-wide uppercase">Our Services</p>

                  {/* Service Quick-Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl flex flex-col justify-between h-20 text-left cursor-pointer transition-colors duration-200">
                      <Car className="w-5 h-5 text-[#F5D476]" />
                      <span className="text-[10px] font-bold text-white">Taxi Booking</span>
                    </div>
                    
                    <div className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl flex flex-col justify-between h-20 text-left cursor-pointer transition-colors duration-200">
                      <Utensils className="w-5 h-5 text-[#F5D476]" />
                      <span className="text-[10px] font-bold text-white">Food Order</span>
                    </div>
                    
                    <div className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl flex flex-col justify-between h-20 text-left cursor-pointer transition-colors duration-200">
                      <Box className="w-5 h-5 text-emerald-400" />
                      <span className="text-[10px] font-bold text-white">Courier Delivery</span>
                    </div>
                    
                    <div className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl flex flex-col justify-between h-20 text-left cursor-pointer transition-colors duration-200">
                      <Plane className="w-5 h-5 text-sky-400" />
                      <span className="text-[10px] font-bold text-white">Airport Transfer</span>
                    </div>
                  </div>

                  {/* Banner inside mock */}
                  <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 flex items-center gap-3 text-left">
                    <div className="p-2 bg-[#C5902A]/10 rounded-lg text-[#F5D476]">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white">Hourly Rentals</p>
                      <p className="text-[8px] text-slate-400">Rent a vehicle dynamically</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Nav inside mockup */}
                <div className="h-12 border-t border-slate-800 flex items-center justify-around text-slate-500 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5902A]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                </div>
              </div>
            </div>
          )}
        </motion.div>

      </div>
    </section>
  )
}
