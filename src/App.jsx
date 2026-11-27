import './App.css';
import './Marketplace.css';
import './Buyer.css';
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { MarketplaceProvider } from './context/MarketplaceContext.jsx';
import Layout from './components/Layout.jsx';
import RequireAccount from './components/RequireAccount.jsx';
import HomePage from './pages/HomePage.jsx';
const ListingDetailsPage = lazy(() => import('./pages/ListingDetailsPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const ListAnItemPage = lazy(() => import('./pages/ListAnItemPage.jsx'));
const MyListingsPage = lazy(() => import('./pages/MyListingsPage.jsx'));
const CartPage = lazy(() => import('./pages/CartPage.jsx'));
const PickupCheckoutPage = lazy(() => import('./pages/PickupCheckoutPage.jsx'));
const PickupRequestsPage = lazy(() => import('./pages/PickupRequestsPage.jsx'));
const SellerPage = lazy(() => import('./pages/SellerPage.jsx'));
const SavedListingsPage = lazy(() => import('./pages/SavedListingsPage.jsx'));
const AccountPage = lazy(() => import('./pages/AccountPage.jsx'));
const WantedPage = lazy(() => import('./pages/WantedPage.jsx'));
const InfoPage = lazy(() => import('./pages/InfoPage.jsx'));

export default function App() {
    return (
        <AuthProvider>
            <MarketplaceProvider>
                <Suspense fallback={<main className="draft-panel" role="status">Loading page…</main>}>
                    <Routes>
                        <Route element={<Layout />}>
                            <Route index element={<HomePage />} />
                            <Route path="search" element={<HomePage />} />
                            <Route path="checkout/:id" element={<ListingDetailsPage />} />
                            <Route path="seller/:sellerId" element={<SellerPage />} />
                            <Route path="cart" element={<CartPage />} />
                            <Route path="wanted" element={<WantedPage />} />
                            <Route path="login" element={<LoginPage />} />
                            <Route element={<RequireAccount />}>
                                <Route path="checkout" element={<PickupCheckoutPage />} />
                                <Route path="list-an-item" element={<ListAnItemPage />} />
                                <Route path="my-listings" element={<MyListingsPage />} />
                                <Route path="my-listings/:id/edit" element={<ListAnItemPage />} />
                                <Route path="saved-items" element={<SavedListingsPage />} />
                                <Route path="account" element={<AccountPage />} />
                                <Route path="pickup-requests" element={<PickupRequestsPage />} />
                            </Route>
                            {['about', 'how-it-works', 'terms', 'privacy'].map((page) => <Route key={page} path={page} element={<InfoPage page={page} />} />)}
                            <Route path="*" element={<InfoPage />} />
                        </Route>
                    </Routes>
                </Suspense>
            </MarketplaceProvider>
        </AuthProvider>
    );
}
