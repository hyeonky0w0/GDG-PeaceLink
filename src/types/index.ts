export interface EmergencyAlert {
  id: string;
  message: string;
  level: "critical" | "warning" | "info";
  shelterCode?: string;
  createdAt: string;
  verified?: boolean;
}

export interface Shelter {
  id: string;
  name: string;
  distance: string;
  walkTime: string;
  lat: number;
  lng: number;
}

export interface District {
  code: string;
  name: string;
}

export interface UserLocation {
  district: District;
  lat: number;
  lng: number;
}