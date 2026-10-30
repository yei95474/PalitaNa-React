import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

function LoginPage() {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agree, setAgree] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    function switchMode(signUpMode) {
        setIsSignUp(signUpMode);
        setError('');
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (isSignUp) {
            if (!agree) {
                setError('You must agree to the Terms of Service.');
                return;
            }
            if (fullName.trim() === '' || username.trim() === '') {
                setError('Full name and username are required.');
                return;
            }
            if (password.length < 6) {
                setError('Password must be at least 6 characters.');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                return;
            }

            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        username,
                    },
                },
            });

            if (signUpError) {
                setError(signUpError.message);
            } else {
                navigate('/');
            }
        } else {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                setError(signInError.message);
            } else {
                navigate('/');
            }
        }
    }

    return (
        <main>
            <section className={`main-content-container login-page-container ${isSignUp ? 'signup-mode' : 'login-mode'}`}>
                <div className="auth-tabs">
                    <button
                        type="button"
                        className={!isSignUp ? 'auth-tab auth-tab-active' : 'auth-tab'}
                        onClick={() => switchMode(false)}
                    >
                        Log In
                    </button>
                    <button
                        type="button"
                        className={isSignUp ? 'auth-tab auth-tab-active' : 'auth-tab'}
                        onClick={() => switchMode(true)}
                    >
                        Sign Up
                    </button>
                </div>

                <h2 className='auth-title'>{isSignUp ? 'Create an Account' : 'Welcome Back'}</h2>
                {isSignUp ? (
                    <p className="auth-subtitle">
                        Join the PalitaNa marketplace and start buying and selling within the
                        Viscan community.
                    </p>
                ) : <p className="auth-subtitle">
                    Login to PalitaNa marketplace and continue buying and selling within the
                    Viscan community.</p>}

                {error && <p className="auth-error">{error}</p>}

                <form onSubmit={handleSubmit}>
                    {isSignUp && (
                        <div className="form-group">
                            <label htmlFor="fullName">Full Name</label>
                            <input
                                type="text"
                                id="fullName"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">{isSignUp ? 'School Email' : 'Email'}</label>
                        <input
                            type="email"
                            id="email"
                            placeholder={
                                isSignUp ? 'Enter your email | @vsu.edu.ph' : 'Enter your email'
                            }
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {isSignUp && (
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                placeholder="Choose a username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="show-password-btn"
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                {showPassword ? '👁️‍🗨️' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {!isSignUp && (
                        <div className="login-options">
                            <label className="remember-me" htmlFor="remember">
                                <input type="checkbox" id="remember" />
                                Remember me
                            </label>
                            <Link to="/page-under-development" className="forgot-password-link">
                                Forgot Password?
                            </Link>
                        </div>
                    )}

                    {isSignUp && (
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {isSignUp && (
                        <div className="form-group checkbox-group">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={agree}
                                onChange={(e) => setAgree(e.target.checked)}
                            />
                            <label htmlFor="terms">
                                I agree to the <Link to="/page-under-development"> Terms of Service</Link> and{' '}
                                <Link to="/page-under-development"> Privacy Policy</Link>.
                            </label>
                        </div>
                    )}

                    <button type="submit" className="auth-submit-btn">
                        {isSignUp ? 'Create Account' : 'Sign In'}
                    </button>

                    <div className="auth-divider">
                        <span>OR</span>
                    </div>

                    <button type="button" className="google-auth-btn">
                        Continue with Google
                    </button>

                    {isSignUp ? (
                        <div className="login-confirmation">
                            <p>
                                Already have an account? <Link to="" onClick={() => switchMode(false)}> Log in</Link>
                            </p>
                        </div>
                    ) : (
                        <div className="login-confirmation">
                            <p>
                                Don't have an account? <Link to="" onClick={() => switchMode(true)}> Sign Up</Link>
                            </p>
                        </div>
                    )}
                </form>
            </section>
        </main >
    );
}

export default LoginPage;
