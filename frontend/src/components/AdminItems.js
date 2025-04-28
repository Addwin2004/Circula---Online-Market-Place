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
  ChevronUp,
  ChevronDown,
  DoorClosedIcon as CloseIcon,
  Trash2,
  Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import "../styles/AdminDashboard.css";
import "../styles/AdminItems.css";
import jsPDF from "jspdf";
import "jspdf-autotable";

const AdminItems = () => {
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("items");
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("name");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showAllItems, setShowAllItems] = useState(false);
  const navigate = useNavigate();
  const { logout: contextLogout } = useAuth();

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/items?showAll=${showAllItems}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  }, [showAllItems]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/categories", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, [fetchItems]);

  // Helper function to get category name from category_id
  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "N/A";
  };

  // Helper function to format price with commas and two decimal places
  const formatPrice = (price) => {
    if (isNaN(price) || price === null || price === undefined) return "₹0.00";
    const numPrice = Number(price);
    return `₹${numPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleShowDetails = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

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
      setSortDirection("asc");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        const response = await fetch(`http://localhost:8000/api/items/${itemId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) throw new Error("Failed to delete item");
        setItems(items.filter((item) => item.id !== itemId));
        fetchItems();
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;

    // Adjusted column widths to fit content better
    const tableColumnStyles = {
      0: { cellWidth: 15 }, // ID
      1: { cellWidth: 30 }, // Name
      2: { cellWidth: 25 }, // Price (increased to accommodate commas)
      3: { cellWidth: 25 }, // Category
      4: { cellWidth: 30 }, // Seller Name
      5: { cellWidth: 25 }, // Seller City
      6: { cellWidth: 25 }, // Availability Status
    };

    // Add header with website name and date
    const currentDate = new Date().toLocaleDateString();
    doc.setFontSize(20);
    doc.text("Circula Admin Report", margin, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${currentDate}`, pageWidth - margin - 40, 20, { align: "right" });

    // Define table columns and data
    const tableColumnHeaders = ["ID", "Name", "Price", "Category", "Seller Name", "Seller City", "Availability"];
    const tableRows = items.map((item) => [
      item.id,
      item.name,
      formatPrice(item.price), // Use custom formatPrice function
      getCategoryName(item.category_id),
      item.seller_name,
      item.seller_city,
      item.isPurchased ? "Sold Out" : "Available",
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
    doc.save("Circula_Items_Report.pdf");
  };

  const filteredAndSortedItems = items
    .filter((item) => {
      const matchesSearch =
        searchBy === "name"
          ? item.name.toLowerCase().includes(searchTerm.toLowerCase())
          : item.id.toString().includes(searchTerm);
      const matchesCategory =
        selectedCategory === "" ||
        (item.category_id != null && item.category_id.toString() === selectedCategory);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const sortOrder = sortDirection === "asc" ? 1 : -1;
      return aValue < bValue ? -1 * sortOrder : aValue > bValue ? 1 * sortOrder : 0;
    });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const ItemDetailsModal = ({ item, onClose }) => {
    if (!item) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2 style={{ color: "white" }}>Item Details</h2>
            <button onClick={onClose} className="close-button">
              <CloseIcon size={20} />
            </button>
          </div>
          <div className="modal-body">
            <div className="item-info">
              <div className="item-image-container">
                <img src={item.image_url || "/placeholder.svg"} alt={item.name} className="item-detail-image" />
              </div>
              <h3>{item.name}</h3>
              <p>
                <strong>Description:</strong> {item.description}
              </p>
              <p>
                <strong>Price:</strong> {formatPrice(item.price)}
              </p>
              <p>
                <strong>Seller:</strong> {item.seller_name}
              </p>
              <p>
                <strong>Category:</strong> {getCategoryName(item.category_id)}
              </p>
              <p>
                <strong>Subcategory:</strong> {item.subcategory_id || "N/A"}
              </p>
              <p>
                <strong>Seller City:</strong> {item.seller_city}
              </p>
              <p>
                <strong>Listed on:</strong> {new Date(item.created_at).toLocaleString()}
              </p>
              <p>
                <strong>Purchased:</strong> {item.isPurchased ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
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
        <h1 className="zephyrix-page-title">Item Management</h1>

        <div className="item-controls">
          <div className="search-section">
            <div className="search-bar">
              <Search size={20} />
              <input
                type="text"
                placeholder={`Search by ${searchBy}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select value={searchBy} onChange={(e) => setSearchBy(e.target.value)} className="filter-select">
              <option value="name">Search by Name</option>
              <option value="id">Search by ID</option>
            </select>
          </div>
          <div className="filter-section">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <label className="show-all-filter">
              <input
                type="checkbox"
                checked={showAllItems}
                onChange={(e) => setShowAllItems(e.target.checked)}
              />
              <span className="checkbox-custom"></span>
              Show All Items
            </label>
            <button className="action-button export-button" onClick={exportToPDF}>
              <Download size={16} />
              Export to PDF
            </button>
          </div>
        </div>

        <div className="item-table-container">
          <table className="item-table">
            <thead>
              <tr>
                <th className="sortable-header" onClick={() => handleSort("id")}>
                  <div className="header-content">
                    ID <SortIcon field="id" />
                  </div>
                </th>
                <th className="sortable-header" onClick={() => handleSort("name")}>
                  <div className="header-content">
                    Name <SortIcon field="name" />
                  </div>
                </th>
                <th className="sortable-header" onClick={() => handleSort("price")}>
                  <div className="header-content">
                    Price <SortIcon field="price" />
                  </div>
                </th>
                <th className="sortable-header">Category</th>
                <th className="sortable-header" onClick={() => handleSort("seller_name")}>
                  <div className="header-content">
                    Seller Name <SortIcon field="seller_name" />
                  </div>
                </th>
                <th className="sortable-header">Seller City</th>
                <th className="sortable-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedItems.map((item) => (
                <tr key={item.id} className="item-row">
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{formatPrice(item.price)}</td>
                  <td>{getCategoryName(item.category_id)}</td>
                  <td>{item.seller_name}</td>
                  <td>{item.seller_city}</td>
                  <td>
                    <button className="action-button show-more" onClick={() => handleShowDetails(item)}>
                      Show more
                    </button>
                    <button className="action-button delete" onClick={() => handleDeleteItem(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showDetailsModal && <ItemDetailsModal item={selectedItem} onClose={() => setShowDetailsModal(false)} />}
      </div>
    </div>
  );
};

export default AdminItems;