'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async () => {
        setLoading(true)
        setError('')

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setError('Invalid email or password. Try again.')
            setLoading(false)
            return
        }

        router.push('/admin/dashboard')
    }

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-page {
          min-height: 100vh;
          background: #080f08;
          background-image: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,80,16,0.4) 0%, transparent 60%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Barlow', sans-serif;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 40px 32px;
        }

        .login-logo {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo-icon {
          width: 56px; height: 56px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 28px;
          margin: 0 auto 16px;
        }

        .login-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 36px;
          color: #fff;
          letter-spacing: 0.02em;
          line-height: 1;
        }

        .login-subtitle {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin-top: 6px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 8px;
        }

        .form-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 14px 16px;
          font-family: 'Barlow', sans-serif;
          font-size: 15px;
          color: #fff;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          border-color: #22c55e;
          background: rgba(34,197,94,0.05);
        }

        .form-input::placeholder {
          color: rgba(255,255,255,0.2);
        }

        .error-msg {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 8px;
          padding: 12px 16px;
          font-family: 'Barlow', sans-serif;
          font-size: 14px;
          color: #f87171;
          margin-bottom: 16px;
          text-align: center;
        }

        .login-btn {
          width: 100%;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border: none;
          border-radius: 10px;
          padding: 16px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 20px;
          letter-spacing: 0.05em;
          color: #fff;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          margin-top: 8px;
        }

        .login-btn:hover { opacity: 0.9; }
        .login-btn:active { transform: scale(0.98); }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .spinner-inline {
          display: inline-block;
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

            <div className="login-page">
                <div className="login-card">
                    <div className="login-logo">
                        <div className="logo-icon">⚽</div>
                        <div className="login-title">Admin Panel</div>
                        <div className="login-subtitle">Naija FC Sheffield</div>
                    </div>

                    {error && <div className="error-msg">{error}</div>}

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            className="form-input"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        />
                    </div>

                    <button
                        className="login-btn"
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        {loading ? <><span className="spinner-inline" />Signing in...</> : 'Sign In'}
                    </button>
                </div>
            </div>
        </>
    )
}