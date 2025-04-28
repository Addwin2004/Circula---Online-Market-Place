"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, ArrowLeft, ShoppingCart } from "lucide-react";
import "../styles/ItemDetail.css";

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          // eslint-disable-next-line
          const [_, payload] = token.split(".");
          const decodedPayload = JSON.parse(atob(payload));
          setCurrentUserId(decodedPayload.userId);
        }

        const response = await fetch(`http://localhost:8000/api/items/${id}`);
        if (!response.ok) throw new Error("Failed to fetch item details");
        const data = await response.json();
        setItem(data);
        setIsLoading(false);

        if (token) {
          const wishlistResponse = await fetch("http://localhost:8000/api/wishlist", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (wishlistResponse.ok) {
            const wishlistData = await wishlistResponse.json();
            setIsInWishlist(wishlistData.some((item) => item.item_id === Number.parseInt(id)));
          }
        }
      } catch (error) {
        console.error("Error fetching item details:", error);
        setError("Failed to load item details");
        setIsLoading(false);
      }
    };

    fetchItemDetails();
  }, [id]);

  const handleWishlistToggle = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/wishlist/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId: Number.parseInt(id) }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle wishlist");
      }

      const data = await response.json();
      setIsInWishlist(!data.removed);
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      alert("Failed to update wishlist. Please try again.");
    }
  };

  const createOrder = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return null;
    }

    try {
      const response = await fetch("http://localhost:8000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: Number.parseInt(id),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create order");
      }

      const orderData = await response.json();
      console.log("Order created:", orderData);
      return orderData.id; // Make sure this property name matches what your API returns
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  };

  const handlePurchase = async () => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }

    if (item.is_sold === "Yes") {
      alert("This item has already been sold.");
      return;
    }

    setIsProcessing(true);
    try {
      const orderId = await createOrder();
      console.log("Created order ID:", orderId);
      if (orderId) {
        // Use window.location.href instead of navigate
        window.location.href = `/payment/${orderId}`;
      } else {
        throw new Error("No order ID received");
      }
    } catch (error) {
      console.error("Error in purchase process:", error);
      alert(error.message || "Failed to process purchase. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (error || !item) {
    return <div className="error">{error || "Item not found"}</div>;
  }

  const formattedPrice =
    typeof item.price === "number" ? item.price.toFixed(2) : Number.parseFloat(item.price).toFixed(2);
  const sellerProfilePicture = item.seller_profile_picture
    ? `http://localhost:8000/uploads/${item.seller_profile_picture}`
    : "/placeholder.svg";
  const itemImageUrl = item.image_url ? `http://localhost:8000${item.image_url}` : "/placeholder.svg";
  const isCurrentUserSeller = currentUserId === item.customer_id;

  return (
    <div className="item-detail-container">
      <button className="back-button" onClick={() => navigate("/products")}>
        <ArrowLeft size={20} /> Back to Products
      </button>
      <div className="item-detail-content">
        <div className="item-image-container">
          <img src={itemImageUrl || "/placeholder.svg"} alt={item.name} className="item-image" />
          <button onClick={handleWishlistToggle} className={`wishlist-overlay ${isInWishlist ? "in-wishlist" : ""}`}>
            <Heart size={24} className={isInWishlist ? "filled" : ""} />
          </button>
        </div>
        <div className="product-details">
          <h1 className="item-name">{item.name}</h1>
          <p className="item-price">₹{formattedPrice}</p>
          <div className="seller-info">
            <div className="seller-header">
              <img src={sellerProfilePicture || "/placeholder.svg"} alt={item.seller_name} className="seller-avatar" />
              <span className="seller-name">{item.seller_name}</span>
            </div>
            <div className="seller-contact-details">
              <p className="seller-email">
                <strong>Email:</strong> {item.seller_email || "N/A"}
              </p>
              <p className="seller-phone">
                <strong>Phone:</strong> {item.seller_phone || "N/A"}
              </p>
              <p className="contact-message">
                Feel free to contact the seller before making a purchase!
              </p>
            </div>
          </div>
          <p className="item-description">{item.description}</p>
          <p className="listing-date">Listed on: {new Date(item.created_at).toLocaleDateString()}</p>
          <div className="action-buttons">
            {!isCurrentUserSeller && item.is_sold === "No" && (
              <button className="purchase-button" onClick={handlePurchase} disabled={isProcessing}>
                <ShoppingCart size={20} /> {isProcessing ? "Processing..." : "Purchase"}
              </button>
            )}
            {item.is_sold === "Yes" && <p className="sold-message">This item has been sold</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;