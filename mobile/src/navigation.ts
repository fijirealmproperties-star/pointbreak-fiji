export type RootStackParamList = {
  Auth: undefined;
  Server: undefined;
  RiderTabs: undefined;
  DriverTabs: undefined;
  RideOptions: {
    pickup: { name: string; lat: number; lng: number };
    dropoff: { name: string; lat: number; lng: number };
    mode: "land" | "sea";
  };
  Requesting: {
    rideId: string;
    mode: "land" | "sea";
    vehicleType: string;
    price: number;
    pickupName: string;
    dropoffName: string;
  };
  ActiveRide: { rideId: string };
  RideComplete: { rideId: string };
  History: undefined;
  Profile: undefined;
  Wallet: undefined;
  Guide: undefined;
  Settings: undefined;
  DriverRequest: { rideId: string };
  DriverRide: { rideId: string };
  DriverEarnings: undefined;
  DriverProfile: undefined;
};

export type RiderTabParamList = {
  Home: undefined;
  History: undefined;
  Guide: undefined;
  Profile: undefined;
};

export type DriverTabParamList = {
  DriverHome: undefined;
  DriverEarnings: undefined;
  DriverProfile: undefined;
};
