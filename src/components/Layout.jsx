import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import SearchBar from './SearchBar';
import Footer from './Footer';
import useIsMobile from '../hooks/useIsMobile';

function Layout() {
    const isMobile = useIsMobile();

    return (
        <div className={isMobile ? 'layout-mobile' : 'layout-desktop'}>
            <header className="header-container">
                <div className="navbar-and-search-wrapper">
                    <Navbar />
                    <SearchBar />
                </div>
            </header>

            <Outlet />

            <Footer />
        </div>
    );
}

export default Layout;