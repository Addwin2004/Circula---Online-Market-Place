import { useState, useEffect } from "react";
import {
  Menu,
  X,
  Users,
  Package,
  BarChart2,
  MessageSquare,
  ShoppingBag,
  LogOut,
  FolderTree,
  UserPlus,
  DollarSign,
  Star,
  Loader,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();
  const { logout: contextLogout } = useAuth();
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalProducts: 0,
    revenue: 0,
    satisfaction: 0,
    pendingOrders: 0,
  });
  const [topSellers, setTopSellers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        console.log("Fetching data with token:", token); // Debug log
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const metricsResponse = await fetch("http://localhost:8000/api/dashboard/metrics", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!metricsResponse.ok) {
          let errorMessage = "Failed to fetch dashboard metrics";
          try {
            const errorData = await metricsResponse.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {}
          throw new Error(errorMessage);
        }

        const metricsData = await metricsResponse.json();
        console.log("Metrics data:", metricsData); // Debug log
        setMetrics(metricsData);

        const sellersResponse = await fetch("http://localhost:8000/api/top-sellers", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!sellersResponse.ok) {
          let errorMessage = "Failed to fetch top sellers";
          try {
            const errorData = await sellersResponse.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {}
          throw new Error(errorMessage);
        }

        const sellersData = await sellersResponse.json();
        console.log("Top sellers data:", sellersData); // Debug log
        setTopSellers(sellersData);

        setError(null);
        clearTimeout(timeoutId);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (error.name === "AbortError") {
          setError("Request timed out. The server might be down or overloaded.");
        } else {
          setError(`Failed to load dashboard data: ${error.message}. Please try again.`);
        }
        setMetrics({
          totalUsers: 0,
          totalProducts: 0,
          revenue: 0,
          satisfaction: 0,
          pendingOrders: 0,
        });
        setTopSellers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
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
            { id: "users", icon: <Users size={20} />, label: "Users" },
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
        <h1 className="zephyrix-page-title">Admin Dashboard</h1>

        {isLoading ? (
          <div className="loading-container">
            <Loader className="loading-spinner" size={48} />
            <p>Loading dashboard data...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button className="retry-button" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon blue">
                  <UserPlus size={24} color="white" />
                </div>
                <div className="metric-title">Total Users</div>
                <div className="metric-value">{metrics.totalUsers}</div>
              </div>

              <div className="metric-card">
                <div className="metric-icon green">
                  <ShoppingBag size={24} color="white" />
                </div>
                <div className="metric-title">Products</div>
                <div className="metric-value">{metrics.totalProducts}</div>
              </div>

              <div className="metric-card">
                <div className="metric-icon purple">
                  <DollarSign size={24} color="white" />
                </div>
                <div className="metric-title">Revenue</div>
                <div className="metric-value">{formatCurrency(metrics.revenue)}</div>
              </div>

              <div className="metric-card">
                <div className="metric-icon yellow">
                  <Star size={24} color="white" />
                </div>
                <div className="metric-title">Satisfaction</div>
                <div className="metric-value">{metrics.satisfaction.toFixed(1)}/5.0</div>
              </div>

              {metrics.pendingOrders > 0 && (
                <div className="metric-card">
                  <div className="metric-icon red">
                    <ShoppingBag size={24} color="white" />
                  </div>
                  <div className="metric-title">Pending Orders</div>
                  <div className="metric-value">{metrics.pendingOrders}</div>
                </div>
              )}
            </div>

            <div className="top-sellers-container">
              <h2 className="top-sellers-title">Top 5 Sellers</h2>
              {topSellers.length > 0 ? (
                <div className="top-sellers-table-container">
                  <table className="top-sellers-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Items Sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topSellers.map((seller) => (
                        <tr key={seller.id} className="seller-row">
                          <td>{seller.name}</td>
                          <td>{seller.email}</td>
                          <td>{seller.itemsSold}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="chart-info">
                  <p>No top sellers data available.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;