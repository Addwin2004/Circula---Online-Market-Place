"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Calendar, User, Lock, CheckCircle, ShoppingBag } from "lucide-react";
import paymentImage from "../assets/payment.png";
import "../styles/Payment.css";

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cardHolderName: "",
    cvv: "",
  });
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [existingCard, setExistingCard] = useState(null);
  const [useExistingCard, setUseExistingCard] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Fetch order details and existing card
  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) {
      setError("Order ID is missing");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      console.log("Fetching order with ID:", orderId, "Token:", token);
      const response = await fetch(`http://localhost:8000/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Server response:", errorData);
        throw new Error(errorData.message || `Failed to fetch order details (Status: ${response.status})`);
      }

      const data = await response.json();
      setOrder({ ...data, status: data.status || "Pending" });

      const cardResponse = await fetch("http://localhost:8000/api/user/card", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (cardResponse.ok) {
        const cardData = await cardResponse.json();
        if (cardData) {
          setExistingCard(cardData);
          setUseExistingCard(true);
          setCardDetails({
            cardNumber: cardData.card_number,
            expiryDate: `${cardData.expiry_date.substring(5, 7)}/${cardData.expiry_date.substring(2, 4)}`,
            cardHolderName: cardData.card_holder_name,
            cvv: "",
          });
        }
      }

      setError(null);
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [orderId, navigate]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    switch (name) {
      case "cardNumber":
        formattedValue = value.replace(/\D/g, "").substring(0, 16);
        break;
      case "expiryDate":
        formattedValue = value
          .replace(/\D/g, "")
          .replace(/(\d{2})(\d{0,2})/, (_, p1, p2) => (p2 ? `${p1}/${p2}` : p1))
          .substring(0, 5);
        break;
      case "cvv":
        formattedValue = value.replace(/\D/g, "").substring(0, 3);
        break;
      default:
        formattedValue = value;
    }

    setCardDetails((prev) => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (useExistingCard) {
      if (!/^\d{3}$/.test(cardDetails.cvv)) {
        newErrors.cvv = "CVV must be 3 digits";
      }
    } else {
      if (!/^\d{16}$/.test(cardDetails.cardNumber.replace(/\s/g, ""))) {
        newErrors.cardNumber = "Card number must be 16 digits";
      }

      if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
        newErrors.expiryDate = "Expiry date must be in MM/YY format";
      } else {
        const [month, year] = cardDetails.expiryDate.split("/");
        const now = new Date();
        const currentYear = now.getFullYear() % 100;
        const currentMonth = now.getMonth() + 1;

        if (
          Number(year) < currentYear ||
          (Number(year) === currentYear && Number(month) < currentMonth) ||
          Number(month) > 12 ||
          Number(month) < 1
        ) {
          newErrors.expiryDate = "Invalid expiry date";
        }
      }

      if (cardDetails.cardHolderName.trim().length < 3) {
        newErrors.cardHolderName = "Card holder name must be at least 3 characters";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsProcessing(true);
    setErrors({}); // Clear previous errors

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const paymentData = {
        orderId,
        cardDetails: useExistingCard
          ? {
              cardNumber: existingCard.card_number.replace(/\D/g, ""),
              expiryDate: cardDetails.expiryDate,
              cardHolderName: existingCard.card_holder_name,
              cvv: cardDetails.cvv,
            }
          : {
              cardNumber: cardDetails.cardNumber.replace(/\D/g, ""),
              expiryDate: cardDetails.expiryDate,
              cardHolderName: cardDetails.cardHolderName.trim(),
              cvv: cardDetails.cvv,
            },
      };

      console.log("Sending payment data:", paymentData);

      const response = await fetch("http://localhost:8000/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.message && responseData.message.toLowerCase().includes("sold out")) {
          setErrors({ form: "Sorry, Item is Sold Out..." });
          setTimeout(() => navigate("/products"), 3000); // Redirect after 3 seconds
          return;
        }
        throw new Error(responseData.message || "Payment failed. Please try again.");
      }

      if (responseData.status === "Success") {
        setPaymentSuccess(true);
      } else {
        throw new Error(responseData.message || "Payment was not successful");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      setErrors({
        form: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Navigation handler
  const handleGoToProducts = () => {
    navigate("/products");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading payment details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/products")} className="error-button">
          Return to Products
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="error-container">
        <h2>Order Not Found</h2>
        <p>The requested order could not be found.</p>
        <button onClick={() => navigate("/products")} className="error-button">
          Return to Products
        </button>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <AnimatePresence>
        {paymentSuccess ? (
          <motion.div
            className="payment-success-container"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="success-circle"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.8, times: [0, 0.8, 1] }}
            >
              <motion.div
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 1, pathLength: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <CheckCircle size={100} color="#4CAF50" strokeWidth={2} />
              </motion.div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.5 }}
              className="success-title"
            >
              Payment Successful!
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="success-details"
            >
              <p>Your order has been confirmed</p>
              <p className="order-id">Order ID: {orderId}</p>
              <p className="order-amount">Amount: ₹{order.total_amount}</p>
            </motion.div>

            <motion.button
              className="go-to-products-button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGoToProducts}
            >
              <ShoppingBag className="button-icon" size={18} />
              Go to Products
            </motion.button>
          </motion.div>
        ) : (
          <div className="payment-content">
            <div className="payment-image-container">
              <img src={paymentImage || "/placeholder.svg"} alt="Secure Payment" className="payment-image" />
            </div>
            <div className="payment-form-container">
              <h2>Complete Your Purchase</h2>
              <div className="item-summary">
                <img
                  src={order.item_image_url ? `http://localhost:8000${order.item_image_url}` : "/placeholder.svg"}
                  alt={order.item_name}
                  className="item-image"
                />
                <div className="item-details">
                  <h3>{order.item_name}</h3>
                  <p className="item-price">₹{order.total_amount}</p>
                </div>
              </div>

              {existingCard && (
                <div className="existing-card">
                  <h3>Saved Card</h3>
                  <p>Card ending in {existingCard.card_number.slice(-4)}</p>
                  <label className="use-card-label">
                    <input
                      type="checkbox"
                      checked={useExistingCard}
                      onChange={(e) => setUseExistingCard(e.target.checked)}
                      className="use-card-checkbox"
                    />
                    <span>Use this card</span>
                  </label>
                </div>
              )}

              <form onSubmit={handleSubmit} className="payment-form">
                {!useExistingCard && (
                  <>
                    <div className="form-group">
                      <label htmlFor="cardNumber">Card Number</label>
                      <div className="input-icon-wrapper">
                        <CreditCard className="input-icon" />
                        <input
                          type="text"
                          id="cardNumber"
                          name="cardNumber"
                          value={cardDetails.cardNumber}
                          onChange={handleInputChange}
                          placeholder="1234567890123456"
                          maxLength="16"
                        />
                      </div>
                      {errors.cardNumber && <span className="error-message">{errors.cardNumber}</span>}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="expiryDate">Expiry Date</label>
                        <div className="input-icon-wrapper">
                          <Calendar className="input-icon" />
                          <input
                            type="text"
                            id="expiryDate"
                            name="expiryDate"
                            value={cardDetails.expiryDate}
                            onChange={handleInputChange}
                            placeholder="MM/YY"
                            maxLength="5"
                          />
                        </div>
                        {errors.expiryDate && <span className="error-message">{errors.expiryDate}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="cardHolderName">Card Holder Name</label>
                        <div className="input-icon-wrapper">
                          <User className="input-icon" />
                          <input
                            type="text"
                            id="cardHolderName"
                            name="cardHolderName"
                            value={cardDetails.cardHolderName}
                            onChange={handleInputChange}
                            placeholder="John Doe"
                          />
                        </div>
                        {errors.cardHolderName && <span className="error-message">{errors.cardHolderName}</span>}
                      </div>
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label htmlFor="cvv">CVV</label>
                  <div className="input-icon-wrapper">
                    <Lock className="input-icon" />
                    <input
                      type="password"
                      id="cvv"
                      name="cvv"
                      value={cardDetails.cvv}
                      onChange={handleInputChange}
                      placeholder="123"
                      maxLength="3"
                    />
                  </div>
                  {errors.cvv && <span className="error-message">{errors.cvv}</span>}
                </div>

                {errors.form && <div className="error-message form-error">{errors.form}</div>}

                <motion.button
                  type="submit"
                  className="submit-button"
                  disabled={isProcessing}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isProcessing ? "Processing..." : `Pay ₹${order.total_amount}`}
                </motion.button>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Payment;