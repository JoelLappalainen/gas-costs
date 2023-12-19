export async function GET(request: Request) {
  const baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json';

  const { searchParams } = new URL(request.url);
  const input = searchParams.get('input') || '';
  const fromPlaceId = searchParams.get('fromPlaceId') || '';
  const toPlaceId = searchParams.get('toPlaceId') || '';
  const language = searchParams.get('locale') || 'fi';
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  const googleUrl = new URL(baseUrl);
  const paramsObj = {
    input,
    key: apiKey,
    language,
    mode: 'driving',
    origins: `place_id:${fromPlaceId}`,
    destinations: `place_id:${toPlaceId}`,
  };
  const googleSearchParams = new URLSearchParams(paramsObj);
  googleUrl.search = googleSearchParams.toString();

  const res = await fetch(googleUrl, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();

  return Response.json({ data });
}
