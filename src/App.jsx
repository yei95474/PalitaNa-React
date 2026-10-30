import './App.css';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import PageUnderDevelopment from './pages/PageUnderDevelopment.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import SearchResultsPage from './pages/SearchResultsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ListAnItemPage from './pages/ListAnItemPage.jsx';


function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/page-under-development" element={<PageUnderDevelopment />} />
          <Route path="/checkout/:id" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/list-an-item" element={<ListAnItemPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;