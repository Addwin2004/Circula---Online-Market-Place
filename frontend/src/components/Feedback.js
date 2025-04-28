import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaStar, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import feedbackImage from "../assets/feedback.png";
import "../styles/Feedback.css";

const Feedback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLoginErrorModal, setShowLoginErrorModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      setShowLoginErrorModal(true);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, message }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setShowSuccessModal(true);
      setRating(0);
      setMessage("");
    } catch (err) {
      setError("Failed to submit feedback. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMessageChange = (e) => {
    const text = e.target.value;
    if (text.length <= 250) {
      setMessage(text);
    }
  };

  // Success Modal Component
  const SuccessModal = () => (
    <div className="success-modal-overlay">
      <motion.div 
        className="success-modal"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="success-modal-content">
          <FaCheckCircle className="success-icon" />
          <h3>Feedback Submitted Successfully!</h3>
          <p>Thank you for helping us improve our service.</p>
          <button onClick={() => setShowSuccessModal(false)} className="close-modal-btn">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );

  // Login Error Modal Component
  const LoginErrorModal = () => (
    <div className="success-modal-overlay">
      <motion.div 
        className="success-modal error-modal"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="success-modal-content">
          <FaExclamationCircle className="error-icon" />
          <h3>Login Required</h3>
          <p>Please log in to submit feedback.</p>
          <div className="modal-buttons">
            <button 
              onClick={() => navigate('/login')} 
              className="login-btn"
            >
              Go to Login
            </button>
            <button 
              onClick={() => setShowLoginErrorModal(false)} 
              className="close-modal-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="feedback-container">
      {/* Success Modal */}
      {showSuccessModal && <SuccessModal />}
      
      {/* Login Error Modal */}
      {showLoginErrorModal && <LoginErrorModal />}

      <div className="feedback-content">
        <div className="feedback-image-container">
          <img
            src={feedbackImage || "/placeholder.svg"}
            alt="Feedback"
            className="feedback-image"
          />
        </div>
        <div className="feedback-form-container">
          <h2>We'd love to hear from you!</h2>
          <p>Your feedback helps us improve our service.</p>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="form-group">
              <label>Your Rating</label>
              <div className="star-rating">
                {[...Array(5)].map((star, index) => {
                  index += 1;
                  return (
                    <button
                      type="button"
                      key={index}
                      className={index <= (hover || rating) ? "on" : "off"}
                      onClick={() => setRating(index)}
                      onMouseEnter={() => setHover(index)}
                      onMouseLeave={() => setHover(rating)}
                    >
                      <FaStar className="star" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="message">Your Message</label>
              <textarea
                id="message"
                value={message}
                onChange={handleMessageChange}
                maxLength={250}
                required
              ></textarea>
              <div className="character-count">{message.length}/250</div>
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Feedback;