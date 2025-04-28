"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Tag, User, Menu } from "lucide-react"
import { useAuth } from '../utils/AuthContext'

function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout: contextLogout } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: "About", path: "/about" },
    { name: "Feedback", path: "/feedback" },
  ]

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token")
      if (token) {
        const response = await fetch("http://localhost:8000/api/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Logout failed")
        }
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      contextLogout()
      setShowUserMenu(false)
      navigate("/")
    }
  }

  const SellButton = () =>
    user && (
      <Link to="/list-item">
        <motion.button
          className="ml-4 px-6 py-2 bg-gradient-to-r from-pink-500 to-yellow-500 text-white rounded-full font-medium shadow-md transition-all duration-300 ease-in-out flex items-center"
          whileHover={{
            scale: 1.05,
            boxShadow: "0 4px 20px rgba(236, 72, 153, 0.3)",
          }}
          whileTap={{ scale: 0.95 }}
        >
          <Tag className="w-4 h-4 mr-2" />
          Sell
        </motion.button>
      </Link>
    )

  return (
    <motion.header
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/90 backdrop-blur-md shadow-lg" : "bg-white/30 backdrop-blur-sm"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex flex-col items-start">
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent drop-shadow-md">
              Circula
            </span>
            <span className="text-xs text-gray-600 mt-1">The Cycle of New Beginnings</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <motion.div key={item.name}>
                <Link
                  to={item.path}
                  className={`nav-link px-3 py-2 text-gray-700 transition-colors rounded-md ${
                    location.pathname === item.path ? "bg-violet-50 text-violet-600" : ""
                  }`}
                >
                  <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    {item.name}
                  </motion.span>
                </Link>
              </motion.div>
            ))}
            <SellButton />
            {user ? (
              <div className="relative">
                <motion.button
                  className="ml-4  rounded-full overflow-hidden"
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: "#818CF8",
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture ? `http://localhost:8000${user.profile_picture}` : "/placeholder.svg"}
                      alt="Profile"
                      className="w-9 h-9 rounded-full"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = "/placeholder.svg"
                      }}
                    />
                  ) : (
                    <User className="w-6 h-6 text-indigo-600" />
                  )}
                </motion.button>
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
                    >
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-100"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login">
                <motion.button
                  className="ml-4 px-6 py-2 bg-indigo-100 text-indigo-600 rounded-full font-medium shadow-md transition-all duration-300 ease-in-out"
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: "#818CF8",
                    color: "#ffffff",
                    boxShadow: "0 4px 20px rgba(99, 102, 241, 0.3)",
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  Login
                </motion.button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              className="md:hidden py-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <motion.div key={item.name}>
                    <Link
                      to={item.path}
                      className={`nav-link block px-4 py-2 text-gray-700 transition-colors rounded-md ${
                        location.pathname === item.path ? "bg-violet-50 text-violet-600" : ""
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        {item.name}
                      </motion.span>
                    </Link>
                  </motion.div>
                ))}
                <SellButton />
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-indigo-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-indigo-100"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <motion.button
                      className="w-full px-6 py-2 bg-indigo-100 text-indigo-600 rounded-full font-medium shadow-md transition-all duration-300 ease-in-out"
                      whileHover={{
                        scale: 1.05,
                        backgroundColor: "#818CF8",
                        color: "#ffffff",
                        boxShadow: "0 4px 20px rgba(99, 102, 241, 0.3)",
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Login
                    </motion.button>
                  </Link>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}

export default Header