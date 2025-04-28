"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FaUser, FaLock, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCamera, FaTimes } from "react-icons/fa"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../utils/AuthContext"
import "../styles/Signup.css"
import signupImage from "../assets/signup.jpg"

const Toast = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    className={`toast-message ${type}`}
    style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "1rem",
      borderRadius: "4px",
      backgroundColor: type === "error" ? "#ff4444" : "#44b700",
      color: "white",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    }}
  >
    <span>{message}</span>
    <button
      onClick={onClose}
      style={{
        background: "none",
        border: "none",
        color: "white",
        cursor: "pointer",
      }}
    >
      <FaTimes />
    </button>
  </motion.div>
)

const Signup = () => {
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    city: "",
    profilePicture: null,
  })

  const [errors, setErrors] = useState({})
  const [selectedFileName, setSelectedFileName] = useState("")
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  })

  useEffect(() => {
    window.scrollTo(0, 0)
    if (user) {
      navigate("/products")
    }
  }, [navigate, user])

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prevToast) => ({ ...prevToast, show: false }))
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toast.show])

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === "profilePicture" && files && files[0]) {
      setFormData({ ...formData, [name]: files[0] })
      setSelectedFileName(files[0].name)
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const validateForm = useCallback(() => {
    const newErrors = {}

    if (!formData.username.trim()) newErrors.username = "Username is required"
    else if (formData.username.length < 3) newErrors.username = "Username must be at least 3 characters long"

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email format"

    if (!formData.password) newErrors.password = "Password is required"
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters long"

    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match"

    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (formData.phone && !phoneRegex.test(formData.phone)) newErrors.phone = "Invalid phone number format"

    if (formData.city && formData.city.length < 2) newErrors.city = "City name is too short"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null) {
        formDataToSend.append(key, formData[key]);
      }
    });
  
    try {
      const response = await fetch("http://localhost:8000/signup", {
        method: "POST",
        body: formDataToSend,
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      login(data.user);
      localStorage.setItem("token", data.token);
      setToast({ show: true, message: "Registration successful!", type: "success" });
      setTimeout(() => navigate("/products"), 1000); // Delay navigation to show toast
    } catch (error) {
      console.error("Signup error:", error);
      setToast({
        show: true,
        message: error.message || "An error occurred. Please try again.",
        type: "error",
      });
    }
  };
  return (
    <div className="signup-container">
      <AnimatePresence>
        {toast.show && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="signup-form-container"
      >
        <div className="signup-image">
          <img src={signupImage || "/placeholder.svg"} alt="Signup" />
        </div>
        <div className="signup-form-wrapper">
          <div className="signup-form-content">
            <div className="signup-header">
              <h2>Create Account</h2>
              <p>Join us today and start your journey</p>
            </div>

            <form onSubmit={handleSubmit} className="signup-form" encType="multipart/form-data">
              <div className="form-group">
                <FaUser className="form-icon" />
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
                {errors.username && <p className="error-message">{errors.username}</p>}
              </div>

              <div className="form-group">
                <FaEnvelope className="form-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && <p className="error-message">{errors.email}</p>}
              </div>

              <div className="form-group">
                <FaLock className="form-icon" />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                {errors.password && <p className="error-message">{errors.password}</p>}
              </div>

              <div className="form-group">
                <FaLock className="form-icon" />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
              </div>

              <div className="form-group">
                <FaPhone className="form-icon" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
                {errors.phone && <p className="error-message">{errors.phone}</p>}
              </div>

              <div className="form-group">
                <FaMapMarkerAlt className="form-icon" />
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                />
                {errors.city && <p className="error-message">{errors.city}</p>}
              </div>

              <div className="form-group">
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    name="profilePicture"
                    onChange={handleChange}
                    className="file-input"
                    accept="image/*"
                    id="profilePicture"
                  />
                  <label htmlFor="profilePicture" className="file-input-label">
                    <FaCamera className="form-icon" />
                    <span>{selectedFileName || "Choose Profile Picture"}</span>
                  </label>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="submit-button"
                type="submit"
              >
                Sign Up
              </motion.button>
            </form>

            <div className="login-link">
              <p>Already have an account?</p>
              <Link to="/login">Log in</Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Signup