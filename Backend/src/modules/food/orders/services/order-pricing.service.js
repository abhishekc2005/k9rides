import mongoose from 'mongoose';
import { FoodOrder } from '../models/order.model.js';
import { FoodRestaurant } from '../../restaurant/models/restaurant.model.js';
import { FoodFeeSettings } from '../../admin/models/feeSettings.model.js';
import { FoodOffer } from '../../admin/models/offer.model.js';
import { FoodOfferUsage } from '../../admin/models/offerUsage.model.js';
import { FoodDeliverySurgeZone } from '../../admin/models/deliverySurgeZone.model.js';
import { FoodDeliveryCommissionRule } from '../../admin/models/deliveryCommissionRule.model.js';
import { ValidationError } from '../../../../core/auth/errors.js';
import { haversineKm } from './order.helpers.js';

function extractCoords(addressLike) {
  const coords = addressLike?.location?.coordinates;
  if (!Array.isArray(coords) || coords.length !== 2) return null;
  const [lng, lat] = coords;
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return null;
  return [Number(lng), Number(lat)];
}

async function resolveDistanceRule(distanceKm) {
  if (!Number.isFinite(Number(distanceKm)) || Number(distanceKm) < 0) return null;
  const rules = await FoodDeliveryCommissionRule.find({ status: { $ne: false } }).lean();
  if (!rules.length) return null;
  const d = Number(distanceKm);
  const matched = rules.find((r) => {
    const min = Number(r.minDistance || 0);
    const max = r.maxDistance == null ? null : Number(r.maxDistance);
    return d >= min && (max == null || d < max);
  });
  return matched || null;
}

function resolvePriceSlabByOrderValue(priceSlabs, orderValue) {
  if (!Array.isArray(priceSlabs)) return null;
  const subtotal = Number(orderValue || 0);
  return (
    priceSlabs.find((s) => {
      if (s?.isActive === false) return false;
      const min = Number(s.minOrderValue);
      const max = Number(s.maxOrderValue);
      if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
      return subtotal >= min && subtotal < max;
    }) || null
  );
}

export async function calculateOrderPricing(userId, dto) {
  const restaurant = await FoodRestaurant.findById(dto.restaurantId)
    .select("status zoneId location")
    .lean();
  if (!restaurant) throw new ValidationError("Restaurant not found");
  if (restaurant.status !== "approved")
    throw new ValidationError("Restaurant not available");

  const items = Array.isArray(dto.items) ? dto.items : [];
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
    0,
  );

  const feeDoc = await FoodFeeSettings.findOne({ isActive: true })
    .sort({ createdAt: -1 })
    .lean();
  const feeSettings = feeDoc || {
    deliveryFee: 25,
    deliveryFeeRanges: [],
    freeDeliveryThreshold: 149,
    platformFee: 5,
    gstRate: 5,
  };

  const packagingFee = 0;
  const platformFee = Number(feeSettings.platformFee || 0);

  const mode = String(feeSettings.deliveryFeeComputationMode || 'order_value_range');
  let deliveryFee = 0;
  let deliveryFeeBreakdown = null;
  let adminDeliveryCommissionPercent = 0;
  let adminDeliveryCommissionAmount = 0;
  let riderDeliveryEarningAfterAdminCommission = 0;
  let adminDeliveryCommissionEnabled = false;
  if (mode === 'distance_order_value') {
    const restCoords = extractCoords(restaurant);
    const customerCoords = extractCoords(dto?.address || dto?.deliveryAddress);
    if (!restCoords && !customerCoords) {
      throw new ValidationError('Restaurant and customer locations are required for distance-based delivery fee calculation');
    }
    if (!restCoords) {
      throw new ValidationError('Restaurant location is required for distance-based delivery fee calculation');
    }
    if (!customerCoords) {
      throw new ValidationError('Customer location is required for distance-based delivery fee calculation');
    }
    const [rLng, rLat] = restCoords;
    const [cLng, cLat] = customerCoords;
    const distanceKm = haversineKm(rLat, rLng, cLat, cLng);
    const distanceRule = await resolveDistanceRule(distanceKm);
    if (!distanceRule) {
      throw new ValidationError('No active distance slab found for this delivery distance');
    }
    const mappedRules = Array.isArray(feeSettings.distanceOrderDeliveryFeeRules)
      ? feeSettings.distanceOrderDeliveryFeeRules
      : [];
    const commissionRows = Array.isArray(feeSettings.distanceSlabAdminDeliveryCommission)
      ? feeSettings.distanceSlabAdminDeliveryCommission
      : [];
    const nested = mappedRules.find((r) => String(r.distanceRuleId) === String(distanceRule._id));
    const adminCommissionRow = commissionRows.find((r) => String(r.distanceRuleId) === String(distanceRule._id));
    const matchedPriceSlab = resolvePriceSlabByOrderValue(nested?.priceSlabs || [], subtotal);
    if (!matchedPriceSlab) {
      const fallbackFixedPayout = Math.round((Number(distanceRule?.basePayout || 0) * 100)) / 100;
      deliveryFee = fallbackFixedPayout > 0 ? fallbackFixedPayout : 0;
      adminDeliveryCommissionEnabled = adminCommissionRow?.isEnabled === true;
      adminDeliveryCommissionPercent = adminDeliveryCommissionEnabled
        ? Math.round((Number(adminCommissionRow?.adminDeliveryCommissionPercent || 0) * 100)) / 100
        : 0;
      adminDeliveryCommissionAmount = Math.round((deliveryFee * (adminDeliveryCommissionPercent / 100)) * 100) / 100;
      riderDeliveryEarningAfterAdminCommission = Math.round(Math.max(0, deliveryFee - adminDeliveryCommissionAmount) * 100) / 100;
      deliveryFeeBreakdown = {
        source: 'distance_order_value',
        distanceKm: Math.round(Number(distanceKm || 0) * 100) / 100,
        distanceRuleId: String(distanceRule._id),
        distanceRange: {
          minDistance: Number(distanceRule.minDistance || 0),
          maxDistance: distanceRule.maxDistance == null ? null : Number(distanceRule.maxDistance)
        },
        orderValue: subtotal,
        matchedPriceSlab: null,
        fixedPayoutFallback: fallbackFixedPayout,
        appliedDeliveryFee: Number(deliveryFee || 0),
        adminDeliveryCommissionPercent,
        adminDeliveryCommissionAmount,
        riderDeliveryEarningAfterAdminCommission,
        noPriceSlabMatch: true,
        feeSource: fallbackFixedPayout > 0 ? 'distance_fixed_payout_fallback' : 'free_no_slab_no_fixed'
      };
    } else {
      const perKmRate = Number(matchedPriceSlab.deliveryFee || 0);
      const chargeableDistanceKm = Number(distanceKm || 0);
      deliveryFee = Math.round(Math.max(0, perKmRate * chargeableDistanceKm) * 100) / 100;
      adminDeliveryCommissionEnabled = adminCommissionRow?.isEnabled === true;
      adminDeliveryCommissionPercent = adminDeliveryCommissionEnabled
        ? Math.round((Number(adminCommissionRow?.adminDeliveryCommissionPercent || 0) * 100)) / 100
        : 0;
      adminDeliveryCommissionAmount = Math.round((deliveryFee * (adminDeliveryCommissionPercent / 100)) * 100) / 100;
      riderDeliveryEarningAfterAdminCommission = Math.round(Math.max(0, deliveryFee - adminDeliveryCommissionAmount) * 100) / 100;
      deliveryFeeBreakdown = {
        source: 'distance_order_value',
        distanceKm: Math.round(Number(distanceKm || 0) * 100) / 100,
        distanceRuleId: String(distanceRule._id),
        distanceRange: {
          minDistance: Number(distanceRule.minDistance || 0),
          maxDistance: distanceRule.maxDistance == null ? null : Number(distanceRule.maxDistance)
        },
        orderValue: subtotal,
        matchedPriceSlab: {
          minOrderValue: Number(matchedPriceSlab.minOrderValue || 0),
          maxOrderValue: Number(matchedPriceSlab.maxOrderValue || 0),
          perKmRate: Number(perKmRate || 0)
        },
        appliedDeliveryFee: Number(deliveryFee || 0),
        feeComputation: 'per_km_x_distance',
        adminDeliveryCommissionPercent,
        adminDeliveryCommissionAmount,
        riderDeliveryEarningAfterAdminCommission,
        noPriceSlabMatch: false,
        feeSource: 'order_value_slab_per_km'
      };
    }
  } else {
    const freeThreshold = Number(feeSettings.freeDeliveryThreshold || 0);
    if (
      Number.isFinite(freeThreshold) &&
      freeThreshold > 0 &&
      subtotal >= freeThreshold
    ) {
      deliveryFee = 0;
    } else {
      const ranges = Array.isArray(feeSettings.deliveryFeeRanges)
        ? [...feeSettings.deliveryFeeRanges]
        : [];
      if (ranges.length > 0) {
        ranges.sort((a, b) => Number(a.min) - Number(b.min));
        let matched = null;
        for (let i = 0; i < ranges.length; i += 1) {
          const r = ranges[i] || {};
          const min = Number(r.min);
          const max = Number(r.max);
          const fee = Number(r.fee);
          if (
            !Number.isFinite(min) ||
            !Number.isFinite(max) ||
            !Number.isFinite(fee)
          ) {
            continue;
          }
          const isLast = i === ranges.length - 1;
          const inRange = isLast
            ? subtotal >= min && subtotal <= max
            : subtotal >= min && subtotal < max;
          if (inRange) {
            matched = fee;
            break;
          }
        }
        deliveryFee = Number.isFinite(matched)
          ? matched
          : Number(feeSettings.deliveryFee || 0);
      } else {
        deliveryFee = Number(feeSettings.deliveryFee || 0);
      }
    }
  }
  if (mode !== 'distance_order_value') {
    adminDeliveryCommissionPercent = 0;
    adminDeliveryCommissionAmount = 0;
    riderDeliveryEarningAfterAdminCommission = Math.round(Math.max(0, deliveryFee) * 100) / 100;
    adminDeliveryCommissionEnabled = false;
  }

  const gstRate = Number(feeSettings.gstRate || 0);
  const tax =
    Number.isFinite(gstRate) && gstRate > 0
      ? Math.round(subtotal * (gstRate / 100))
      : 0;

  let discount = 0;
  let appliedCoupon = null;
  const codeRaw = dto.couponCode
    ? String(dto.couponCode).trim().toUpperCase()
    : "";

  if (codeRaw) {
    const now = new Date();
    const offer = await FoodOffer.findOne({ couponCode: codeRaw }).lean();
    if (offer) {
      const statusOk = offer.status === "active";
      const startOk = !offer.startDate || now >= new Date(offer.startDate);
      const endOk = !offer.endDate || now < new Date(offer.endDate);
      const scopeOk =
        offer.restaurantScope !== "selected" ||
        String(offer.restaurantId || "") === String(dto.restaurantId || "");
      const minOk = subtotal >= (Number(offer.minOrderValue) || 0);
      let usageOk = true;
      if (
        Number(offer.usageLimit) > 0 &&
        Number(offer.usedCount || 0) >= Number(offer.usageLimit)
      ) {
        usageOk = false;
      }

      let perUserOk = true;
      if (userId && Number(offer.perUserLimit) > 0) {
        const usage = await FoodOfferUsage.findOne({
          offerId: offer._id,
          userId,
        }).lean();
        if (usage && Number(usage.count) >= Number(offer.perUserLimit)) {
          perUserOk = false;
        }
      }

      let firstOrderOk = true;
      if (userId && offer.customerScope === "first-time") {
        const c = await FoodOrder.countDocuments({
          userId: new mongoose.Types.ObjectId(userId),
        });
        firstOrderOk = c === 0;
      }
      if (userId && offer.isFirstOrderOnly === true) {
        const c2 = await FoodOrder.countDocuments({
          userId: new mongoose.Types.ObjectId(userId),
        });
        if (c2 > 0) firstOrderOk = false;
      }

      const allowed =
        statusOk &&
        startOk &&
        endOk &&
        scopeOk &&
        minOk &&
        usageOk &&
        perUserOk &&
        firstOrderOk;

      if (allowed) {
        if (offer.discountType === "percentage") {
          const raw = subtotal * (Number(offer.discountValue) / 100);
          const capped = Number(offer.maxDiscount)
            ? Math.min(raw, Number(offer.maxDiscount))
            : raw;
          discount = Math.max(0, Math.min(subtotal, Math.floor(capped)));
        } else {
          discount = Math.max(
            0,
            Math.min(subtotal, Math.floor(Number(offer.discountValue) || 0)),
          );
        }
        appliedCoupon = { code: codeRaw, discount };
      }
    }
  }

  const zoneIdForSurge = dto?.zoneId && mongoose.Types.ObjectId.isValid(dto.zoneId)
    ? String(dto.zoneId)
    : (restaurant?.zoneId ? String(restaurant.zoneId) : null);
  let surgeAmount = 0;
  if (zoneIdForSurge) {
    const surgeConfig = await FoodDeliverySurgeZone.findOne({ zoneId: zoneIdForSurge }).lean();
    if (surgeConfig?.isEnabled) {
      surgeAmount = Math.round((Number(surgeConfig.surgeAmount || 0) * 100)) / 100;
    }
  }

  const total = Math.max(
    0,
    subtotal + packagingFee + deliveryFee + platformFee + tax + surgeAmount - discount,
  );

  return {
    pricing: {
      subtotal,
      tax,
      packagingFee,
      deliveryFee,
      deliveryFeeBreakdown,
      adminDeliveryCommissionEnabled,
      adminDeliveryCommissionPercent,
      adminDeliveryCommissionAmount,
      riderDeliveryEarningAfterAdminCommission,
      platformFee,
      surgeAmount,
      discount,
      total,
      currency: "INR",
      couponCode: appliedCoupon?.code || codeRaw || null,
      appliedCoupon,
    },
  };
}
