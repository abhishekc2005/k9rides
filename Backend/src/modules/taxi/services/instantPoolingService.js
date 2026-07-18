import mongoose from 'mongoose';
import { InstantPoolGroup } from '../admin/models/InstantPoolGroup.js';
import { Ride } from '../user/models/Ride.js';
import { Driver } from '../driver/models/Driver.js';
import { User } from '../user/models/User.js';
import { findOptimalRouteSequence } from './routeOptimizer.js';
import { getInstantPoolingSettings } from './transportSettingsService.js';
import { emitToRoom, getUserRoom, getDriverRoom, applyDriverWalletAdjustmentByReference } from './dispatchService.js';
import { getRideRoom } from './rideService.js';

/**
 * Audit log helper
 */
const auditLog = (event, metadata = {}) => {
  console.log(`[POOLING_AUDIT] Event: ${event}, Time: ${new Date().toISOString()}, Data:`, JSON.stringify(metadata));
};

/**
 * Creates a new pool group when the first passenger's request is accepted by a driver.
 */
export const createPoolGroup = async (driverId, vehicleTypeId, firstRide) => {
  const settings = await getInstantPoolingSettings();
  const driver = await Driver.findById(driverId);

  const newGroup = new InstantPoolGroup({
    driverId,
    vehicleTypeId,
    activeRides: [firstRide._id],
    totalCapacity: driver?.maxPoolSeats || 4,
    occupiedSeats: firstRide.poolSeats || 1,
    status: 'created',
    routeVersion: 1,
  });

  const optimalSeq = findOptimalRouteSequence(
    driver.location.coordinates,
    [firstRide],
    {
      maxDetourMeters: Number(settings.max_detour_meters || 5000),
      maxEtaIncreaseMinutes: Number(settings.max_eta_increase_minutes || 15),
    }
  );

  newGroup.routeSequence = optimalSeq;
  await newGroup.save();

  // Update Driver status
  await Driver.findByIdAndUpdate(driverId, {
    isOnRide: true,
    activePoolGroupId: newGroup._id,
    poolOccupiedSeats: firstRide.poolSeats || 1,
    activePoolRideCount: 1,
  });

  // Update first ride status
  firstRide.poolGroupId = newGroup._id;
  firstRide.status = 'accepted';
  firstRide.liveStatus = 'accepted';
  firstRide.driverId = driverId;
  firstRide.routeVersion = 1;
  await firstRide.save();

  auditLog('Pool Created', { poolGroupId: newGroup._id, driverId, rideId: firstRide._id });

  // Broadcast socket events
  emitToRoom(getDriverRoom(driverId), 'pool.created', { poolGroupId: newGroup._id, routeVersion: 1 });
  broadcastPoolUpdate(newGroup);

  return newGroup;
};

/**
 * Adds a passenger ride to an existing pool group if detour and seats permit.
 */
export const addRideToPoolGroup = async (poolGroupId, newRide) => {
  const group = await InstantPoolGroup.findById(poolGroupId).populate('activeRides');
  if (!group || group.status === 'completed' || group.status === 'cancelled') {
    return false;
  }

  const driver = await Driver.findById(group.driverId);
  const settings = await getInstantPoolingSettings();

  const requiredSeats = newRide.poolSeats || 1;
  const currentOccupied = group.occupiedSeats || 0;
  const maxCapacity = group.totalCapacity || 4;

  if (currentOccupied + requiredSeats > maxCapacity) {
    return false;
  }

  // Populate active rides with user details for sequence name rendering
  const populatedActiveRides = await Ride.find({
    _id: { $in: [...group.activeRides.map(r => r._id), newRide._id] }
  }).populate('userId', 'name');

  const optimalSeq = findOptimalRouteSequence(
    driver.location.coordinates,
    populatedActiveRides,
    {
      maxDetourMeters: Number(settings.max_detour_meters || 5000),
      maxEtaIncreaseMinutes: Number(settings.max_eta_increase_minutes || 15),
    }
  );

  // If sequence optimization returns empty, detour rules were violated
  if (optimalSeq.length === 0) {
    return false;
  }

  group.activeRides.push(newRide._id);
  group.occupiedSeats += requiredSeats;
  group.routeSequence = optimalSeq;
  group.routeVersion += 1;
  group.status = 'active';
  await group.save();

  // Update driver details
  await Driver.findByIdAndUpdate(group.driverId, {
    poolOccupiedSeats: group.occupiedSeats,
    activePoolRideCount: group.activeRides.length,
  });

  // Link ride to pool group
  newRide.poolGroupId = group._id;
  newRide.status = 'accepted';
  newRide.liveStatus = 'accepted';
  newRide.driverId = group.driverId;
  newRide.routeVersion = group.routeVersion;
  await newRide.save();

  // Increment route version on existing rides too
  await Ride.updateMany(
    { _id: { $in: group.activeRides } },
    { $set: { routeVersion: group.routeVersion } }
  );

  auditLog('Passenger Joined', { poolGroupId: group._id, rideId: newRide._id });

  // Emit joins and updates
  emitToRoom(getDriverRoom(group.driverId), 'pool.member.joined', {
    rideId: String(newRide._id),
    poolGroupId: String(group._id),
    routeVersion: group.routeVersion,
  });

  for (const ride of group.activeRides) {
    if (String(ride._id) !== String(newRide._id)) {
      emitToRoom(getRideRoom(ride._id), 'pool.member.joined', {
        message: 'Another passenger has joined your shared ride.',
        routeVersion: group.routeVersion,
      });
    }
  }

  broadcastPoolUpdate(group);
  return true;
};

/**
 * Removes a passenger ride from a pool group (cancellation or reject).
 */
export const removeRideFromPoolGroup = async (poolGroupId, rideId, cancelReason = 'cancelled') => {
  const group = await InstantPoolGroup.findById(poolGroupId);
  if (!group) return;

  const targetRide = await Ride.findById(rideId);
  const releasedSeats = targetRide?.poolSeats || 1;

  group.activeRides = group.activeRides.filter(id => String(id) !== String(rideId));
  group.occupiedSeats = Math.max(0, group.occupiedSeats - releasedSeats);
  group.routeVersion += 1;

  // Clean ride document
  if (targetRide) {
    targetRide.poolGroupId = null;
    targetRide.status = 'cancelled';
    targetRide.liveStatus = 'cancelled';
    await targetRide.save();
  }

  auditLog('Passenger Left', { poolGroupId, rideId, reason: cancelReason });

  if (group.activeRides.length === 0) {
    // Shutdown pool group entirely
    group.status = 'completed';
    await group.save();

    await Driver.findByIdAndUpdate(group.driverId, {
      isOnRide: false,
      activePoolGroupId: null,
      poolOccupiedSeats: 0,
      activePoolRideCount: 0,
    });

    emitToRoom(getDriverRoom(group.driverId), 'pool.closed', { poolGroupId, routeVersion: group.routeVersion });
    auditLog('Pool Closed', { poolGroupId });
  } else {
    // Re-optimize route with remaining rides
    const driver = await Driver.findById(group.driverId);
    const settings = await getInstantPoolingSettings();

    const remainingRides = await Ride.find({ _id: { $in: group.activeRides } }).populate('userId', 'name');

    const optimalSeq = findOptimalRouteSequence(
      driver.location.coordinates,
      remainingRides,
      {
        maxDetourMeters: Number(settings.max_detour_meters || 5000),
        maxEtaIncreaseMinutes: Number(settings.max_eta_increase_minutes || 15),
      }
    );

    group.routeSequence = optimalSeq;
    await group.save();

    // Update driver seats
    await Driver.findByIdAndUpdate(group.driverId, {
      poolOccupiedSeats: group.occupiedSeats,
      activePoolRideCount: group.activeRides.length,
    });

    // Update versions on remaining rides
    await Ride.updateMany(
      { _id: { $in: group.activeRides } },
      { $set: { routeVersion: group.routeVersion } }
    );

    // Notify driver and remaining users
    emitToRoom(getDriverRoom(group.driverId), 'pool.member.left', {
      rideId,
      poolGroupId,
      routeVersion: group.routeVersion,
    });

    for (const ride of remainingRides) {
      emitToRoom(getRideRoom(ride._id), 'pool.member.left', {
        message: 'A co-rider left the shared ride.',
        routeVersion: group.routeVersion,
      });
    }

    broadcastPoolUpdate(group);
  }
};

/**
 * Verifies individual passenger boarding OTP.
 */
export const verifyPassengerOtp = async (rideId, otpInput) => {
  const ride = await Ride.findById(rideId);
  if (!ride) throw new Error('Ride not found');

  if (String(ride.otp) !== String(otpInput)) {
    throw new Error('Invalid verification OTP');
  }

  ride.status = 'ongoing';
  ride.liveStatus = 'started';
  ride.startedAt = new Date();
  await ride.save();

  auditLog('OTP Verified', { rideId });

  if (ride.poolGroupId) {
    const group = await InstantPoolGroup.findById(ride.poolGroupId);
    if (group) {
      // Mark pickup stop as completed
      group.routeSequence = group.routeSequence.map(stop => {
        if (String(stop.rideId) === String(rideId) && stop.type === 'pickup') {
          return { ...stop, status: 'completed' };
        }
        return stop;
      });
      group.routeVersion += 1;
      await group.save();

      emitToRoom(getRideRoom(rideId), 'otp.verified', { rideId, status: 'started' });
      broadcastPoolUpdate(group);
    }
  }

  return ride;
};

/**
 * Completes a passenger ride in the pool group and settles earnings/comissions.
 */
export const completePassengerRide = async (rideId) => {
  const ride = await Ride.findById(rideId);
  if (!ride) throw new Error('Ride not found');

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    ride.status = 'completed';
    ride.liveStatus = 'completed';
    ride.completedAt = new Date();

    // Settle commission and driver earnings (Task 8, 9, 10)
    const baseFare = Number(ride.fare || 0);
    const settings = await getInstantPoolingSettings();
    
    // Platform commission calculations
    const commissionPercent = Number(settings.admin_commission_from_driver || 15);
    const adminCommission = Math.round((baseFare * commissionPercent) / 100);
    const driverEarnings = Math.max(0, baseFare - adminCommission);

    ride.commissionAmount = adminCommission;
    ride.driverEarnings = driverEarnings;
    await ride.save({ session });

    // Update driver wallet balance
    const walletRef = `pool-completion:${rideId}`;
    await applyDriverWalletAdjustmentByReference({
      driverId: ride.driverId,
      amount: driverEarnings,
      rideId: ride._id,
      description: `Earnings for pooled ride ${String(ride._id).slice(-6)}`,
      referenceKey: walletRef,
      session,
    });

    await User.findByIdAndUpdate(ride.userId, { currentRideId: null }, { session });

    await session.commitTransaction();
    auditLog('Trip Completed', { rideId, driverEarnings, adminCommission });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  if (ride.poolGroupId) {
    const group = await InstantPoolGroup.findById(ride.poolGroupId);
    if (group) {
      // Mark drop stop as completed and drop from active list
      group.routeSequence = group.routeSequence.map(stop => {
        if (String(stop.rideId) === String(rideId) && stop.type === 'drop') {
          return { ...stop, status: 'completed' };
        }
        return stop;
      });
      group.activeRides = group.activeRides.filter(id => String(id) !== String(rideId));
      group.occupiedSeats = Math.max(0, group.occupiedSeats - (ride.poolSeats || 1));
      group.routeVersion += 1;

      if (group.activeRides.length === 0) {
        group.status = 'completed';
        await group.save();

        // Release driver
        await Driver.findByIdAndUpdate(group.driverId, {
          isOnRide: false,
          activePoolGroupId: null,
          poolOccupiedSeats: 0,
          activePoolRideCount: 0,
        });

        emitToRoom(getDriverRoom(group.driverId), 'pool.closed', {
          poolGroupId: group._id,
          routeVersion: group.routeVersion
        });
        auditLog('Pool Closed', { poolGroupId: group._id });
      } else {
        await group.save();
        await Driver.findByIdAndUpdate(group.driverId, {
          poolOccupiedSeats: group.occupiedSeats,
          activePoolRideCount: group.activeRides.length,
        });
        broadcastPoolUpdate(group);
      }

      emitToRoom(getRideRoom(rideId), 'trip.completed', { rideId, status: 'completed' });
    }
  }
};

/**
 * Broadcasts pool state updates to the driver and all passengers in the group.
 */
export const broadcastPoolUpdate = (group) => {
  const payload = {
    poolGroupId: String(group._id),
    driverId: String(group.driverId),
    status: group.status,
    occupiedSeats: group.occupiedSeats,
    totalCapacity: group.totalCapacity,
    routeVersion: group.routeVersion,
    routeSequence: group.routeSequence.map(stop => ({
      id: String(stop._id),
      type: stop.type,
      rideId: String(stop.rideId),
      address: stop.address,
      coordinates: stop.coordinates,
      etaMinutes: stop.etaMinutes,
      passengerName: stop.passengerName,
      status: stop.status,
    })),
  };

  // Broadcast to driver
  emitToRoom(getDriverRoom(group.driverId), 'pool.updated', payload);
  emitToRoom(getDriverRoom(group.driverId), 'route.updated', payload);

  // Broadcast to each passenger
  for (const rideId of group.activeRides) {
    emitToRoom(getRideRoom(rideId), 'pool.updated', payload);
    emitToRoom(getRideRoom(rideId), 'route.updated', payload);
  }
};
