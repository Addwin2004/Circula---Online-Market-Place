"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Menu,
  X,
  UsersIcon,
  Package,
  BarChart2,
  MessageSquare,
  ShoppingBag,
  LogOut,
  FolderTree,
  Search,
  ChevronDown,
  ChevronUp,
  Star,
  AlertCircle,
  Download, // Import Download icon for the export button
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/AdminDashboard.css";
import "../styles/AdminFeedback.css";
import jsPDF from "jspdf";
import "jspdf-autotable";

const AdminFeedback = () => {
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("feedback");
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const { logout: contextLogout } = useAuth();

  const fetchFeedbacks = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:8000/api/feedbacks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch feedbacks");
      }

      const data = await response.json();
      setFeedbacks(data);
      setFilteredFeedbacks(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const applyFilters = useCallback(() => {
    let result = [...feedbacks];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (feedback) =>
          feedback.id?.toString().toLowerCase().includes(searchLower) ||
          feedback.userName?.toLowerCase().includes(searchLower) ||
          feedback.comment?.toLowerCase().includes(searchLower)
      );
    }

    if (ratingFilter !== "all") {
      result = result.filter((feedback) => feedback.rating === parseInt(ratingFilter));
    }

    result.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "date":
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case "rating":
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case "userName":
          aValue = a.userName || "";
          bValue = b.userName || "";
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }

      const sortOrder = sortDirection === "asc" ? 1 : -1;

      if (aValue < bValue) return -1 * sortOrder;
      if (aValue > bValue) return 1 * sortOrder;
      return 0;
    });

    setFilteredFeedbacks(result);
  }, [feedbacks, searchTerm, ratingFilter, sortField, sortDirection]);

  useEffect(() => {
    applyFilters();
  }, [feedbacks, searchTerm, ratingFilter, sortField, sortDirection, applyFilters]);

  const toggleNav = () => setIsNavOpen(!isNavOpen);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const response = await fetch("http://localhost:8000/api/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Logout failed");
        }
      }

      contextLogout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      contextLogout();
      navigate("/login");
    }
  };

  const handleNavigation = (tabId) => {
    setActiveTab(tabId);
    switch (tabId) {
      case "dashboard":
        navigate("/admin-dashboard");
        break;
      case "users":
        navigate("/users");
        break;
      case "items":
        navigate("/admin-items");
        break;
      case "categories":
        navigate("/admin-categories");
        break;
      case "purchase":
        navigate("/admin-purchase");
        break;
      case "feedback":
        navigate("/admin-feedback");
        break;
      default:
        break;
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleViewDetails = (feedback) => {
    setSelectedFeedback(feedback);
    setShowDetailsModal(true);
  };

  const renderStars = (rating) => {
    return (
      <div className="zephyrix-star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? "zephyrix-star-filled" : "zephyrix-star-empty"}
          />
        ))}
      </div>
    );
  };

  const truncateComment = (comment, maxLength = 50) => {
    if (!comment || comment.length <= maxLength) return comment;
    return comment.substring(0, maxLength) + "...";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;

    // Adjusted column widths to fit content better
    const tableColumnStyles = {
      0: { cellWidth: 20 }, // Feedback ID
      1: { cellWidth: 30 }, // User
      2: { cellWidth: 20 }, // Rating
      3: { cellWidth: 60 }, // Message (wider for longer comments)
      4: { cellWidth: 40 }, // Date
    };

    // Add header with website name and date
    const currentDate = new Date().toLocaleDateString();
    doc.setFontSize(20);
    doc.text("Circlula Admin Report", margin, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${currentDate}`, pageWidth - margin - 40, 20, { align: "right" });

    // Define table columns and data
    const tableColumnHeaders = ["Feedback ID", "User", "Rating", "Message", "Date"];
    const tableRows = feedbacks.map((feedback) => [
      feedback.id,
      feedback.userName || "N/A",
      feedback.rating || "N/A",
      truncateComment(feedback.comment, 100), // Truncate message to avoid overflow
      formatDate(feedback.date),
    ]);

    // Generate the table
    doc.autoTable({
      head: [tableColumnHeaders],
      body: tableRows,
      startY: 30,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontSize: 10 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: {
        fontSize: 8, // Reduced font size for better fit
        cellPadding: 3, // Reduced padding for tighter fit
        overflow: "linebreak", // Enable word wrapping for long content
        minCellHeight: 8, // Ensure minimum height for readability
      },
      columnStyles: tableColumnStyles,
      margin: { top: 30, left: margin, right: margin },
    });

    // Add a footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, {
        align: "center",
      });
    }

    // Save the PDF
    doc.save("Circlula_Feedback_Report.pdf");
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar (Identical to AdminPurchase) */}
      <div className={`nav-sidebar ${!isNavOpen ? "collapsed" : ""}`}>
        <div className="nav-header">
          {isNavOpen && <h2 className="nav-title">Dashboard</h2>}
          <button className="toggle-button" onClick={toggleNav}>
            {isNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="nav-menu">
          {[
            { id: "dashboard", icon: <BarChart2 size={20} />, label: "Dashboard" },
            { id: "users", icon: <UsersIcon size={20} />, label: "Users" },
            { id: "items", icon: <Package size={20} />, label: "Items" },
            { id: "categories", icon: <FolderTree size={20} />, label: "Categories" },
            { id: "purchase", icon: <ShoppingBag size={20} />, label: "Purchase" },
            { id: "feedback", icon: <MessageSquare size={20} />, label: "Feedback" },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
            >
              {item.icon}
              {isNavOpen && <span>{item.label}</span>}
            </div>
          ))}
        </nav>

        <div className="logout-button" onClick={handleLogout}>
          <button>
            <LogOut size={20} />
            {isNavOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1 className="zephyrix-page-title">Feedback Management</h1>

        {/* Search and Filter Controls */}
        <div className="zephyrix-controls-container">
          <div className="zephyrix-search-section">
            <div className="zephyrix-search-bar">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search by feedback ID, user, or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="zephyrix-filter-section">
            <div className="zephyrix-filter-group">
              <label>Rating:</label>
              <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
                <option value="all">All Ratings</option>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} Star{rating > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
            {/* Export Button */}
            <button className="zephyrix-export-button" onClick={exportToPDF}>
              <Download size={16} />
              Export to PDF
            </button>
          </div>
        </div>

        {/* Feedback Table */}
        {isLoading ? (
          <div className="zephyrix-loading">
            <div className="zephyrix-spinner"></div>
            <p>Loading feedback data...</p>
          </div>
        ) : (
          <motion.div
            className="zephyrix-table-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <table className="zephyrix-table">
              <thead>
                <tr>
                  <th className="zephyrix-sortable-header" onClick={() => handleSort("id")}>
                    <div className="zephyrix-header-content">
                      Feedback ID <SortIcon field="id" />
                    </div>
                  </th>
                  <th className="zephyrix-sortable-header" onClick={() => handleSort("userName")}>
                    <div className="zephyrix-header-content">
                      User <SortIcon field="userName" />
                    </div>
                  </th>
                  <th className="zephyrix-sortable-header" onClick={() => handleSort("rating")}>
                    <div className="zephyrix-header-content">
                      Rating <SortIcon field="rating" />
                    </div>
                  </th>
                  <th>Message</th>
                  <th className="zephyrix-sortable-header" onClick={() => handleSort("date")}>
                    <div className="zephyrix-header-content">
                      Date <SortIcon field="date" />
                    </div>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.map((feedback) => (
                  <motion.tr
                    key={feedback.id}
                    className="zephyrix-row"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.5)" }}
                  >
                    <td>{feedback.id}</td>
                    <td>{feedback.userName}</td>
                    <td>{renderStars(feedback.rating)}</td>
                    <td>{truncateComment(feedback.comment)}</td>
                    <td>{formatDate(feedback.date)}</td>
                    <td>
                      <div className="zephyrix-action-buttons">
                        <button
                          className="zephyrix-view-button"
                          onClick={() => handleViewDetails(feedback)}
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {filteredFeedbacks.length === 0 && (
              <div className="zephyrix-no-results">
                <AlertCircle size={48} />
                <p>No feedbacks found matching your criteria.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Modal for Full Feedback */}
        <AnimatePresence>
          {showDetailsModal && selectedFeedback && (
            <motion.div
              className="zephyrix-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="zephyrix-modal-content"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                <div className="zephyrix-modal-header">
                  <h2>Feedback Details</h2>
                  <button onClick={() => setShowDetailsModal(false)} className="zephyrix-close-button">
                    <X size={20} />
                  </button>
                </div>

                <div className="zephyrix-modal-body">
                  <div className="zephyrix-details">
                    <div className="zephyrix-detail-section">
                      <h3>Feedback Information</h3>
                      <div className="zephyrix-detail-grid">
                        <div className="zephyrix-detail-item">
                          <span className="zephyrix-detail-label">Feedback ID</span>
                          <span className="zephyrix-detail-value">{selectedFeedback.id}</span>
                        </div>
                        <div className="zephyrix-detail-item">
                          <span className="zephyrix-detail-label">Date</span>
                          <span className="zephyrix-detail-value">{formatDate(selectedFeedback.date)}</span>
                        </div>
                        <div className="zephyrix-detail-item">
                          <span className="zephyrix-detail-label">Rating</span>
                          <span className="zephyrix-detail-value">{renderStars(selectedFeedback.rating)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="zephyrix-detail-section">
                      <h3>User Information</h3>
                      <div className="zephyrix-detail-grid">
                        <div className="zephyrix-detail-item">
                          <span className="zephyrix-detail-label">Name</span>
                          <span className="zephyrix-detail-value">{selectedFeedback.userName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="zephyrix-detail-section">
                      <h3>Message</h3>
                      <div className="zephyrix-detail-grid">
                        <div className="zephyrix-detail-item zephyrix-full-comment">
                          <span className="zephyrix-detail-value">{selectedFeedback.comment}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminFeedback;