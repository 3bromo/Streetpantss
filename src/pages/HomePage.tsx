import { usePageTitle } from '../lib/usePageTitle'
import Hero from '../components/Hero'
import NewArrivals from '../components/NewArrivals'
import BestSellers from '../components/BestSellers'
import EditorialSection from '../components/EditorialSection'
import CategorySection from '../components/CategorySection'
import BrandStory from '../components/BrandStory'
import Newsletter from '../components/Newsletter'

export default function HomePage() {
  usePageTitle('Premium Streetwear')
  return (
    <>
      <Hero />
      <NewArrivals />
      <BestSellers />
      <EditorialSection />
      <CategorySection />
      <BrandStory />
      <Newsletter />
    </>
  )
}
