import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RequireAccount() {
    const { user, loading } = useAuth();
    const { pathname, search } = useLocation();
    if (loading) return <main className="draft-panel" role="status">Checking your account.</main>;
    return user ? <Outlet /> : <Navigate to="/login" state={{ from: pathname + search }} replace />;
}
