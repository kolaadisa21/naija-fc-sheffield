'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/table', label: 'Table', icon: '📊' },
    { href: '/fixtures', label: 'Fixtures', icon: '📅' },
    { href: '/stats', label: 'Stats', icon: '⚽' },
]

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&display=swap');

  .navbar {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 100;
    background: rgba(8, 15, 8, 0.92);
    backdrop-filter: blur(16px);
    border-top: 1px solid rgba(255,255,255,0.07);
    padding: 8px 0 max(8px, env(safe-area-inset-bottom));
  }

  .navbar-inner {
    display: flex;
    justify-content: space-around;
    align-items: center;
    max-width: 600px;
    margin: 0 auto;
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 6px 20px;
    border-radius: 12px;
    text-decoration: none;
    transition: background 0.15s;
    flex: 1;
  }

  .nav-item:hover {
    background: rgba(255,255,255,0.05);
  }

  .nav-icon {
    font-size: 20px;
    line-height: 1;
    transition: transform 0.15s;
  }

  .nav-item.active .nav-icon {
    transform: scale(1.15);
  }

  .nav-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.25);
    transition: color 0.15s;
  }

  .nav-item.active .nav-label {
    color: #22c55e;
  }

  .nav-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #22c55e;
    margin-top: 2px;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .nav-item.active .nav-dot {
    opacity: 1;
  }

  /* Desktop top nav */
  @media (min-width: 768px) {
    .navbar {
      bottom: auto;
      top: 0;
      border-top: none;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      padding: 0;
    }

    .navbar-inner {
      justify-content: flex-start;
      gap: 4px;
      padding: 0 24px;
      max-width: 900px;
    }

    .nav-item {
      flex-direction: row;
      gap: 8px;
      padding: 16px 16px;
      border-radius: 0;
      flex: none;
      border-bottom: 2px solid transparent;
    }

    .nav-item.active {
      border-bottom-color: #22c55e;
    }

    .nav-item:hover {
      background: rgba(255,255,255,0.04);
    }

    .nav-icon { font-size: 16px; }

    .nav-label {
      font-size: 13px;
      color: rgba(255,255,255,0.4);
    }

    .nav-item.active .nav-label { color: #22c55e; }

    .nav-dot { display: none; }

    /* Logo on desktop */
    .navbar-logo {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 20px;
      color: #fff;
      letter-spacing: 0.05em;
      margin-right: 16px;
      padding: 16px 0;
      white-space: nowrap;
    }
    .navbar-logo span { color: #22c55e; }
  }

  @media (max-width: 767px) {
    .navbar-logo { display: none; }
    /* Push page content above bottom nav */
    body { padding-bottom: 72px !important; }
  }

  @media (min-width: 768px) {
    /* Push page content below top nav */
    body { padding-top: 52px !important; }
  }
`

export default function NavBar() {
    const pathname = usePathname()

    // Don't show navbar on admin pages
    if (pathname?.startsWith('/admin')) return null

    return (
        <>
            <style>{STYLES}</style>
            <nav className="navbar">
                <div className="navbar-inner">
                    <span className="navbar-logo">⚽ <span>Naija FC</span></span>
                    {NAV_ITEMS.map(item => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`nav-item${isActive ? ' active' : ''}`}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                                <span className="nav-dot" />
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}