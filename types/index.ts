export interface ProductConfig {
  sku: string;
  name: string;
  model: string;   // "iPhone 17 Pro Max" | "iPhone 17 Pro"
  storage: string; // "256GB" | "512GB"
  color: string;
  colorCode: string;
}

export interface StoreAvailability {
  sku: string;
  pickupDisplay: "available" | "unavailable" | "ineligible";
  pickupSearchQuote: string;
  storePickMessage: string;
}

export interface Store {
  storeId: string;
  storeName: string;
  city: string;
  address: string;
  phone: string;
  distance: string;
  availability: Record<string, StoreAvailability>;
}

export interface AvailabilityResult {
  stores: Store[];
  fetchedAt: string;
  hasAvailable: boolean;
  isDemo?: boolean;
}

export interface AppleApiResponse {
  body: {
    PickupMessage: {
      stores: AppleStore[];
    };
  };
}

export interface AppleStore {
  storeName: string;
  storeId: string;
  city: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  storephone: string;
  storedistance: string;
  storeDistanceWithUnit: string;
  partsAvailability: Record<string, ApplePartAvailability>;
}

export interface ApplePartAvailability {
  storePickEligible: boolean;
  pickupDisplay: "available" | "unavailable" | "ineligible";
  pickupSearchQuote: string;
  partNumber: string;
  messageTypes: {
    compact: {
      storePickMessage: string;
      storeSelectionEnabled: boolean;
    };
  };
}
