export async function GET(request: Request) {
  const baseUrl =
    'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

  const { searchParams } = new URL(request.url);
  const language = searchParams.get('locale') || 'fi';
  const location = searchParams.get('location') || '';
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  const googleUrl = new URL(baseUrl);
  const paramsObj = {
    key: apiKey,
    language,
    location,
    radius: '50',
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
