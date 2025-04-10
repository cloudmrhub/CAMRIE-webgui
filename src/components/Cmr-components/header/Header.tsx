import * as React from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, NavigateFunction } from 'react-router-dom';
import './Header.scss';

export interface MenuItem {
  path: string;
  title: string;
}

interface HeaderProps {
  siteTitle: string;
  authentication?: { email: string; accessToken: string };
  menuList: MenuItem[];
  handleLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  siteTitle,
  authentication,
  menuList,
  handleLogout,
}) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [selected, setSelected] = useState(siteTitle);

  /* keep selected menu in sync with the URL */
  useEffect(() => {
    const match = menuList.find(m => m.path === location.pathname);
    if (match) setSelected(match.title);
  }, [location.pathname, menuList]);

  const changeMenu = (item: MenuItem, nav: NavigateFunction) => {
    if (location.pathname === item.path) return;
    nav(item.path);
    setSelected(item.title);
  };

  return (
    <nav className="navbar navbar-expand-md navbar-dark bg-dark shadow-sm">
      <div className="container-xl">
        <Link to="/" className="navbar-brand d-flex align-items-center">
          <div
            style={{
              borderRadius: '30%',
              width: 50,
              height: 50,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <img
              src={`${import.meta.env.BASE_URL ?? ''}MR Optimum_final_white.png`}
              alt="Logo"
              style={{ width: 40, height: 40 }}
            />
          </div>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarToggleExternalContent"
          aria-controls="navbarToggleExternalContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarToggleExternalContent">
          {/* left menu */}
          <ul className="navbar-nav">
            {menuList.map(item => (
              <li
                key={item.path}
                className={`nav-item${item.title === selected ? ' active' : ''}`}
              >
                {item.title === 'Bug Report' ? (
                  <a
                    className="nav-link"
                    href="https://github.com/cloudmrhub-com/mroptimum/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.title}
                  </a>
                ) : (
                  <Link
                    className="nav-link"
                    to={item.path}
                    onClick={e => {
                      e.preventDefault();
                      changeMenu(item, navigate);
                    }}
                  >
                    {item.title}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* right auth menu */}
          {authentication?.accessToken && (
            <ul className="navbar-nav ms-auto">
              <li className="nav-item dropdown">
                <button
                  className="nav-link dropdown-toggle"
                  id="dropdownMenuButton"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  type="button"
                >
                  {authentication.email}
                </button>
                <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={e => {
                        e.preventDefault();
                        handleLogout();
                      }}
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
