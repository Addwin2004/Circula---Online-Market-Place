'use client'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import '../styles/Footer.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const sections = [
    {
      title: 'Company',
      links: [
        { name: 'About Us', path: '/about' },
        { name: 'Contact', path: '/contact' },
        { name: 'Feedback', path: '/feedback' }

      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Terms of Service', path: '#' },
        { name: 'Privacy Policy', path: '/#' }
      ]
    },
    {
      title: 'Connect',
      links: [
        { name: 'Instagram', path: '#' },
        { name: 'LinkedIn', path: '#' }
      ]
    }
  ]

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand Section */}
          <div className="brand-section">
            <motion.div
              className="brand-container"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <span className="brand-name">
                Circula
              </span>
              <span className="brand-tagline">
                The Future of Circular Economy
              </span>
            </motion.div>
            <p className="brand-description">
              Creating a sustainable marketplace where every transaction contributes to a better tomorrow.
            </p>
          </div>

          {/* Navigation Sections */}
          {sections.map((section, index) => (
            <div key={index} className="md:col-span-1">
              <h3 className="section-title">
                {section.title}
              </h3>
              <ul className="links-list">
                {section.links.map((link, linkIndex) => (
                  <motion.li
                    key={linkIndex}
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to={link.path}
                      className="nav-link"
                    >
                      {link.name}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright Section */}
        <motion.div
          className="copyright-section"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="copyright-text">
            © {currentYear} Circula. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  )
}