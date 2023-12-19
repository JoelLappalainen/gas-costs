import { type } from 'os';

type PlacesResponse = {
  data: {
    predictions: {
      description: string;
      place_id: string;
    }[];
    status: string;
  };
};

export type Prediction = PlacesResponse['data']['predictions'][0];

export async function getGooglePlaces(
  input: string,
  locale: string,
  latitude: number | null,
  longitude: number | null
) {
  const location = latitude && longitude ? `${latitude},${longitude}` : '';
  const url = '/api/places?' + new URLSearchParams({ input, locale, location });
  const res = await fetch(url);
  const data = (await res.json()) as PlacesResponse;
  return data.data;
}

export type Distance =
  | {
      status: 'OK';
      duration: {
        text: string;
        value: number;
      };
      distance: {
        text: string;
        value: number;
      };
    }
  | {
      status: 'ZERO_RESULTS';
    };

type DistanceResponse = {
  data: {
    destination_addresses: string[];
    origin_addresses: string[];
    rows: {
      elements: Distance[];
    }[];
    status: string;
  };
};

export async function getGoogleDistance(
  fromPlaceId: string,
  toPlaceId: string,
  locale: string
) {
  const url =
    '/api/distance?' + new URLSearchParams({ fromPlaceId, toPlaceId, locale });
  const res = await fetch(url);
  const data = (await res.json()) as DistanceResponse;

  const firstSuggestion = data?.data?.rows?.[0].elements?.[0];

  return firstSuggestion;
}

type NearbyResponse = {
  data: {
    results: {
      geometry: {
        location: {
          lat: number;
          lng: number;
        };
      };
      name: string;
      place_id: string;
      vicinity: string;
    }[];
    status: string;
  };
};

export async function getGoogleNearbyPlaces(
  latitude: number,
  longitude: number,
  locale: string
) {
  const location = latitude && longitude ? `${latitude},${longitude}` : '';
  const url =
    '/api/places/nearby?' +
    new URLSearchParams({
      location,
      locale,
    });

  const res = await fetch(url);
  const data = (await res.json()) as NearbyResponse;
  const firstSuggestion = data?.data?.results?.[0];
  return firstSuggestion;
}
