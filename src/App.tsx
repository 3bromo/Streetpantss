import { ReactNode, useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { UIProvider } from './context/UIContext'
import { LanguageProvider } from './i18n/LanguageContext'
import { CatalogProvider } from './context/CatalogContext'
import { WishlistProvider } from './context/WishlistContext'
import { CartProvider } from './context/CartContext'
import AnnouncementBar from './components/AnnouncementBar'
import Navbar from './components/Navbar'
import MobileMenu from './components/MobileMenu'
import SearchOverlay from './components/SearchOverlay'
import CartDrawer from './components/CartDrawer'
import AccountModal from './components/AccountModal'
import ToastStack from './components/Toast'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import NewArrivalsPage from './pages/NewArrivalsPage'
import CollectionsPage from './pages/CollectionsPage'
import BestSellersPage from './pages/BestSellersPage'
import ProductDetailPage from './pages/ProductDetailPage'
import AboutPage from './pages/AboutPage'
import SearchPage from './pages/SearchPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import NotFoundPage from './pages/NotFoundPage'
import AdminLoginPage from './admin/AdminLoginPage'
import AdminLayout from './admin/AdminLayout'
import AdminDashboardPage from './admin/AdminDashboardPage'
import AdminProductsPage from './admin/AdminProductsPage'
import AdminProductEditPage from './admin/AdminProductEditPage'
import AdminOrdersPage from './admin/AdminOrdersPage'
import AdminOrderDetailPage from './admin/AdminOrderDetailPage'
import AdminInventoryPage from './admin/AdminInventoryPage'
import AdminDiscountsPage from './admin/AdminDiscountsPage'
import AdminContentPage from './admin/AdminContentPage'
import AdminSettingsPage from './admin/AdminSettingsPage'
import AdminImagesPage from './admin/AdminImagesPage'
import AdminNotificationsPage from './admin/AdminNotificationsPage'
import AdminSocialPage from './admin/AdminSocialPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="min-h-[60vh]"
    >
      {children}
    </motion.div>
  )
}

function AppRoutes() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  return (
    <>
      <ScrollToTop />
      {!isAdmin && (
        <>
          <AnnouncementBar />
          <Navbar />
        </>
      )}
      <MobileMenu />
      <SearchOverlay />
      <CartDrawer />
      <AccountModal />
      <ToastStack />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Page><HomePage /></Page>} />
          <Route path="/shop" element={<Page><ShopPage /></Page>} />
          <Route path="/new-arrivals" element={<Page><NewArrivalsPage /></Page>} />
          <Route path="/collections" element={<Page><CollectionsPage /></Page>} />
          <Route path="/best-sellers" element={<Page><BestSellersPage /></Page>} />
          <Route path="/product/:id" element={<Page><ProductDetailPage /></Page>} />
          <Route path="/about" element={<Page><AboutPage /></Page>} />
          <Route path="/search" element={<Page><SearchPage /></Page>} />
          <Route path="/cart" element={<Page><CartPage /></Page>} />
          <Route path="/checkout" element={<Page><CheckoutPage /></Page>} />

          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/new" element={<AdminProductEditPage />} />
            <Route path="products/:id" element={<AdminProductEditPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="orders/:id" element={<AdminOrderDetailPage />} />
            <Route path="inventory" element={<AdminInventoryPage />} />
            <Route path="discounts" element={<AdminDiscountsPage />} />
            <Route path="content" element={<AdminContentPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="images" element={<AdminImagesPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="social" element={<AdminSocialPage />} />
          </Route>

          <Route path="*" element={<Page><NotFoundPage /></Page>} />
        </Routes>
      </AnimatePresence>
      {!isAdmin && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <LanguageProvider>
        <UIProvider>
          <CatalogProvider>
            <WishlistProvider>
              <CartProvider>
                <AppRoutes />
              </CartProvider>
            </WishlistProvider>
          </CatalogProvider>
        </UIProvider>
      </LanguageProvider>
    </HashRouter>
  )
}
