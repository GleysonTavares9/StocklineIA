import { redirect } from 'next/navigation';

export default function PricingPage() {
  // Redirect to the plans page
  redirect('/plans');
  
  // This return statement is here to make TypeScript happy, but it won't be reached
  return null;
}
