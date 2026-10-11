import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import SearchBar from './SearchBar';
import Footer from './Footer';

function Layout() {
    return (
        <>
            <header className="header-container">
                <div className="navbar-and-search-wrapper">
                    <Navbar />
                    <SearchBar />
                </div>
            </header>

            <Outlet />

            <Footer />
        </>
    );
}

export default Layout;