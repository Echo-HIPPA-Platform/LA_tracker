import { Vehicle, VehicleStatus, VehicleType, Coordinates, Telemetry } from '../types';

const NAMES = ['Unit Alpha', 'Unit Bravo', 'Unit Charlie', 'Hauler X1', 'Hauler X2', 'Express 09', 'Maint 01', 'Interceptor'];
const DRIVERS = ['J. Smith', 'A. Doe', 'M. Chen', 'S. Gupta', 'L. Rossi', 'K. Tanaka', 'B. Obama', 'D. Trump'];

// Predefined Routes (San Francisco)
// These approximate real road coordinates
const ROUTES = [
  // Route 0: Market St (Ferry Building to Twin Peaks area)
  [
    { lat: 37.7953, lng: -122.3937 }, 
    { lat: 37.7881, lng: -122.4025 },
    { lat: 37.7718, lng: -122.4223 },
    { lat: 37.7635, lng: -122.4357 }
  ],
  // Route 1: The Embarcadero (North along waterfront)
  [
    { lat: 37.7885, lng: -122.3879 },
    { lat: 37.7997, lng: -122.3966 },
    { lat: 37.8080, lng: -122.4101 },
    { lat: 37.8060, lng: -122.4220 }
  ],
  // Route 2: Van Ness Ave (South to North)
  [
    { lat: 37.7713, lng: -122.4196 },
    { lat: 37.7865, lng: -122.4217 },
    { lat: 37.8050, lng: -122.4246 }
  ],
  // Route 3: 101 Central Fwy to Octavia
  [
    { lat: 37.7660, lng: -122.4070 },
    { lat: 37.7695, lng: -122.4150 },
    { lat: 37.7715, lng: -122.4200 },
    { lat: 37.7745, lng: -122.4250 }
  ],
  // Route 4: Mission St (Downtown to Mission)
  [
    { lat: 37.7915, lng: -122.3980 },
    { lat: 37.7525, lng: -122.4180 }
  ],
  // Route 5: 3rd Street (SOMA to Mission Bay)
  [
    { lat: 37.7870, lng: -122.4000 },
    { lat: 37.7760, lng: -122.3920 },
    { lat: 37.7650, lng: -122.3850 }
  ]
];

// Helper: Calculate distance in km between two points
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper: Calculate bearing between two points
function getBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

const generateInitialVehicles = (count: number): Vehicle[] => {
  const vehicles: Vehicle[] = [];
  for (let i = 0; i < count; i++) {
    const routeId = i % ROUTES.length;
    const startRoute = ROUTES[routeId];
    
    vehicles.push({
      id: `v-${i}`,
      name: NAMES[i % NAMES.length] + `-${i+1}`,
      type: i % 3 === 0 ? VehicleType.Truck : i % 2 === 0 ? VehicleType.Van : VehicleType.Car,
      status: VehicleStatus.Moving, // Start moving to show the routes immediately
      driver: DRIVERS[i % DRIVERS.length],
      coordinates: {
        lat: startRoute[0].lat,
        lng: startRoute[0].lng,
        heading: getBearing(startRoute[0].lat, startRoute[0].lng, startRoute[1].lat, startRoute[1].lng),
      },
      simulationState: {
        routeId: routeId,
        waypointIndex: 0,
        progress: 0,
        direction: 1
      },
      telemetry: {
        speed: 40 + Math.random() * 20, // Initial speed
        fuelLevel: Math.floor(Math.random() * 100),
        engineTemp: 85,
        batteryVoltage: 12.6,
        rpm: 2000,
        odometer: 12000 + Math.random() * 50000,
        tirePressure: [32, 32, 32, 32],
      },
      history: [],
      lastUpdate: Date.now(),
    });
  }
  return vehicles;
};

// Simulate movement along routes
export const updateVehicles = (vehicles: Vehicle[]): Vehicle[] => {
  return vehicles.map(v => {
    // Probabilistic status change (less frequent to keep them moving)
    if (Math.random() > 0.98) {
      if (v.status === VehicleStatus.Idle) v.status = VehicleStatus.Moving;
      else if (v.status === VehicleStatus.Moving && Math.random() > 0.7) v.status = VehicleStatus.Idle; // Prefer moving
    }

    // Force occasional alert
    if (v.status !== VehicleStatus.Alert && Math.random() > 0.998) v.status = VehicleStatus.Alert;

    let newTelemetry = { ...v.telemetry };
    let newCoords = { ...v.coordinates };
    let newSimState = { ...(v.simulationState || { routeId: 0, waypointIndex: 0, progress: 0, direction: 1 }) };

    if (v.status === VehicleStatus.Moving || v.status === VehicleStatus.Alert) {
        const route = ROUTES[newSimState.routeId];
        
        // Target target waypoint based on direction
        const currentWp = route[newSimState.waypointIndex];
        const nextIndex = newSimState.waypointIndex + newSimState.direction;
        
        // Check if we need to turn around (shouldn't happen often if logic is correct, but safety check)
        if (nextIndex < 0 || nextIndex >= route.length) {
            newSimState.direction *= -1;
        }

        const targetWp = route[newSimState.waypointIndex + newSimState.direction];
        
        // Calculate segment length
        const segmentDistKm = getDistanceKm(currentWp.lat, currentWp.lng, targetWp.lat, targetWp.lng);
        
        // Calculate distance traveled in this tick (1 sec)
        // Ensure minimum speed if moving
        newTelemetry.speed = Math.max(30, Math.min(100, newTelemetry.speed + (Math.random() - 0.5) * 5)); 
        const distTraveledKm = newTelemetry.speed / 3600;

        // Update progress
        const progressStep = distTraveledKm / (segmentDistKm || 0.001); // Avoid div by zero
        newSimState.progress += progressStep;

        // Check if reached next waypoint
        if (newSimState.progress >= 1) {
            newSimState.progress = 0;
            newSimState.waypointIndex += newSimState.direction;
            
            // Check bounds for next step
            const nextNextIndex = newSimState.waypointIndex + newSimState.direction;
            if (nextNextIndex < 0 || nextNextIndex >= route.length) {
                newSimState.direction *= -1; // Reverse direction at ends
            }
        }

        // Interpolate position
        // We need to re-fetch current and target in case indices changed above
        const finalCurrentWp = route[newSimState.waypointIndex];
        const finalTargetWp = route[newSimState.waypointIndex + newSimState.direction];
        
        newCoords.lat = finalCurrentWp.lat + (finalTargetWp.lat - finalCurrentWp.lat) * newSimState.progress;
        newCoords.lng = finalCurrentWp.lng + (finalTargetWp.lng - finalCurrentWp.lng) * newSimState.progress;
        
        // Update Heading
        newCoords.heading = getBearing(finalCurrentWp.lat, finalCurrentWp.lng, finalTargetWp.lat, finalTargetWp.lng);

        // Telemetry updates
        newTelemetry.rpm = 1500 + (newTelemetry.speed * 25) + (Math.random() * 100);
        newTelemetry.engineTemp = Math.min(115, Math.max(85, newTelemetry.engineTemp + (Math.random() - 0.4)));
        newTelemetry.fuelLevel = Math.max(0, newTelemetry.fuelLevel - 0.002);
        newTelemetry.odometer += distTraveledKm;

    } else {
        newTelemetry.speed = 0;
        newTelemetry.rpm = 700;
        newTelemetry.engineTemp = Math.max(20, newTelemetry.engineTemp - 0.2);
    }

    const newHistory = [...v.history, newTelemetry];
    if (newHistory.length > 20) newHistory.shift();

    return {
      ...v,
      status: v.telemetry.engineTemp > 112 ? VehicleStatus.Alert : v.status,
      coordinates: newCoords,
      telemetry: newTelemetry,
      history: newHistory,
      lastUpdate: Date.now(),
      simulationState: newSimState
    };
  });
};

export const initialFleet = generateInitialVehicles(8);
