import CryptoPage from '../components/CryptoPage'

export default function Page() {
  return <CryptoPage paypalClientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID} />
}
