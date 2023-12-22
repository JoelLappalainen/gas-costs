# Split Gasoline Costs

A simple progressive web app ([PWA](https://web.dev/explore/progressive-web-apps)) to calculate gasoline costs between friends. Language support for Finnish (🇫🇮) and English (🏴󠁧󠁢󠁥󠁮󠁧󠁿).

Hosted on: [gas.joellappalainen.com](https://gas.joellappalainen.com)

App uses Google's Distance and Places APIs for calculating trip distance. Gasoline prices from Finland and Helsinki are scraped from [tankille.fi](https://www.tankille.fi/).

## Dev

Next.js project with Tailwind and Typescript.

Create a Google Api Key with [places](https://developers.google.com/maps/documentation/places/web-service/overview) and [distance matrix](https://developers.google.com/maps/documentation/distance-matrix/overview) enabled. Then, add it `example.env.local` file and remove the file's `example`-prefix.

```bash
npm i

npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## TODO

- case: ZERO_RESULTS from google
- sharing: update url with state -> populate state with url content onMount
