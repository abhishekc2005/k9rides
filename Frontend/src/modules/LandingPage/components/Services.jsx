import React from 'react'
import { motion } from 'framer-motion'
import { Car, Utensils, Package, Plane, Bike, Truck, ArrowRight } from 'lucide-react'

export default function Services() {
  const services = [
    {
      icon: Car,
      title: 'Ride Hailing / Taxi',
      description: 'Book rides in seconds. From budget-friendly shares to premium private cabs, travel safely with vetted drivers.',
      color: 'text-[#C5902A] dark:text-[#F5D476] bg-[#C5902A]/10 dark:bg-[#C5902A]/5',
      tag: 'taxi'
    },
    {
      icon: Utensils,
      title: 'Food & Dining',
      description: 'Hungry? Get delicious meals from local favorites delivered straight to your door, or reserve tables at top-rated restaurants.',
      color: 'text-slate-900 bg-slate-100 dark:bg-slate-800 dark:text-slate-100',
      tag: 'food'
    },
    {
      icon: Package,
      title: 'Courier & Parcels',
      description: 'Send and receive packages instantly. Ideal for documents, gifts, or key business inventory with live end-to-end tracking.',
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400',
      tag: 'parcel'
    },
    {
      icon: Plane,
      title: 'Airport Transfers',
      description: 'Arrive at your flight stress-free. Pre-schedule drop-offs and pick-ups with dedicated airport luggage assistance.',
      color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/30 dark:text-sky-400',
      tag: 'airport'
    },
    {
      icon: Bike,
      title: 'Hourly Rentals',
      description: 'Need wheels for a day? Rent motorcycles, scooters, or cars dynamically with smart keyless check-in and KYC.',
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400',
      tag: 'rental'
    },
    {
      icon: Truck,
      title: 'Cargo & Logistics',
      description: 'Solve larger corporate transport demands. Book heavy-duty mini-trucks, supply trucks, or vans for swift warehouse moves.',
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400',
      tag: 'logistics'
    }
  ]

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 80, damping: 15 }
    }
  }

  return (
    <section id="services" className="py-24 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-xs font-black tracking-widest text-[#C5902A] dark:text-[#F5D476] uppercase">
            Services Platform
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            One Super-App. Infinite Possibilities.
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            Ditch the clutter of multiple applications. Whether you need a morning commute, a warm lunch, or commercial supply logistics, K9 Rides does it all.
          </p>
        </div>

        {/* Services Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <motion.div
                key={service.title}
                variants={cardVariants}
                className="group p-8 rounded-[24px] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl hover:shadow-[#C5902A]/5 hover:border-[#C5902A]/20 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-6 text-left">
                  {/* Icon Wrapper */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${service.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  {/* Description */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-[#C5902A] dark:group-hover:text-[#F5D476] transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50 mt-6 flex justify-between items-center">
                  <a
                    href="/login"
                    className="inline-flex items-center gap-1 text-xs font-black text-[#C5902A] dark:text-[#F5D476] hover:text-[#8E5C0D] transition-colors"
                  >
                    Open Service
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    #{service.tag}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

      </div>
    </section>
  )
}
