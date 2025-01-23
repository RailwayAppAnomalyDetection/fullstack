import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css'; // Re-uses images from ~leaflet package
import 'leaflet-defaulticon-compatibility';

import '../../app/globals.css';
import { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />
}