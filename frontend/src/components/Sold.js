"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Heart, Package, ShoppingBag, DollarSign, CreditCard, Search } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import "../styles/Sold.css"

const Sold = () => {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState("sold")
  const [soldItems, setSoldItems] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    const currentPath = location.pathname.split("/")[1]
    setActiveTab(currentPath || "sold")
  }, [location])

  useEffect(() => {
    fetchSoldItems()
  }, [])

  const fetchSoldItems = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No token found")

      const response = await fetch("http://localhost:8000/api/user/sold", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to fetch sold items")
      const data = await response.json()
      setSoldItems(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching sold items:", error)
      setError(error.message)
      setLoading(false)
    }
  }

  const filteredItems = soldItems.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const sidebarItems = [
    { name: "Profile", icon: User, link: "/profile" },
    { name: "Wishlist", icon: Heart, link: "/wishlist" },
    { name: "Products", icon: Package, link: "/user-products" },
    { name: "Purchased", icon: ShoppingBag, link: "/purchased" },
    { name: "Sold", icon: DollarSign, link: "/sold" },
    { name: "Card", icon: CreditCard, link: "/card" },
  ]

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">Error: {error}</div>

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

      <main className="profile-content">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="page-title">Sold Items</h1>
          <div className="search-bars">
            <Search className="search-icon-sold" />
            <input
              type="text"
              placeholder="Search sold items"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="sold-items-grid">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                className="sold-item-card"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img src={item.image_url || "/placeholder.svg"} alt={item.name} className="item-image" />
                <div className="item-infos">
                  <h3>{item.name}</h3>
                  <p className="item-price">₹{item.price}</p>
                  <p className="sale-date">Sold on: {new Date(item.sale_date).toLocaleDateString()}</p>
                  <p className="buyer-info">Buyer: {item.buyer_username}</p>
                </div>
              </motion.div>
            ))}
          </div>
          {filteredItems.length === 0 && <p className="no-items">No sold items found.</p>}
        </motion.div>
      </main>
    </div>
  )
}

export default Sold

