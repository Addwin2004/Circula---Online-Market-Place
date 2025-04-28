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
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/AdminDashboard.css";
import "../styles/AdminPurchase.css";

const AdminPurchase = () => {
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("purchase");
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalSuccessfulPayments: 0,
    totalRevenue: 0,
    currentMonthPayments: 0,
  });

  const navigate = useNavigate();
  const { logout: contextLogout } = useAuth();

  const fetchPurchases = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:8000/api/purchases", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch purchases");
      }

      const data = await response.json();
      setPurchases(data);
      setFilteredPurchases(data);

      const metricsResponse = await fetch("http://localhost:8000/api/purchases/metrics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const applyFilters = useCallback(() => {
    let result = [...purchases];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (purchase) =>
          purchase.orderId?.toString().toLowerCase().includes(searchLower) ||
          purchase.customerName?.toLowerCase().includes(searchLower) ||
          purchase.productName?.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((purchase) => purchase.status === statusFilter);
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000); // Convert to UTC
      today.setUTCHours(0, 0, 0, 0); // Start of the day in UTC
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 6);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      // Log the date range for debugging
      console.log("Frontend Date Filter Range:", {
        today: today.toISOString(),
        lastWeek: lastWeek.toISOString(),
        now: now.toISOString(),
      });

      result = result.filter((purchase) => {
        const purchaseDate = new Date(purchase.date);
        switch (dateFilter) {
          case "today":
            return purchaseDate >= today;
          case "yesterday":
            return purchaseDate >= yesterday && purchaseDate < today;
          case "lastWeek":
            return purchaseDate >= lastWeek;
          case "lastMonth":
            return purchaseDate >= lastMonth;
          default:
            return true;
        }
      });
    }

    result.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "date":
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case "amount":
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case "orderId":
          aValue = a.orderId || a.id || "";
          bValue = b.orderId || b.id || "";
          break;
        case "customerName":
          aValue = a.customerName || "";
          bValue = b.customerName || "";
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

    // Log the filtered purchases for debugging
    console.log("Filtered Purchases (Frontend):", result.map(p => ({
      orderId: p.orderId,
      date: p.date,
    })));

    setFilteredPurchases(result);
  }, [purchases, searchTerm, statusFilter, dateFilter, sortField, sortDirection]);

  useEffect(() => {
    applyFilters();
  }, [purchases, searchTerm, statusFilter, dateFilter, sortField, sortDirection, applyFilters]);

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

  const handleViewDetails = async (purchase) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/purchases/${purchase.id || purchase.orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const detailedPurchase = await response.json();
        const mappedPurchase = {
          id: detailedPurchase.orderId || detailedPurchase.id,
          orderId: detailedPurchase.orderId || detailedPurchase.id,
          date: detailedPurchase.date,
          status: detailedPurchase.status,
          amount: detailedPurchase.amount,
          customerName: detailedPurchase.customerName,
          customerEmail: detailedPurchase.customerEmail,
          productName: detailedPurchase.productName,
          productId: detailedPurchase.productId,
          sellerId: detailedPurchase.sellerId,
          sellerName: detailedPurchase.sellerName || "N/A",
        };
        setSelectedPurchase(mappedPurchase);
        setShowDetailsModal(true);
      } else {
        throw new Error("Failed to fetch purchase details");
      }
    } catch (error) {
      console.error("Error fetching purchase details:", error);
    }
  };

  const handleUpdateStatus = async (purchaseId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/purchases/${purchaseId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update purchase status");
      }

      setPurchases((prev) =>
        prev.map((p) =>
          p.id === purchaseId || p.orderId === purchaseId ? { ...p, status: newStatus } : p
        )
      );
      setFilteredPurchases((prev) =>
        prev.map((p) =>
          p.id === purchaseId || p.orderId === purchaseId ? { ...p, status: newStatus } : p
        )
      );

      if (selectedPurchase && (selectedPurchase.id === purchaseId || selectedPurchase.orderId === purchaseId)) {
        setSelectedPurchase((prev) => ({ ...prev, status: newStatus }));
      }

      fetchPurchases();
    } catch (error) {
      console.error("Error updating purchase status:", error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Calculate date range based on the current date filter
      let dateFrom = null;
      let dateTo = null;
      const now = new Date();
      const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000); // Convert to UTC
      today.setUTCHours(0, 0, 0, 0); // Start of the day in UTC
      const endOfToday = new Date(today);
      endOfToday.setUTCHours(23, 59, 59, 999); // End of the day in UTC
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 6);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      switch (dateFilter) {
        case "today":
          dateFrom = today.toISOString();
          dateTo = endOfToday.toISOString();
          break;
        case "yesterday":
          dateFrom = yesterday.toISOString();
          dateTo = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
          break;
        case "lastWeek":
          dateFrom = lastWeek.toISOString();
          dateTo = endOfToday.toISOString(); // Include the entire current day
          break;
        case "lastMonth":
          dateFrom = lastMonth.toISOString();
          dateTo = endOfToday.toISOString(); // Include the entire current day
          break;
        default:
          break;
      }

      // Log the date range for debugging
      console.log("Export PDF Date Range:", { dateFrom, dateTo });

      // Construct the URL with query parameters for the date range
      const queryParams = new URLSearchParams();
      if (dateFrom) queryParams.append("dateFrom", dateFrom);
      if (dateTo) queryParams.append("dateTo", dateTo);
      const url = `http://localhost:8000/api/purchases/export/pdf?${queryParams.toString()}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export purchases to PDF");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "purchases.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting purchases to PDF:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Success":
        return "zephyrix-status-completed";
      case "Failed":
        return "zephyrix-status-cancelled";
      default:
        return "";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Success":
        return <CheckCircle size={16} />;
      case "Failed":
        return <XCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  return (
    <div className="dashboard-container">
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

      <div className="main-content">
        <h1 className="zephyrix-page-title">Purchase Management</h1>

        <div className="zephyrix-metrics-container">
          <motion.div
            className="zephyrix-metric-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="zephyrix-metric-icon zephyrix-blue">
              <ShoppingBag size={24} />
            </div>
            <div className="zephyrix-metric-info">
              <h3>Successful Payments</h3>
              <p className="zephyrix-metric-value">{metrics.totalSuccessfulPayments}</p>
            </div>
          </motion.div>

          <motion.div
            className="zephyrix-metric-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="zephyrix-metric-icon zephyrix-green">
              <DollarSign size={24} />
            </div>
            <div className="zephyrix-metric-info">
              <h3>Total Amount</h3>
              <p className="zephyrix-metric-value">{formatCurrency(metrics.totalRevenue)}</p>
            </div>
          </motion.div>

          <motion.div
            className="zephyrix-metric-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="zephyrix-metric-icon zephyrix-amber">
              <Clock size={24} />
            </div>
            <div className="zephyrix-metric-info">
              <h3>Current Month Payments</h3>
              <p className="zephyrix-metric-value">{formatCurrency(metrics.currentMonthPayments)}</p>
            </div>
          </motion.div>
        </div>

        <div className="zephyrix-controls-container">
          <div className="zephyrix-search-section">
            <div className="zephyrix-search-bar">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search orderID, customer, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="zephyrix-filter-section">
            <div className="zephyrix-filter-group">
              <label>Status:</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <div className="zephyrix-filter-group">
              <label>Date:</label>
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="lastWeek">Last 7 Days</option>
                <option value="lastMonth">Last 30 Days</option>
              </select>
            </div>

            <button className="zephyrix-export-button" onClick={handleExportPDF}>
              <Download size={16} />
              Export PDF
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="zephyrix-loading">
            <div className="zephyrix-spinner"></div>
            <p>Loading purchase data...</p>
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
                  <th className="zephyrix-sortable-header" onClick={() => handleSort("orderId")}>
                    <div className="zephyrix-header-content">
                      Order ID <SortIcon field="orderId" />
                    </div>
                  </th>
                  <th className="zephyrix-sortable-header" onClick={() => handleSort("customerName")}>
                    <div className="zephyrix-header-content">
                      Customer <SortIcon field="customerName" />
                    </div>
                  </th>
                  <th className="zephyrix-sortable-header" onClick={() => handleSort("productName")}>
                    <div className="zephyrix-header-content">
                      Product <SortIcon field="productName" />
                    </div>
                  </th>
                  <th className="zephyrix-sortable-header" onClick={() => handleSort("amount")}>
                    <div className="zephyrix-header-content">
                      Amount <SortIcon field="amount" />
                    </div>
                  </th>
                  <th className="zephyrix-sortable-header" onClick={() => handleSort("date")}>
                    <div className="zephyrix-header-content">
                      Date <SortIcon field="date" />
                    </div>
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((purchase) => (
                  <motion.tr
                    key={purchase.id || purchase.orderId}
                    className="zephyrix-row"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.5)" }}
                  >
                    <td>{purchase.id || purchase.orderId}</td>
                    <td>{purchase.customerName}</td>
                    <td>{purchase.productName}</td>
                    <td>{formatCurrency(purchase.amount)}</td>
                    <td>{formatDate(purchase.date)}</td>
                    <td>
                      <span className={`zephyrix-status-badge ${getStatusColor(purchase.status)}`}>
                        {getStatusIcon(purchase.status)} {purchase.status}
                      </span>
                    </td>
                    <td>
                      <div className="zephyrix-action-buttons">
                        <button className="zephyrix-view-button" onClick={() => handleViewDetails(purchase)}>
                          View Details
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {filteredPurchases.length === 0 && (
              <div className="zephyrix-no-results">
                <AlertCircle size={48} />
                <p>No purchases found matching your criteria.</p>
              </div>
            )}
          </motion.div>
        )}

        <AnimatePresence>
          {showDetailsModal && selectedPurchase && (
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
                  <h2>Purchase Details</h2>
                  <button onClick={() => setShowDetailsModal(false)} className="zephyrix-close-button">
                    <X size={20} />
                  </button>
                </div>

                <div className="zephyrix-modal-body">
                  <div className="zephyrix-details">
                    <div className="zephyrix-detail-section">
                      <h3>Order Information</h3>
                      <div className="zephyrix-detail-grid">
                        <div className="zephyrix-detail-item">
                          <span className="zephyrix-detail-label">Order ID</span>
                          <span className="zephyrix-detail-value">{selectedPurchase.orderId}</span>
                        </div>
                        <div className="zephyrix-detail-item">
                          <span className="zephyrix-detail-label">Date</span>
                          <span className="zephyrix-detail-value">{formatDate(selectedPurchase.date)}</span>
                        </div>
                        <div className="zephyrix-detail-item">
                          <span className="zephyrix-detail-label">Status</span>
                          <span className={`zephyrix-status-badge ${getStatusColor(selectedPurchase.status)}`}>
                            {getStatusIcon(selectedPurchase.status)} {selectedPurchase.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="zephyrix-detail-section">
                      <h3>Customer Information</h3>
                      <div className="zephyrix-detail-grid">
                        <div className="zephyrix-detail-item">
                          <span className="zephyrix-detail-label">Name</span>
                          <span className="zephyrix-detail-value">{selectedPurchase.customerName}</span>
                        </div>
                        <div className="zephyrix-detail-item">
                          <span className="zephyrix-detail-label">Email</span>
                          <span className="zephyrix-detail-value">{selectedPurchase.customerEmail || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="zephyrix-detail-section">
                      <h3>Product Information</h3>
                      <div className="zephyrix-detail-grid">
                        <div className="zephyrix-detail-item">
                          <span className="zephyrix-detail-label">Product Name</span>
                          <span className="zephyrix-detail-value">{selectedPurchase.productName}</span>
                        </div>
                        <div className="zephyrix-detail-item">
                          <span className="zephyrix-detail-label">Product ID</span>
                          <span className="zephyrix-detail-value">{selectedPurchase.productId}</span>
                        </div>
                        <div className="zephyrix-detail-item">
                          <span className="zephyrix-detail-label">Seller</span>
                          <span className="zephyrix-detail-value">{selectedPurchase.sellerName || "N/A"}</span>
                        </div>
                        <div className="zephyrix-detail-item">
                          <span className="zephyrix-detail-label">Seller ID</span>
                          <span className="zephyrix-detail-value">{selectedPurchase.sellerId}</span>
                        </div>
                        <div className="zephyrix-detail-item">
                          <span className="zephyrix-detail-label">Amount</span>
                          <span className="zephyrix-detail-value">{formatCurrency(selectedPurchase.amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="zephyrix-status-actions">
                    <h3>Update Status</h3>
                    <div className="zephyrix-status-buttons">
                      <button
                        className={`zephyrix-status-button zephyrix-status-completed ${selectedPurchase.status === "Success" ? "active" : ""}`}
                        onClick={() => handleUpdateStatus(selectedPurchase.id || selectedPurchase.orderId, "Success")}
                      >
                        <CheckCircle size={16} /> Success
                      </button>
                      <button
                        className={`zephyrix-status-button zephyrix-status-cancelled ${selectedPurchase.status === "Failed" ? "active" : ""}`}
                        onClick={() => handleUpdateStatus(selectedPurchase.id || selectedPurchase.orderId, "Failed")}
                      >
                        <XCircle size={16} /> Failed
                      </button>
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

export default AdminPurchase;