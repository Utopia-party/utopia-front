import { Link } from 'react-router';
import Logo from '../ui/Logo';
import Container from './Container';
import { useState } from 'react';
import { NavHashLink } from 'react-router-hash-link';

import { IoClose, IoMenu } from 'react-icons/io5';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <Container className="flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-2 group">
          <Logo />
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight group-hover:text-primary transition-colors">
            Party-UP
          </h1>
        </Link>

        <div className="hidden md:flex items-center gap-3 md:gap-6">
          <NavHashLink
            to="#section-1"
            smooth
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Section1
          </NavHashLink>
          <NavHashLink
            to="#section-2"
            smooth
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Section2
          </NavHashLink>
        </div>

        {/* 햄버거 */}
        <div className="md:hidden flex items-center">
          <button
            onClick={toggleMenu}
            className="text-gray-600 hover:text-gray-900 focus:outline-none p-2"
          >
            {isOpen ? <IoClose /> : <IoMenu />}
          </button>
        </div>
      </Container>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pt-2 pb-4 space-y-2 shadow-lg">
          <NavHashLink
            to="#section-1"
            smooth
            onClick={toggleMenu}
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md"
          >
            Section1
          </NavHashLink>
          <NavHashLink
            to="#section-2"
            smooth
            onClick={toggleMenu}
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md"
          >
            Section2
          </NavHashLink>
        </div>
      )}
    </nav>
  );
}
