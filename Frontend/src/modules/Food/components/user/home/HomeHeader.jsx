import { useState, useEffect, useMemo } from 'react';

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, Search, Mic, Bell, CheckCircle2, Tag, Gift, AlertCircle, Clock, BellOff, X, ChevronRight, ShoppingBag, Sparkles, Utensils, Car } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@food/components/ui/popover";
import { Badge } from "@food/components/ui/badge";
import { Avatar, AvatarFallback } from "@food/components/ui/avatar";
import foodIcon from "@food/assets/category-icons/food.png.png";
import taxiIcon from "@food/assets/category-icons/taxi.png.png";
import quickIcon from "@food/assets/category-icons/quick.png";
import hotelIcon from "@food/assets/category-icons/hotel.png";
import useNotificationInbox from "@food/hooks/useNotificationInbox";

const ICON_MAP = {
  CheckCircle2,
  Tag,
  Gift,
  AlertCircle
};



export default function HomeHeader({
  activeTab,
  setActiveTab,
  location,
  savedAddressText,
  handleLocationClick,
  handleSearchFocus,
  placeholderIndex,
  placeholders,
  handleVegModeChange,
  isVegMode,
  vegModeToggleRef,
  isCategoryStuck = false,
}) {
  const navigate = useNavigate();
  const routeLocation = useLocation();

  const isTaxi = routeLocation.pathname.includes('/taxi');
  const theme = {
    activeBg: isTaxi ? 'bg-[#2563eb]' : 'bg-[#d82c23]',
    activeHex: isTaxi ? '#2563eb' : '#d82c23',
    inactiveHex: isTaxi ? '#09101d' : '#6e0d09',
    containerHex: isTaxi ? '#0b1528' : '#9c1c16',
  };

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('food_user_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const {
    items: broadcastNotifications,
    unreadCount: broadcastUnreadCount,
    dismiss: dismissBroadcastNotification,
  } = useNotificationInbox("user", { limit: 20 });

  useEffect(() => {
    const syncNotifications = () => {
      const saved = localStorage.getItem('food_user_notifications');
      setNotifications(saved ? JSON.parse(saved) : []);
    };

    // Listen for updates from the main Notifications page
    window.addEventListener('notificationsUpdated', syncNotifications);
    // Also listen for new notifications being added via listeners in Notifications.jsx (indirectly via localStorage update)
    // But since localStorage doesn't fire events on same window, we can use a custom event or a simple interval if needed.
    // However, the Notifications.jsx already multi-dispatches.

    return () => window.removeEventListener('notificationsUpdated', syncNotifications);
  }, []);

  const festCategories = [
    { id: "food", name: "Food", icon: foodIcon, bgColor: "bg-white dark:bg-[#1a1a1a]" },
    { id: "quick", name: "Quick", icon: quickIcon, bgColor: "bg-white dark:bg-[#1a1a1a]" },
    { id: "taxi", name: "Taxi", icon: taxiIcon, bgColor: "bg-white dark:bg-[#1a1a1a]" },
    { id: "hotel", name: "Hotel", icon: hotelIcon, bgColor: "bg-white dark:bg-[#1a1a1a]" },
  ];

  const mergedNotifications = useMemo(() => {
    const localItems = Array.isArray(notifications)
      ? notifications.map((item) => ({ ...item, source: "local" }))
      : [];
    const broadcastItems = (broadcastNotifications || []).map((item) => ({
      ...item,
      source: "broadcast",
      time: item.createdAt
        ? new Date(item.createdAt).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        : "Just now",
      type: "broadcast",
      icon: "Bell",
      iconColor: "text-blue-600",
    }));

    return [...broadcastItems, ...localItems].sort(
      (a, b) =>
        new Date(b.createdAt || b.timestamp || 0).getTime() -
        new Date(a.createdAt || a.timestamp || 0).getTime()
    );
  }, [broadcastNotifications, notifications]);

  const unreadCount = notifications.filter(n => !n.read).length + broadcastUnreadCount;

  const handleDeleteNotification = (id, source = "local") => {
    if (source === "broadcast") {
      dismissBroadcastNotification(id);
      return;
    }
    setNotifications((prev) => {
      const next = prev.filter((notification) => notification.id !== id);
      localStorage.setItem('food_user_notifications', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('notificationsUpdated', { detail: { count: next.filter((n) => !n.read).length } }));
      return next;
    });
  };

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 95);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const slideBanners = [
    {
      id: 0,
      bg: "bg-gradient-to-r from-[#ff5100]/40 to-[#e11d48]/40",
      content: (
        <div className="flex justify-between items-center h-full px-4 w-full">
          <div className="flex flex-col items-start justify-center w-[60%]">
            <div className="text-[12px] font-bold text-white/80 tracking-widest uppercase mb-0.5">FLAT</div>
            <div className="text-[28px] leading-[1] font-black text-white tracking-tight mb-0.5 drop-shadow-md">50% OFF</div>
            <div className="text-[11px] font-medium text-white/90">with FREE delivery</div>
          </div>
          <div className="w-[40%] flex justify-end">
            <img src={foodIcon} alt="offer" className="w-[85px] h-[85px] object-contain drop-shadow-2xl scale-110" />
          </div>
        </div>
      )
    },
    {
      id: 1,
      bg: "bg-gradient-to-r from-[#e11d48]/40 to-[#b30707]/40",
      content: (
        <div className="flex justify-between items-center h-full px-4 w-full">
          <div className="flex flex-col items-start w-[65%]">
            <div className="text-[24px] leading-[1.1] font-black text-white tracking-tight mb-0.5">Flat ₹150 OFF</div>
            <div className="text-[11px] font-bold text-gray-200 opacity-90">on Premium Dining restaurants</div>
          </div>
          <div className="w-[35%] flex justify-end">
            <Sparkles className="w-[60px] h-[60px] text-white/30 fill-white/20 drop-shadow-2xl" strokeWidth={1} />
          </div>
        </div>
      )
    },
    {
      id: 2,
      bg: "bg-gradient-to-r from-[#ff5100]/40 to-[#b30707]/40",
      content: (
        <div className="flex justify-between items-center h-full px-4 w-full">
          <div className="flex flex-col items-start w-[65%]">
            <div className="text-[24px] leading-[1.1] font-black text-white tracking-tight mb-0.5">Free Delivery</div>
            <div className="text-[11px] font-bold text-gray-200 opacity-90">on all fast food orders above ₹199</div>
          </div>
          <div className="w-[35%] flex justify-end">
            <Gift className="w-[60px] h-[60px] text-white/30 fill-white/20 drop-shadow-2xl" strokeWidth={1} />
          </div>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="relative w-full overflow-hidden">
        {/* Dynamic Slide Background Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div
            className="flex h-full w-full transition-all duration-1000 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slideBanners.map((banner) => (
              <div
                key={banner.id}
                className={`w-full h-full shrink-0 bg-gradient-to-r ${banner.id === 0
                    ? 'from-[#ff5100] to-[#e11d48]'
                    : banner.id === 1
                      ? 'from-[#e11d48] to-[#b30707]'
                      : 'from-[#ff5100] to-[#b30707]'
                  }`}
              />
            ))}
          </div>
        </div>

        {/* 1. Location / Bell / Veg bar + Option Tabs */}
        <div
          className="relative w-full px-4 pt-5 pb-0 flex flex-col gap-4 z-30 bg-transparent"
          style={{
            fontFamily: "'Sora', sans-serif"
          }}
        >
          <div className="flex items-center justify-between gap-3">
            {(() => {
              const addressToShow = savedAddressText || (location?.area && location?.city
                ? `${location.area}, ${location.city}`
                : location?.area || location?.city || "");

              return (
                <div
                  className="flex items-center gap-2.5 cursor-pointer group min-w-0 flex-1 select-none"
                  onClick={handleLocationClick}
                >
                  <div className="bg-white/15 p-2 rounded-xl backdrop-blur-md border border-white/25 hover:scale-105 active:scale-95 transition-all shadow-md flex-shrink-0 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-white animate-bounce" style={{ animationDuration: '3s' }} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-extrabold text-white/80 uppercase tracking-widest drop-shadow-sm">Deliver to</span>
                      <ChevronDown className="h-3 w-3 text-white/80 transition-transform duration-300 group-hover:rotate-180" />
                    </div>
                    {addressToShow ? (
                      <span className="text-sm font-extrabold text-white truncate drop-shadow-md max-w-full">
                        {addressToShow}
                      </span>
                    ) : (
                      <span className="text-xs font-black text-yellow-305 hover:text-yellow-400 underline decoration-dotted transition-colors flex items-center gap-1 drop-shadow-md">
                        Add delivery location
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center gap-2 flex-shrink-0 relative z-20">
              <Popover>
                <PopoverTrigger asChild>
                  <div className="h-10 w-10 relative flex items-center justify-center rounded-full bg-white/15 backdrop-blur-md border border-white/25 shadow-sm cursor-pointer active:scale-95 transition-all hover:bg-white/25 flex-shrink-0">
                    <Bell className="h-[22px] w-[22px] text-white drop-shadow-sm" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-yellow-400 rounded-full border-2 border-white animate-pulse" />
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 overflow-hidden border-none shadow-2xl rounded-2xl mt-2" align="end">
                  <div className="bg-white dark:bg-gray-900">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Notifications
                        {unreadCount > 0 && (
                          <Badge variant="secondary" className="bg-primary-orange/10 text-accent-orange border-none text-[10px] h-4">
                            {unreadCount} New
                          </Badge>
                        )}
                      </h3>
                      <Link to="/food/user/notifications" className="text-xs font-bold text-accent-orange hover:text-accent-orange/90">
                        {mergedNotifications.length > 0 ? "View All" : ""}
                      </Link>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {mergedNotifications.length > 0 ? (
                        mergedNotifications.slice(0, 5).map((notif) => {
                          const Icon = ICON_MAP[notif.icon] || Bell;
                          return (
                            <div
                              key={notif.id}
                              className={`p-4 flex items-start gap-3 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${!notif.read ? 'bg-primary-orange/5/20' : ''}`}
                            >
                              <div className={`mt-1 p-2 rounded-full ${notif.type === "order" ? "bg-green-100/50 text-green-600" : "bg-primary-orange/10/50 text-accent-orange"}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{notif.title}</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{notif.time}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDeleteNotification(notif.id, notif.source);
                                      }}
                                      className="rounded-full p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                  {notif.message}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-8 text-center flex flex-col items-center gap-2">
                          <BellOff className="h-10 w-10 text-gray-200" />
                          <p className="text-xs text-gray-400 font-medium">All caught up!</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-gray-50/50 dark:bg-gray-800/50 text-center">
                      <Link to="/food/user/notifications" className="text-xs font-bold text-gray-400 hover:text-gray-600">
                        {mergedNotifications.length > 0 ? "Manage Settings" : "Check Notifications Page"}
                      </Link>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Veg Mode Toggle */}
              <div
                className="flex items-center gap-1.5 h-10 bg-white/15 backdrop-blur-md rounded-full px-2.5 border border-white/25 shadow-sm cursor-pointer hover:bg-white/25 active:scale-95 transition-all flex-shrink-0"
                onClick={() => handleVegModeChange && handleVegModeChange(!isVegMode)}
                ref={vegModeToggleRef}
              >
                <div className={`flex items-center justify-center p-[2px] rounded-sm border ${isVegMode ? 'border-green-600' : 'border-gray-500'} bg-white flex-shrink-0`}>
                  <div className={`w-[6px] h-[6px] rounded-full ${isVegMode ? 'bg-green-600' : 'bg-gray-500'}`} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-tight text-white drop-shadow-sm hidden xs:inline`}>
                  Veg
                </span>
                <div className={`w-6 h-3.5 rounded-full relative transition-colors ml-0.5 flex-shrink-0 ${isVegMode ? 'bg-green-500' : 'bg-gray-450/80'}`}>
                  <div className={`absolute top-[1.5px] w-2.5 h-2.5 rounded-full bg-white transition-transform ${isVegMode ? 'translate-x-[11px]' : 'translate-x-[1.5px]'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Option Tabs (Food & Taxi) - animated entrance */}
          <motion.div
            className="relative w-full z-20 overflow-visible"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
          >
            <div
              className="custom-tab-container overflow-visible"
              style={{
                '--tab-container-bg': 'transparent',
                '--active-tab-bg': theme.activeHex,
                '--inactive-tab-bg': 'rgba(0, 0, 0, 0.2)',
                backgroundColor: 'transparent'
              }}
            >
              {/* Food Button */}
              <button
                onClick={() => navigate('/food/user')}
                className={`custom-tab overflow-visible ${routeLocation.pathname.includes('/food')
                    ? 'custom-tab-active'
                    : 'custom-tab-inactive'
                  }`}
              >
                <img src={foodIcon} alt="K9Food" className="custom-tab-icon" />
                <span>K9Food</span>
              </button>

              {/* Taxi Button */}
              <button
                onClick={() => navigate('/taxi/user')}
                className={`custom-tab overflow-visible ${routeLocation.pathname.includes('/taxi')
                    ? 'custom-tab-active'
                    : 'custom-tab-inactive'
                  }`}
              >
                <img src={taxiIcon} alt="K9Rides" className="custom-tab-icon custom-tab-icon-taxi" />
                <span>K9Rides</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 2. TRUE VIEWPORT-STICKY SEARCH BAR (Turns white on scroll) */}
      <div
        className={`sticky top-0 z-[70] transition-all duration-300 pt-2 pb-3 px-4 ${isScrolled
            ? 'shadow-[0_4px_20px_rgba(0,0,0,0.06)] border-b border-gray-100/80'
            : 'border-b border-transparent'
          }`}
        style={{
          fontFamily: "'Sora', sans-serif",
          background: isScrolled
            ? 'rgba(255, 255, 255, 0.98)'
            : isTaxi
              ? theme.activeHex
              : `linear-gradient(to right, ${currentSlide === 0 ? '#ff5100, #e11d48' : currentSlide === 1 ? '#e11d48, #b30707' : '#ff5100, #b30707'})`
        }}
      >
        <div
          className={`relative rounded-2xl flex items-center px-4 py-2.5 border border-transparent cursor-pointer active:scale-[0.99] transition-all duration-300 group ${isScrolled
              ? 'bg-gray-100/80 hover:bg-gray-100 shadow-none'
              : 'bg-white shadow-[0_4px_15px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)]'
            }`}
          onClick={handleSearchFocus}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleSearchFocus();
            }
          }}
        >
          <Search className="h-5 w-5 text-gray-400 mr-3 group-hover:text-[#ff6d00] group-hover:scale-110 transition-all duration-300" strokeWidth={2.2} />
          <div className="flex-1 overflow-hidden relative h-5">
            <AnimatePresence mode="wait">
              <motion.span
                key={placeholderIndex}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="absolute inset-0 text-sm font-semibold text-gray-500 truncate"
              >
                {placeholders?.[placeholderIndex] || 'Search for dishes, restaurants, cuisines...'}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="bg-[#ff6d00]/5 p-2 rounded-full border border-[#ff6d00]/10 ml-2 group-hover:bg-[#ff6d00]/10 transition-all flex items-center justify-center hover:scale-105 active:scale-95 duration-200">
            <Mic className="h-4 w-4 text-[#ff6d00]" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Bottom Container: Banners */}
      <div className="relative w-full overflow-hidden shadow-[0_12px_40px_rgba(238,63,36,0.18)]">
        {/* Dynamic Slide Background Layer (Bottom) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div
            className="flex h-full w-full transition-all duration-1000 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slideBanners.map((banner) => (
              <div
                key={banner.id}
                className={`w-full h-full shrink-0 bg-gradient-to-r ${banner.id === 0
                    ? 'from-[#ff5100] to-[#e11d48]'
                    : banner.id === 1
                      ? 'from-[#e11d48] to-[#b30707]'
                      : 'from-[#ff5100] to-[#b30707]'
                  }`}
              />
            ))}
          </div>
        </div>

        {/* 3. Banners Content (Rendering directly on the animated gradient background) */}
        <div
          className="relative w-full overflow-hidden h-[130px] pb-4 pt-2 flex flex-col z-30 bg-transparent"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          <div
            className="flex h-full transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slideBanners.map((banner) => (
              <div
                key={banner.id}
                className="w-full h-full shrink-0 flex items-center justify-between px-6"
              >
                {banner.content}
              </div>
            ))}
          </div>

          {/* Carousel Pager Dots */}
          <div className="relative mt-2 flex justify-center gap-1.5 z-20">
            {slideBanners.map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-white w-4' : 'bg-white/40 w-1.5'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
