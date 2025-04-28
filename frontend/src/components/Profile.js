"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../utils/AuthContext"
import { motion } from "framer-motion"
import { User, Mail, Phone, MapPin, Camera, Heart, Package, ShoppingBag, DollarSign, CreditCard } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import "../styles/Profile.css"

function Profile() {
  useEffect(() => {
      window.scrollTo(0, 0);
    }, []);
  const { user, login } = useAuth()
  const location = useLocation()
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    phone: "",
    city: "",
    profile_picture: "",
  })
  const [activeTab, setActiveTab] = useState("profile")
  const [isEditing, setIsEditing] = useState(false)
  const [newProfilePicture, setNewProfilePicture] = useState(null)

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          console.error("No token found")
          return
        }

        const response = await fetch("http://localhost:8000/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setProfileData(data)
          login(data)
        } else {
          console.error("Failed to fetch profile:", response.status)
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      }
    }

    if (!user) {
      fetchProfileData()
    } else {
      setProfileData(user)
    }
  }, [user, login])

  useEffect(() => {
    const currentPath = location.pathname.split("/")[1]
    setActiveTab(currentPath || "profile")
  }, [location])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    setNewProfilePicture(e.target.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem("token")
    if (!token) {
      console.error("No token found")
      return
    }

    const formData = new FormData()
    formData.append("username", profileData.username || '')
    formData.append("email", profileData.email || '')
    formData.append("phone", profileData.phone || '')
    formData.append("city", profileData.city || '')

    if (newProfilePicture) {
      formData.append("profilePicture", newProfilePicture)
    }

    try {
      const response = await fetch("http://localhost:8000/api/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfileData(updatedProfile)
        login(updatedProfile)
        setIsEditing(false)
        setNewProfilePicture(null)
      } else {
        console.error("Failed to update profile:", response.status)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
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

      <main className="profile-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="profile-card"
        >
          <div className="profile-header">
            <div className="profile-image-container">
              {profileData.profile_picture ? (
                <img
                  src={`http://localhost:8000${profileData.profile_picture}`}
                  alt="Profile"
                  className="profile-image"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = "/placeholder.svg"
                  }}
                />
              ) : (
                <div className="profile-image-placeholder">
                  <User className="placeholder-icon" />
                </div>
              )}
              {isEditing && (
                <label htmlFor="profile-picture-input" className="change-photo-btn">
                  <Camera className="camera-icon" />
                  <input
                    id="profile-picture-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </label>
              )}
            </div>
            {isEditing ? (
              <input
                type="text"
                name="username"
                value={profileData.username}
                onChange={handleInputChange}
                className="username-input"
                placeholder="Enter username"
              />
            ) : (
              <h1 className="profile-name">{profileData.username}</h1>
            )}
          </div>

          <form onSubmit={handleSubmit} className="profile-details">
            <div className="detail-item">
              <Mail className="detail-icon" />
              <div>
                <p className="detail-label">Email</p>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    className="detail-input"
                  />
                ) : (
                  <p className="detail-value">{profileData.email}</p>
                )}
              </div>
            </div>

            <div className="detail-item">
              <Phone className="detail-icon" />
              <div>
                <p className="detail-label">Phone</p>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    className="detail-input"
                  />
                ) : (
                  <p className="detail-value">{profileData.phone || "Not provided"}</p>
                )}
              </div>
            </div>

            <div className="detail-item">
              <MapPin className="detail-icon" />
              <div>
                <p className="detail-label">City</p>
                {isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={profileData.city}
                    onChange={handleInputChange}
                    className="detail-input"
                  />
                ) : (
                  <p className="detail-value">{profileData.city || "Not provided"}</p>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="button-group">
                <motion.button
                  type="submit"
                  className="save-profile-btn"
                  whileHover={{ scale: 1.05, boxShadow: "0 4px 20px rgba(99, 102, 241, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Save Changes
                </motion.button>
                <motion.button
                  type="button"
                  className="cancel-edit-btn"
                  onClick={() => {
                    setIsEditing(false)
                    setNewProfilePicture(null)
                    setProfileData(user || {
                      username: "",
                      email: "",
                      phone: "",
                      city: "",
                      profile_picture: "",
                    })
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
              </div>
            ) : (
              <motion.button
                type="button"
                className="edit-profile-btn"
                onClick={() => setIsEditing(true)}
                whileHover={{ scale: 1.05, boxShadow: "0 4px 20px rgba(99, 102, 241, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                Edit Profile
              </motion.button>
            )}
          </form>
        </motion.div>
      </main>
    </div>
  )
}

export default Profile