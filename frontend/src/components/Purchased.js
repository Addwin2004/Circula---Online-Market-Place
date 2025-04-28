"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { User, Heart, Package, ShoppingBag, DollarSign, CreditCard, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import "../styles/Purchased.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const Purchased = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("purchased");
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState("7days"); // Default to last 7 days
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const currentPath = location.pathname.split("/")[1];
    setActiveTab(currentPath || "purchased");
  }, [location]);

  const filterItemsByTimeRange = useCallback((items, range) => {
    const now = new Date();
    let filtered = items;

    if (range === "7days") {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      filtered = items.filter(
        (item) => new Date(item.purchase_date) >= sevenDaysAgo
      );
    } else if (range === "1month") {
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      filtered = items.filter(
        (item) => new Date(item.purchase_date) >= oneMonthAgo
      );
    } else if (range === "6months") {
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      filtered = items.filter(
        (item) => new Date(item.purchase_date) >= sixMonthsAgo
      );
    } else {
      // "all" - no filtering by date
      filtered = items;
    }

    // Apply search term filter after time range filter
    filtered = filtered.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchTerm]);

  const fetchPurchasedItems = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await fetch("http://localhost:8000/api/user/purchased", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch purchased items");
      const data = await response.json();
      setPurchasedItems(data);
      setLoading(false);
      filterItemsByTimeRange(data, "7days"); // Apply default filter
    } catch (error) {
      console.error("Error fetching purchased items:", error);
      setError(error.message);
      setLoading(false);
    }
  }, [filterItemsByTimeRange]); // Include filterItemsByTimeRange as a dependency

  useEffect(() => {
    fetchPurchasedItems();
  }, [fetchPurchasedItems, filterItemsByTimeRange]); // Added fetchPurchasedItems to the dependency array

  const handleTimeRangeChange = (e) => {
    const selectedRange = e.target.value;
    setTimeRange(selectedRange);
    filterItemsByTimeRange(purchasedItems, selectedRange);
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterItemsByTimeRange(purchasedItems, timeRange);
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await fetch(`http://localhost:8000/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch order details");
      const data = await response.json();
      setSelectedOrder(data);
      setIsPopupOpen(true);
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError(error.message);
    }
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedOrder(null);
  };

  const downloadPDF = async () => {
    if (!selectedOrder) return;

    const input = document.getElementById("bill-content");
    if (!input) return;

    try {
      const canvas = await html2canvas(input, {
        scale: 1.5,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > pageHeight) {
        const scaleFactor = pageHeight / imgHeight;
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight * scaleFactor);
      } else {
        pdf.addImage(imgData, "PNG", 0, (pageHeight - imgHeight) / 2, imgWidth, imgHeight);
      }

      pdf.save(`bill_${selectedOrder.orderId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to generate PDF");
    }
  };

  const sidebarItems = [
    { name: "Profile", icon: User, link: "/profile" },
    { name: "Wishlist", icon: Heart, link: "/wishlist" },
    { name: "Products", icon: Package, link: "/user-products" },
    { name: "Purchased", icon: ShoppingBag, link: "/purchased" },
    { name: "Sold", icon: DollarSign, link: "/sold" },
    { name: "Card", icon: CreditCard, link: "/card" },
  ];

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

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
        >
          <h1 className="page-title">Purchased Items</h1>
          <div className="filters-container">
            <div className="search-bars">
              <Search className="search-icon-purchased" />
              <input
                type="text"
                placeholder="Search purchased items"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <div className="time-filter">
              <select value={timeRange} onChange={handleTimeRangeChange}>
                <option value="7days">Last 7 Days</option>
                <option value="1month">Last 1 Month</option>
                <option value="6months">Last 6 Months</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
          <div className="purchased-items-grid">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                className="purchased-item-card"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchOrderDetails(item.id)}
                style={{ cursor: "pointer" }}
              >
                <img
                  src={item.image_url || "/placeholder.svg"}
                  alt={item.name}
                  className="item-image"
                />
                <div className="item-infos">
                  <h3>{item.name}</h3>
                  <p className="item-price">₹{item.price}</p>
                  <p className="purchase-date">
                    Purchased on: {new Date(item.purchase_date).toLocaleDateString()}
                  </p>
                  <p className="seller-info">Previous Owner: {item.seller_username}</p>
                  <p className="seller-info">Email: {item.seller_email}</p>
                </div>
              </motion.div>
            ))}
          </div>
          {filteredItems.length === 0 && <p className="no-items">No purchased items found.</p>}
        </motion.div>
      </main>

      {/* Popup Modal for Bill Details */}
      {isPopupOpen && selectedOrder && (
        <div className="modal-overlay" onClick={closePopup}>
          <motion.div
            className="modal-content1"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Bill Details</h2>
            <button className="close-button" onClick={closePopup}>
              ×
            </button>
            <div className="bill-details" id="bill-content">
              {/* Header Section */}
              <div style={{ textAlign: "center", marginBottom: "20px", padding: "10px", backgroundColor: "#f5f6fa" }}>
                <h3 style={{ fontSize: "28px", color: "#2d3748", fontWeight: "bold", margin: "0" }}>Circula</h3>
                <p style={{ fontSize: "12px", color: "#666", margin: "5px 0 0" }}>
                  Online Marketplace | Phone: +91 8089011380 | Email: contact@circula.com
                </p>
                <img
                  src="/logo.png"
                  alt="Circula Logo"
                  style={{ height: "50px", width: "auto", margin: "10px auto", display: "block" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    console.error("Logo image failed to load");
                  }}
                />
              </div>

              {/* Bill Information */}
              <div style={{ padding: "15px", border: "1px solid #e2e8f0", borderRadius: "8px", backgroundColor: "#fff" }}>
                <h4 style={{ fontSize: "18px", color: "#1a202c", textAlign: "center", marginBottom: "15px" }}>
                  Invoice #{selectedOrder.orderId}
                </h4>
                <hr style={{ border: "1px dashed #ddd", margin: "10px 0" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px", fontSize: "14px" }}>
                  <p><strong>Item Name:</strong></p>
                  <p>{selectedOrder.item_name || "N/A"}</p>
                  <p><strong>Price:</strong></p>
                  <p>₹{selectedOrder.total_amount || 0}</p>
                  <p><strong>Purchase Date:</strong></p>
                  <p>{selectedOrder.date ? new Date(selectedOrder.date).toLocaleDateString() : "N/A"}</p>
                  <p><strong>Payment Status:</strong></p>
                  <p>{selectedOrder.status || "N/A"}</p>
                  <p><strong>Customer Name:</strong></p>
                  <p>{selectedOrder.customerName || "N/A"}</p>
                  <p><strong>Customer Email:</strong></p>
                  <p>{selectedOrder.customerEmail || "N/A"}</p>
                  <p><strong>Seller Name:</strong></p>
                  <p>{selectedOrder.sellerName || "N/A"}</p>
                </div>
                <hr style={{ border: "1px dashed #ddd", margin: "10px 0" }} />
                <p style={{ textAlign: "right", fontSize: "16px", fontWeight: "bold", color: "#2d3748" }}>
                  Total: ₹{selectedOrder.total_amount || 0}
                </p>
              </div>

              {/* Footer Section */}
              <div style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", color: "#718096" }}>
                <p>Thank you for your purchase with Circula!</p>
                <p>For support, contact us at +91 8089011380 or email: contact@circula.com</p>
                <p>© 2025 Circula. All rights reserved.</p>
              </div>
            </div>
            <button
              className="download-pdf-button"
              onClick={downloadPDF}
              style={{
                marginTop: "20px",
                padding: "12px 25px",
                backgroundColor: "#2d3748",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "background-color 0.3s",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#4a5568")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#2d3748")}
            >
              Download PDF
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Purchased;