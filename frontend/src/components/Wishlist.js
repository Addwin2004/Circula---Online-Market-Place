"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { User, Heart, Package, ShoppingBag, DollarSign, CreditCard, Loader } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import "../styles/Profile.css"
import "../styles/Wishlist.css"

function Wishlist() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("wishlist")
  const [wishlistItems, setWishlistItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const currentPath = location.pathname.split("/")[1]
    setActiveTab(currentPath || "profile")
  }, [location])

  const fetchWishlistItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }

      const response = await fetch("http://localhost:8000/api/wishlist/items", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch wishlist items: ${response.status}`)
      }

      const data = await response.json()
      setWishlistItems(data)
    } catch (error) {
      console.error("Error fetching wishlist items:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchWishlistItems()
  }, [fetchWishlistItems])

  const handleWishlistToggle = async (itemId) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }

      const response = await fetch(`http://localhost:8000/api/wishlist/toggle`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to toggle wishlist item: ${response.status}`)
      }

      // Remove item from local state immediately for better UX
      setWishlistItems(items => items.filter(item => item.id !== itemId))
    } catch (error) {
      console.error("Error toggling wishlist item:", error)
    }
  }

  const sidebarItems = [
    { name: "Profile", icon: User, link: "/profile" },
    { name: "Wishlist", icon: Heart, link: "/wishlist" },
    { name: "Products", icon: Package, link: "/user-products" },
    { name: "Purchased", icon: ShoppingBag, link: "/purchased" },
    { name: "Sold", icon: DollarSign, link: "/sold" },
    { name: "Card", icon: CreditCard, link: "/card" },
  ]

  return (
    <div className="profile-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>My Account</h2>
        </div>
        <nav className="sidebar-nav">
          {sidebarItems.map((item) => (
            <Link to={item.link} key={item.name}>
              <motion.div
                className={`sidebar-item ${activeTab === item.name.toLowerCase() ? "active" : ""}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon className="sidebar-icon" />
                <span>{item.name}</span>
              </motion.div>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="wishlist-content">
        <h1 className="wishlist-title">My Wishlist</h1>
        {loading ? (
          <div className="loading-container">
            <Loader className="loading-spinner" />
            <p>Loading wishlist items...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : wishlistItems.length === 0 ? (
          <div className="empty-message">
            <p>Your wishlist is empty</p>
            <Link to="/products" className="browse-products-link">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlistItems.map((item) => (
              <motion.div 
                key={item.id} 
                className="wishlist-item" 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/item/${item.id}`)}
              >
                <img 
                  src={`http://localhost:8000${item.image_url}` || "/placeholder.svg"}
                  alt={item.name} 
                  className="wishlist-item-image" 
                />
                <div className="wishlist-item-info">
                  <h3>{item.name}</h3>
                  <p className="wishlist-item-price">₹{item.price}</p>
                  <p className="wishlist-item-location">{item.seller_city}</p>
                </div>
                <button 
                  className="wishlist-heart-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWishlistToggle(item.id);
                  }}
                >
                  <Heart className="wishlist-heart-icon" fill="red" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Wishlist