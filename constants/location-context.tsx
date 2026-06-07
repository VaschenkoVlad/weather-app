import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Location {
  lat: number;
  lng: number;
  city: string;
  country: string;
}

interface LocationContextValue {
  location: Location;
  setLocation: (loc: Location) => void;
}

const defaultLocation: Location = {
  lat: 50.45,
  lng: 30.52,
  city: 'Kyiv',
  country: 'Ukraine',
};

const LocationContext = createContext<LocationContextValue>({
  location: defaultLocation,
  setLocation: () => {},
});

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location>(defaultLocation);
  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
