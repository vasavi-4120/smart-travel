import React, { useState } from "react";
import { SiSmart } from "react-icons/si";
import { FaRegUserCircle } from "react-icons/fa";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { userDataContext } from "../context/UserContext";

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { userData } = useContext(userDataContext);
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <header className="bg-white sticky top-0 left-0 w-full border-b-2 border-solid border-gray-300 z-9999">
      <nav
        aria-label="Global"
        className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
      >
        <div className="flex lg:flex-1 items-center">
          <a href="/" className="-m-1.5 p-1.5 flex items-center">
            <span className="sr-only">Your Company</span>
            <span className="flex items-center -mx-3 rounded-lg px-3 py-2 text-2xl font-bold text-violet-600 hover:bg-gray-100">
              <SiSmart className="mr-2" /> Smart Travel
            </span>
          </a>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
          >
            <span className="sr-only">Open main menu</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-6 h-6"
            >
              <path
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          <a
            href="/dashboard"
            className="text-sm font-semibold text-black hover:text-purple-600"
          >
            Dashboard
          </a>
          <a
            href="/traveltips"
            className="text-sm font-semibold text-black hover:text-purple-600"
          >
            Travel Tips
          </a>
          <a
            href="/guidance"
            className="text-sm font-semibold text-black hover:text-purple-600"
          >
            Guidance
          </a>
          {userData ? (
            <a
              href="/makeyourtrip"
              className="text-sm font-semibold text-black hover:text-purple-600"
            >
              Make Your Trip
            </a>
          ) : (
            ""
          )}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <button
            onClick={handleProfileClick}
            className="flex items-center text-sm font-semibold text-black hover:text-purple-600"
          >
            <FaRegUserCircle className="mr-1" />
            Profile <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-50 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto bg-white p-6">
            <div className="flex items-center justify-between">
              <a href="#" className="-m-1.5 p-1.5">
                <span className="flex items-center -mx-3 rounded-lg px-3 py-2 text-2xl font-semibold text-purple-500">
                  <SiSmart className="mr-2" /> Smart Travel
                </span>
              </a>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
              >
                <span className="sr-only">Close menu</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-6 h-6"
                >
                  <path
                    d="M6 18 18 6M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-200">
                <div className="space-y-2 py-6">
                  <a
                    href="/dashboard"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-black hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </a>
                  <a
                    href="/traveltips"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-black hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Travel Tips
                  </a>
                  <a
                    href="/guidance"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-black hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Guidance
                  </a>
                  {userData ? (
                    <a
                      href="/makeyourtrip"
                      className="text-sm font-semibold text-black hover:text-purple-600"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Make Your Trip
                    </a>
                  ) : (
                    ""
                  )}
                </div>
                <div className="py-6">
                  <a
                    href="/profile"
                    className="-mx-3 flex items-center rounded-lg px-3 py-2.5 text-base font-semibold text-black hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FaRegUserCircle className="mr-1" />
                    Profile
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
