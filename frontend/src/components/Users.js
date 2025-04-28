"use client";

import { useState, useEffect } from "react";
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
  Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import "../styles/AdminDashboard.css";
import "../styles/Users.css";
import jsPDF from "jspdf";
import "jspdf-autotable";

const Users = () => {
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("username");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortField, setSortField] = useState("username");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userItems, setUserItems] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const navigate = useNavigate();
  const { logout: contextLogout } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchUserItems = async (userId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/users/${userId}/items`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch user items");
      const data = await response.json();
      setUserItems(data);
    } catch (error) {
      console.error("Error fetching user items:", error);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      const response = await fetch(`http://localhost:8000/api/users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update user status");

      setUsers(users.map((user) => (user.id === userId ? { ...user, status: newStatus } : user)));
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const handleShowDetails = async (user) => {
    setSelectedUser(user);
    await fetchUserItems(user.id);
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

  const filteredAndSortedUsers = users
    .filter((user) => {
      const matchesSearch =
        searchBy === "username"
          ? user.username.toLowerCase().includes(searchTerm.toLowerCase())
          : user.id.toString().includes(searchTerm);
      const matchesRole = filterRole === "all" || user.role === filterRole;
      const matchesStatus = filterStatus === "all" || user.status === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
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

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;

    // Adjusted column widths to fit content better
    const tableColumnStyles = {
      0: { cellWidth: 15 }, // ID
      1: { cellWidth: 25 }, // Username
      2: { cellWidth: 40 }, // Email (wider to accommodate long emails)
      3: { cellWidth: 20 }, // Role
      4: { cellWidth: 20 }, // Status
      5: { cellWidth: 25 }, // Phone
      6: { cellWidth: 20 }, // City
      7: { cellWidth: 25 }, // Joined
    };

    // Add header with website name and date
    const currentDate = new Date().toLocaleDateString();
    doc.setFontSize(20);
    doc.text("Circula Admin Report", margin, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${currentDate}`, pageWidth - margin - 40, 20, { align: "right" });

    // Define table columns and data (only customers, excluding admins)
    const tableColumnHeaders = ["ID", "Username", "Email", "Role", "Status", "Phone", "City", "Joined"];
    const customerUsers = users.filter((user) => user.role !== "Admin"); // Filter out admins
    const tableRows = customerUsers.map((user) => [
      user.id,
      user.username,
      user.email,
      user.role,
      user.status,
      user.phone || "N/A",
      user.city || "N/A",
      user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A",
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
    doc.save("Circula_User_Report.pdf");
  };

  const UserDetailsModal = ({ user, items, onClose }) => {
    if (!user) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>User Details</h2>
            <button onClick={onClose} className="close-button">
              <CloseIcon size={20} />
            </button>
          </div>
          <div className="modal-body">
            <div className="user-info">
              <h3>Personal Information</h3>
              <p>
                <strong>Username:</strong> {user.username}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Phone:</strong> {user.phone || "Not provided"}
              </p>
              <p>
                <strong>City:</strong> {user.city || "Not provided"}
              </p>
              <p>
                <strong>Joined:</strong>{" "}
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : "Not available"}
              </p>
              <p>
                <strong>Status:</strong> {user.status}
              </p>
              <p>
                <strong>Role:</strong> {user.role}
              </p>
            </div>
            <div className="user-items">
              <h3>Listed Items</h3>
              {items.length > 0 ? (
                <ul>
                  {items.map((item) => (
                    <li key={item.id}>
                      <p>
                        <strong>{item.name}</strong>
                      </p>
                      <p>Price: ₹{item.price}</p>
                      <p>Listed on: {new Date(item.created_at).toLocaleDateString()}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No items listed</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Navigation Sidebar */}
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
        <h1 className="zephyrix-page-title">User Management</h1>

        <div className="user-controls">
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
              <option value="username">Search by Username</option>
              <option value="id">Search by ID</option>
            </select>
          </div>

          <div className="filters">
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="filter-select">
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Customer">Customer</option>
            </select>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <button className="action-button export-button" onClick={exportToPDF}>
              <Download size={16} />
              Export to PDF
            </button>
          </div>
        </div>

        <div className="user-table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th className="sortable-header" onClick={() => handleSort("id")}>
                  <div className="header-content">
                    ID <SortIcon field="id" />
                  </div>
                </th>
                <th className="sortable-header" onClick={() => handleSort("username")}>
                  <div className="header-content">
                    Username <SortIcon field="username" />
                  </div>
                </th>
                <th className="sortable-header">Email</th>
                <th className="sortable-header">Role</th>
                <th className="sortable-header">Status</th>
                <th className="sortable-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedUsers.map((user) => (
                <tr key={user.id} className="user-row">
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <span className={`status-badge ${user.status.toLowerCase()}`}>{user.status}</span>
                  </td>
                  <td>
                    {user.role !== "Admin" && (
                      <button
                        className={`action-button ${user.status.toLowerCase()}`}
                        onClick={() => handleStatusToggle(user.id, user.status)}
                      >
                        {user.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                    )}
                    <button className="action-button show-more" onClick={() => handleShowDetails(user)}>
                      Show more
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showDetailsModal && (
          <UserDetailsModal user={selectedUser} items={userItems} onClose={() => setShowDetailsModal(false)} />
        )}
      </div>
    </div>
  );
};

export default Users;