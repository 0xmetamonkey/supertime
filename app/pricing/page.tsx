import { headers } from "next/headers";
import PricingClient from "./PricingClient";

export default async function PricingPage() {
  const headersList = await headers();
  const countryCode = headersList.get('x-vercel-ip-country') || 'US';

  return <PricingClient countryCode={countryCode} />;
}
