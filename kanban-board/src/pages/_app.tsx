import type { AppProps } from 'next/app'
import styles from '../../styles/Home.module.css'

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp
