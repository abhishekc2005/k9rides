import React from 'react';
import { motion } from 'framer-motion';
import discountPromoIcon from "@food/assets/category-icons/discount_promo.png";
import gourmetPromoIcon from "@food/assets/explore more icons/gourmet.png";
import pricePromoIcon from "@food/assets/category-icons/price_promo.png";
import collectionPromoIcon from "@food/assets/explore more icons/collection.png";

export default function PromoRow({ handleVegModeChange, navigate, isVegMode, toggleRef }) {
  const promoCardsData = [
    {
      id: 'offers',
      title: "Hot Deals",
      value: "Offers",
      icon: discountPromoIcon,
    },
    {
      id: 'gourmet',
      title: "Premium",
      value: "Gourmet",
      icon: gourmetPromoIcon,
    },
    {
      id: 'under-250',
      title: "Under ₹99",
      value: "Switch 99",
      icon: pricePromoIcon,
    },
    {
      id: 'collections',
      title: "Favorites",
      value: "Collections",
      icon: collectionPromoIcon,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 px-4 py-6 bg-transparent justify-items-center w-full max-w-[500px] mx-auto">
      {promoCardsData.map((promo, idx) => (
        <motion.div
          key={idx}
          ref={promo.id === 'gourmet' ? toggleRef : null}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: idx * 0.05
          }}
          whileHover={{
            y: -6,
            scale: 1.05,
            boxShadow: "0px 12px 30px rgba(255, 61, 119, 0.12)"
          }}
          whileTap={{ scale: 0.94 }}
          className="relative flex flex-col items-center justify-between p-3.5 bg-white dark:bg-[#1a1a1a] rounded-[20px] border border-rose-500/5 hover:border-rose-500/20 cursor-pointer w-full text-center aspect-[0.82/1] transition-colors duration-300 group overflow-hidden"
          onClick={() => {
            if (promo.id === 'gourmet') navigate('/food/user/gourmet');
            else if (promo.id === 'offers') navigate('/food/user/offers');
            else if (promo.id === 'under-250') navigate('/food/user/under-250');
            else if (promo.id === 'collections') navigate('/food/user/profile/favorites');
          }}
        >
          {/* Top Gradient Stripe on Hover */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#FF6B3D] to-[#FF3E7F] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-[20px]" />

          {/* Floating Icon Container with Soft Glow */}
          <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-tr from-[#FF6B3D]/8 to-[#FF3E7F]/8 dark:from-[#FF6B3D]/15 dark:to-[#FF3E7F]/15 group-hover:scale-110 transition-transform duration-300">
            {/* Pulsing glow under icon */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FF6B3D] to-[#FF3E7F] opacity-0 group-hover:opacity-15 blur-sm transition-opacity duration-300" />
            <img
              src={promo.icon}
              alt={promo.value}
              className="w-8 h-8 object-contain relative z-20 drop-shadow-[0_2px_8px_rgba(255,90,90,0.1)]"
            />
          </div>

          {/* Premium Typography & Badges */}
          <div className="flex flex-col items-center text-center w-full mt-2">
            <span className="text-[12px] font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1.5">
              {promo.value}
            </span>
            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FF6B3D]/8 to-[#FF3E7F]/8 text-[#FF3E7F] dark:text-rose-450 tracking-wider">
              {promo.title}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
