"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from '../utils/AuthContext';
import signinImage from "../assets/signin.jpg";
import "../styles/Login.css";

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
      <X size={16} />
    </button>
  </motion.div>
);

const Login = () => {
  const navigate = useNavigate();
  const { login: contextLogin } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    window.scrollTo(0, 0)
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prevToast) => ({ ...prevToast, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:8000/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Login failed");
        }

        const data = await response.json();
        
        // Check if user account is inactive
        if (data.user.status === "Inactive") {
          setToast({
            show: true,
            message: "Your account is inactive. Please contact support.",
            type: "error",
          });
          setIsLoading(false);
          return; // Stop the login process
        }

        setToast({
          show: true,
          message: "Login successful!",
          type: "success",
        });

        localStorage.setItem("token", data.token);
        localStorage.setItem("userRole", data.user.role); // Store role in localStorage
        contextLogin(data.user);

        if (data.user.role === "Admin") {
          navigate("/admin-dashboard"); // Redirect Admins to AdminDashboard
        } else {
          navigate("/products"); // Redirect Customers to Products page
        }
      } catch (error) {
        console.error("Login error:", error);
        setToast({
          show: true,
          message: error.message || "An error occurred. Please try again.",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="login-container">
      <AnimatePresence>
        {toast.show && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="login-form-container"
      >
        <div className="login-image">
          <img src={signinImage || "/placeholder.svg"} alt="Login" />
        </div>
        <div className="login-form-wrapper">
          <div className="login-form-content">
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue your journey</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <Mail className="form-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? "error" : ""}
                />
                <AnimatePresence>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="error-message"
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="form-group">
                <Lock className="form-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? "error" : ""}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <AnimatePresence>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="error-message"
                    >
                      {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="submit-button"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div className="spinner-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="spinner" />
                  </motion.div>
                ) : (
                  "Sign In"
                )}
              </motion.button>
            </form>

            <div className="signup-link">
              <p>Don't have an account?</p>
              <Link to="/signup">Sign up</Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;