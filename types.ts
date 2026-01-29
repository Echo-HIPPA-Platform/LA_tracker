export enum VehicleStatus {
  Moving = 'Moving',
  Idle = 'Idle',
  Stopped = 'Stopped',
  Offline = 'Offline',
  Alert = 'Alert'
}

export enum VehicleType {
  Truck = 'Truck',
  Van = 'Van',
  Car = 'Car'
}

export interface Coordinates {
  lat: number;
  lng: number;
  heading?: number; // Degrees 0-360
}

export interface Telemetry {
  speed: number; // km/h
  fuelLevel: number; // %
  engineTemp: number; // Celsius
  batteryVoltage: number; // Volts
  rpm: number;
  odometer: number;
  tirePressure: [number, number, number, number]; // PSI
}

export interface SimulationState {
  routeId: number;
  waypointIndex: number; // Current starting waypoint of the segment
  progress: number; // 0.0 to 1.0 along the segment
  direction: 1 | -1; // 1 for forward, -1 for backward
}

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  status: VehicleStatus;
  driver: string;
  coordinates: Coordinates;
  telemetry: Telemetry;
  history: Telemetry[]; // Last 10 points for charts
  destination?: string;
  lastUpdate: number;
  simulationState?: SimulationState;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}