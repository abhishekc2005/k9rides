import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { userService } from '../services/userService';

const getServiceAction = (serviceType, navigate) => {
  switch (serviceType?.toLowerCase()) {
    case 'normal': return () => navigate('/taxi/user/ride/select-location');
    case 'outstation': return () => navigate('/taxi/user/ride/select-location?rideType=outstation');
    // case 'rental': return () => navigate('/taxi/user/rental/select'); // rental commented out as per previous request
    case 'bid': return () => navigate('/taxi/user/ride/select-location?rideType=bid');
    case 'pooling': return () => navigate('/taxi/user/pooling');
    default: return () => navigate('/taxi/user/ride/select-location');
  }
};

const ServiceGrid = () => {
  const navigate = useNavigate();
  const [appModules, setAppModules] = useState([]);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await userService.getAppModules();
        const data = res.data?.data?.results || res.data?.results || (Array.isArray(res.data?.data) ? res.data.data : []);
        setAppModules(data);
      } catch (err) {
        console.error("Failed to fetch app modules", err);
      }
    };
    fetchModules();
  }, []);

  const services = useMemo(() => {
    return appModules
      .filter(m => m.active !== false && m.service_type?.toLowerCase() !== 'rental')
      .sort((a, b) => (a.order_by || 99) - (b.order_by || 99))
      .map(m => ({
        id: m._id || m.id,
        title: m.name,
        adminIcon: m.mobile_menu_icon,
        action: getServiceAction(m.service_type, navigate)
      }));
  }, [navigate, appModules]);

  return (
    <div className="px-5 mb-6">
      <div className="grid grid-cols-3 gap-3">
        {services.map((service, index) => {
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={service.action}
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white shadow-[0_8px_20px_rgba(15,23,42,0.06)] border border-slate-100 cursor-pointer hover:shadow-lg transition-all"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-50 border border-gray-100 overflow-hidden p-2 text-slate-400">
                {service.adminIcon ? (
                  <img src={service.adminIcon} alt={service.title} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-[10px] font-bold">NO IMG</span>
                )}
              </div>
              <span className="text-[11px] font-black tracking-tight text-slate-700">{service.title}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceGrid;
