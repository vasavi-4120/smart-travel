import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Footer.css';
import '../index.css'
import { FaTwitter } from "react-icons/fa";
import { GrFacebookOption } from "react-icons/gr";
import { BsInstagram } from "react-icons/bs";
import { FaYoutube } from "react-icons/fa6";
import { SiSmart } from "react-icons/si";
import { GrUserPolice } from "react-icons/gr";
import { FaAmbulance } from "react-icons/fa";
import { FaDumpsterFire } from "react-icons/fa";
import { IoCall } from "react-icons/io5";
import { MdOutlineGirl } from "react-icons/md";
import { LiaSmsSolid } from "react-icons/lia";

const Footer = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const location = useLocation();
  
  // Emergency contact data
  const emergencyContacts = [
    { name: 'Police', number: '100', icon: <GrUserPolice /> },
    { name: 'Ambulance', number: '102', icon: <FaAmbulance /> },
    { name: 'Fire', number: '101', icon: <FaDumpsterFire /> },
    { name: 'Tourist Helpline', number: '1363', icon: <IoCall /> },
    { name: 'Women Helpline', number: '1091', icon: <MdOutlineGirl /> },
    { name: 'Emergency SMS', number: '112', icon: <LiaSmsSolid /> }
  ];

  const quickLinks = [
    { path: '/about', label: 'About Us' },
    { path: '/contact', label: 'Contact' },
    { path: '/privacy', label: 'Privacy Policy' },
    { path: '/terms', label: 'Terms of Service' },
    { path: '/faq', label: 'FAQ' },
    { path: '/safety-tips', label: 'Safety Tips' }
  ];

  const socialLinks = [
    { name: 'Facebook', url: '#', icon: <GrFacebookOption /> },
    { name: 'Twitter', url: '#', icon: <FaTwitter /> },
    { name: 'Instagram', url: '#', icon: <BsInstagram /> },
    { name: 'YouTube', url: '#', icon: <FaYoutube /> }
  ];

  const handleEmergencyCall = (number) => {
    if (window.confirm(`Call ${number}?`)) {
      window.location.href = `tel:${number}`;
    }
  };

  return (
    <footer className="footer sticky bottom-0 left-0 w-full border-t-2 border-solid border-gray-300">
      {/* Main Footer Content */}
      <div className="footer-main">
        <div className="footer-container">
          
          {/* Brand Section */}
          <div className="footer-section brand-section">
            <div className="footer-logo">
              <h3 className='flex items-center text-violet-600' >
                <SiSmart className="mr-2 text-violet-600 " />Tourist Safety
              </h3>
            </div>
            <p className="footer-description">
              A smart safety monitoring system powered by AI and real-time tracking 
              to ensure secure travel experiences across India.
            </p>
            <div className="social-links">
              {socialLinks.map((social, index) => (
                <a 
                  key={index}
                  href={social.url} 
                  className="social-link"
                  aria-label={social.name}
                >
                  <span className="social-icon">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.path} 
                    className={location.pathname === link.path ? 'active' : ''}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Emergency Contacts */}
          <div className="footer-section emergency-section">
            <h4 className="footer-title">Emergency Contacts</h4>
            <div className="emergency-contacts">
              {emergencyContacts.map((contact, index) => (
                <div 
                  key={index}
                  className="emergency-contact"
                  onClick={() => handleEmergencyCall(contact.number)}
                >
                  <span className="contact-icon">{contact.icon}</span>
                  <div className="contact-info">
                    <span className="contact-name">{contact.name}</span>
                    <span className="contact-number">{contact.number}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* App Download & Support */}
          <div className="footer-section">
            <h4 className="footer-title">Download App</h4>
            <div className="app-download">
              <button className="download-btn play-store">
                <span className="btn-icon">📱</span>
                <div className="btn-text">
                  <span className="get-on">Get it on</span>
                  <span className="store-name">Google Play</span>
                </div>
              </button>
              
              <button className="download-btn app-store">
                <span className="btn-icon">📱</span>
                <div className="btn-text">
                  <span className="get-on">Download on</span>
                  <span className="store-name">App Store</span>
                </div>
              </button>
            </div>
            
            <div className="support-info">
              <h5>24/7 Support</h5>
              <p>Email: support@touristsafety.gov.in</p>
              <p>Helpline: 1800-123-1363</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-container">
          <div className="footer-bottom-content">
            <p className="copyright">
              &copy; {currentYear} Ministry of Tourism, Government of India. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <Link to="/accessibility">Accessibility</Link>
              <Link to="/sitemap">Sitemap</Link>
              <Link to="/feedback">Feedback</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;