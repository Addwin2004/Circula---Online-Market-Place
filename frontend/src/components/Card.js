"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../utils/AuthContext"
import { motion } from "framer-motion"
import { User, Heart, Package, ShoppingBag, DollarSign, CreditCard, Calendar,  Trash2, Edit } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import "../styles/Profile.css"
import "../styles/Card.css"

function Card() {
  useAuth()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState("card")
  const [card, setCard] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    cardHolderName: "",
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchCard()
  }, [])

  useEffect(() => {
    const currentPath = location.pathname.split("/")[1]
    setActiveTab(currentPath || "card")
  }, [location])

  const fetchCard = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8000/api/user/card", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCard(data)
        
        if (data) {
          // Store the full unmasked card number for editing
          setFormData({
            cardNumber: data.card_number,
            expiryDate: `${data.expiry_date.substring(5, 7)}/${data.expiry_date.substring(2, 4)}`,
            cardHolderName: data.card_holder_name,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching card:", error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    let formattedValue = value

    if (name === "cardNumber") {
      formattedValue = value.replace(/\D/g, "").substring(0, 16)
    } else if (name === "expiryDate") {
      formattedValue = value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d{0,2})/, (_, p1, p2) => (p2 ? `${p1}/${p2}` : p1))
        .substring(0, 5)
    } else if (name === "cardHolderName") {
      formattedValue = value.substring(0, 25)
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!/^\d{16}$/.test(formData.cardNumber)) {
      newErrors.cardNumber = "Card number must be 16 digits"
    }
    if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = "Expiry date must be in MM/YY format"
    } else {
      const [month, year] = formData.expiryDate.split("/")
      const now = new Date()
      const currentYear = now.getFullYear() % 100
      const currentMonth = now.getMonth() + 1

      if (
        Number(year) < currentYear ||
        (Number(year) === currentYear && Number(month) < currentMonth) ||
        Number(month) > 12 ||
        Number(month) < 1
      ) {
        newErrors.expiryDate = "Invalid expiry date"
      }
    }
    if (formData.cardHolderName.trim().length < 3) {
      newErrors.cardHolderName = "Card holder name must be at least 3 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const [month, year] = formData.expiryDate.split("/")
      const formattedDate = `20${year}-${month}-01`

      const response = await fetch("http://localhost:8000/api/user/card", {
        method: card ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cardNumber: formData.cardNumber,
          expiryDate: formattedDate,
          cardHolderName: formData.cardHolderName,
        }),
      })

      if (response.ok) {
        await fetchCard()
        setIsEditing(false)
      } else {
        const data = await response.json()
        throw new Error(data.message)
      }
    } catch (error) {
      setErrors((prev) => ({ ...prev, submit: error.message }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCard = async () => {
    if (!window.confirm("Are you sure you want to delete this card?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8000/api/user/card", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setCard(null)
        setFormData({
          cardNumber: "",
          expiryDate: "",
          cardHolderName: "",
        })
      } else {
        const data = await response.json()
        throw new Error(data.message)
      }
    } catch (error) {
      console.error("Error deleting card:", error)
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

  // Function to format card number with spaces for display
  const formatCardNumber = (number) => {
    if (!number) return "";
    // Remove any non-digits
    const digitsOnly = number.replace(/\D/g, "");
    // Add a space every 4 digits
    return digitsOnly.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  // Function to get card type based on first digit
  const getCardType = (number) => {
    if (!number) return "";
    const firstDigit = number.charAt(0);
    
    switch (firstDigit) {
      case "4":
        return "Visa";
      case "5":
        return "MasterCard";
      case "3":
        return "American Express";
      case "6":
        return "Discover";
      default:
        return "Credit Card";
    }
  }

  // Function to get card background color based on card type (using lighter colors)
  const getCardBackground = () => {
    if (!card || !card.card_number) return "linear-gradient(135deg, #90caf9 0%, #bbdefb 100%)";
    
    const cardType = getCardType(card.card_number);
    
    switch (cardType) {
      case "Visa":
        return "linear-gradient(135deg, #bbdefb 0%, #e3f2fd 100%)";
      case "MasterCard":
        return "linear-gradient(135deg, #f8bbd0 0%, #fce4ec 100%)";
      case "American Express":
        return "linear-gradient(135deg, #b2dfdb 0%, #e0f2f1 100%)";
      case "Discover":
        return "linear-gradient(135deg, #ffe0b2 0%, #fff3e0 100%)";
      default:
        return "linear-gradient(135deg, #90caf9 0%, #bbdefb 100%)";
    }
  }

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card-management"
        >
          {/* <div className="card-header">
            <h2>Card Management</h2>
            {!card && !isEditing && (
              <motion.button
                className="add-card-btn"
                onClick={() => setIsEditing(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus size={20} />
                Add Card
              </motion.button>
            )}
          </div> */}

          {card && !isEditing ? (
            <motion.div
              className="card-item"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{ 
                background: getCardBackground(),
                borderRadius: "12px",
                padding: "24px",
                color: "#424242",
                boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {/* Card type moved from top right corner */}
              
              <div 
                style={{
                  position: "absolute",
                  bottom: "15px",
                  right: "20px",
                  opacity: "0.1",
                  fontSize: "180px",
                  lineHeight: "0",
                  transform: "rotate(-15deg)",
                  transformOrigin: "bottom right",
                  pointerEvents: "none" // Added to ensure it doesn't block clicks
                }}
              >
                ○
              </div>
              
              {/* Horizontally aligned action buttons with zIndex to ensure they're clickable */}
              <div style={{ 
                position: "absolute", 
                top: "15px", 
                right: "20px", 
                display: "flex", 
                gap: "8px",
                alignItems: "center",
                zIndex: "2" // Added to ensure buttons are clickable
              }}>
                <motion.button 
                  className="edit-card-btn" 
                  onClick={() => setIsEditing(true)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.15)",
                    border: "none",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer"
                  }}
                >
                  <Edit size={16} color="#424242" />
                </motion.button>
                <motion.button 
                  className="delete-card-btn" 
                  onClick={handleDeleteCard}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.15)",
                    border: "none",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer"
                  }}
                >
                  <Trash2 size={16} color="#424242" />
                </motion.button>
              </div>
              
              <div className="card-content" style={{ position: "relative", zIndex: "1" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "30px" }}>
                  <CreditCard size={32} className="card-icon" style={{ marginRight: "10px" }} />
                  <h3 style={{ fontSize: "22px", margin: "0" }}>{getCardType(card.card_number)}</h3>
                </div>
                
                <p className="card-number" style={{ 
                  fontSize: "20px", 
                  letterSpacing: "2px", 
                  margin: "20px 0",
                  fontFamily: "monospace"
                }}>
                  {formatCardNumber(card.card_number)}
                </p>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <p style={{ fontSize: "12px", margin: "0", opacity: "0.7" }}>CARD HOLDER</p>
                    <p className="card-holder" style={{ fontSize: "16px", margin: "5px 0 0", fontWeight: "bold" }}>
                      {card.card_holder_name.toUpperCase()}
                    </p>
                  </div>
                  
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "12px", margin: "0", opacity: "0.7" }}>EXPIRES</p>
                    <p className="card-expiry" style={{ fontSize: "16px", margin: "5px 0 0", fontWeight: "bold" }}>
                      {new Date(card.expiry_date).toLocaleDateString("en-US", { month: "2-digit", year: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="add-card-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <h3>{card ? "Edit Card" : "Add New Card"}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Card Number</label>
                  <div className="input-icon-wrapper">
                    <CreditCard className="input-icon" />
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength="16"
                    />
                  </div>
                  {errors.cardNumber && <span className="error-message">{errors.cardNumber}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <div className="input-icon-wrapper">
                      <Calendar className="input-icon" />
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        maxLength="5"
                      />
                    </div>
                    {errors.expiryDate && <span className="error-message">{errors.expiryDate}</span>}
                  </div>

                  <div className="form-group">
                    <label>Card Holder Name</label>
                    <div className="input-icon-wrapper">
                      <User className="input-icon" />
                      <input
                        type="text"
                        name="cardHolderName"
                        value={formData.cardHolderName}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        maxLength="25"
                      />
                    </div>
                    {errors.cardHolderName && <span className="error-message">{errors.cardHolderName}</span>}
                  </div>
                </div>

                {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

                <div className="form-actions">
                  <motion.button
                    type="submit"
                    className="save-card-btn"
                    disabled={isLoading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isLoading ? "Saving..." : card ? "Update Card" : "Save Card"}
                  </motion.button>
                  <motion.button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setIsEditing(false)
                      if (card) {
                        // Reset to original card data when canceling edit
                        setFormData({
                          cardNumber: card.card_number,
                          expiryDate: `${card.expiry_date.substring(5, 7)}/${card.expiry_date.substring(2, 4)}`,
                          cardHolderName: card.card_holder_name,
                        })
                      } else {
                        setFormData({
                          cardNumber: "",
                          expiryDate: "",
                          cardHolderName: "",
                        })
                      }
                      setErrors({})
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

export default Card