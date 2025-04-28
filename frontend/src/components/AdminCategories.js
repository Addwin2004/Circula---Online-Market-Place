"use client"

import { useState, useEffect } from "react"
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
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Save,
  XCircle,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../utils/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import "../styles/AdminDashboard.css"
import "../styles/AdminCategories.css"

const AdminCategories = () => {
  const [isNavOpen, setIsNavOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("categories")
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState({ name: "" })
  const [newSubcategory, setNewSubcategory] = useState({ name: "", categoryId: "" })
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingSubcategory, setEditingSubcategory] = useState(null)
  const [expandedCategories, setExpandedCategories] = useState({})
  const [loadingSubcategories, setLoadingSubcategories] = useState({})
  const navigate = useNavigate()
  const { logout: contextLogout } = useAuth()

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (categories.length > 0) {
      console.log("Categories state:", categories)
      console.log("First category structure:", categories[0])
      if ('subcategories' in categories[0]) {
        console.log("Subcategories exist in first category:", categories[0].subcategories)
      } else {
        console.log("No subcategories property in first category (expected with separate endpoints)")
      }
    }
  }, [categories])

  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/categories", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch categories")
      const data = await response.json()
      console.log("Fetched categories:", data)
      setCategories(data.map(category => ({ ...category, subcategories: null })))
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchSubcategories = async (categoryId) => {
    try {
      setLoadingSubcategories(prev => ({ ...prev, [categoryId]: true }))
      const response = await fetch(`http://localhost:8000/api/subcategories/${categoryId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (!response.ok) throw new Error(`Failed to fetch subcategories for category ${categoryId}`)
      const subcategories = await response.json()
      console.log(`Fetched subcategories for category ${categoryId}:`, subcategories)
      
      setCategories(prevCategories =>
        prevCategories.map(category =>
          category.id === categoryId ? { ...category, subcategories } : category
        )
      )
    } catch (error) {
      console.error(`Error fetching subcategories for category ${categoryId}:`, error)
    } finally {
      setLoadingSubcategories(prev => ({ ...prev, [categoryId]: false }))
    }
  }

  const toggleNav = () => setIsNavOpen(!isNavOpen)

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token")
      if (token) {
        const response = await fetch("http://localhost:8000/api/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Logout failed")
        }
      }

      contextLogout()
      navigate("/login")
    } catch (error) {
      console.error("Logout error:", error)
      contextLogout()
      navigate("/login")
    }
  }

  const handleNavigation = (tabId) => {
    setActiveTab(tabId)
    switch (tabId) {
      case "dashboard":
        navigate("/admin-dashboard")
        break
      case "users":
        navigate("/users")
        break
      case "items":
        navigate("/admin-items")
        break
      case "categories":
        navigate("/admin-categories")
        break
      case "purchase":
        navigate("/admin-purchase")
        break
      case "feedback":
        navigate("/admin-feedback")
        break
      default:
        break
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      alert("Category name cannot be empty")
      return
    }

    try {
      const response = await fetch("http://localhost:8000/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newCategory),
      })
      if (!response.ok) throw new Error("Failed to add category")
      await fetchCategories()
      setNewCategory({ name: "" })
    } catch (error) {
      console.error("Error adding category:", error)
    }
  }

  const handleAddSubcategory = async () => {
    if (!newSubcategory.name.trim() || !newSubcategory.categoryId) {
      alert("Subcategory name and category selection are required")
      return
    }

    try {
      const response = await fetch("http://localhost:8000/api/subcategories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name: newSubcategory.name, categoryId: newSubcategory.categoryId }),
      })
      if (!response.ok) throw new Error("Failed to add subcategory")
      setCategories(prev =>
        prev.map(category =>
          category.id === parseInt(newSubcategory.categoryId) ? { ...category, subcategories: null } : category
        )
      )
      await fetchCategories()
      setNewSubcategory({ name: "", categoryId: "" })
    } catch (error) {
      console.error("Error adding subcategory:", error)
    }
  }

  const handleEditCategory = async (categoryId, newName) => {
    if (!newName.trim()) {
      alert("Category name cannot be empty")
      return
    }

    try {
      const response = await fetch(`http://localhost:8000/api/categories/${categoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name: newName }),
      })
      if (!response.ok) throw new Error("Failed to update category")

      // Update the category name in the state immediately
      setCategories(prev =>
        prev.map(category =>
          category.id === categoryId ? { ...category, name: newName } : category
        )
      )
      setEditingCategory(null)
    } catch (error) {
      console.error("Error updating category:", error)
    }
  }

  const handleEditSubcategory = async (subcategoryId, newName) => {
    if (!newName.trim()) {
      alert("Subcategory name cannot be empty")
      return
    }

    try {
      const response = await fetch(`http://localhost:8000/api/subcategories/${subcategoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name: newName }),
      })
      if (!response.ok) throw new Error("Failed to update subcategory")

      // Update the subcategory name in the state immediately
      setCategories(prev =>
        prev.map(category => ({
          ...category,
          subcategories: category.subcategories
            ? category.subcategories.map(sub =>
                sub.id === subcategoryId ? { ...sub, name: newName } : sub
              )
            : null
        }))
      )
      setEditingSubcategory(null)
    } catch (error) {
      console.error("Error updating subcategory:", error)
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm("Are you sure you want to delete this category? This will also delete all subcategories.")) {
      try {
        const response = await fetch(`http://localhost:8000/api/categories/${categoryId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        if (!response.ok) throw new Error("Failed to delete category")
        await fetchCategories()
      } catch (error) {
        console.error("Error deleting category:", error)
      }
    }
  }

  const handleDeleteSubcategory = async (subcategoryId) => {
    if (window.confirm("Are you sure you want to delete this subcategory?")) {
      try {
        const response = await fetch(`http://localhost:8000/api/subcategories/${subcategoryId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        if (!response.ok) throw new Error("Failed to delete subcategory")
        const category = categories.find(cat => cat.subcategories?.some(sub => sub.id === subcategoryId))
        if (category) {
          setCategories(prev =>
            prev.map(cat =>
              cat.id === category.id ? { ...cat, subcategories: null } : cat
            )
          )
        }
      } catch (error) {
        console.error("Error deleting subcategory:", error)
      }
    }
  }

  const toggleCategoryExpansion = async (categoryId) => {
    const isExpanding = !expandedCategories[categoryId]
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))

    if (isExpanding) {
      const category = categories.find(cat => cat.id === categoryId)
      if (category && category.subcategories === null) {
        await fetchSubcategories(categoryId)
      }
    }
  }

  const hasSubcategories = (category) => {
    return category.subcategories && Array.isArray(category.subcategories) && category.subcategories.length > 0
  }

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
        <h1 className="zephyrix-page-title">Category Management</h1>

        <div className="admin-categories-wrapper">
          <div className="new-category-section">
            <h2>Add New Category</h2>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ name: e.target.value })}
              placeholder="Category Name"
            />
            <button onClick={handleAddCategory}>Add Category</button>
          </div>

          <div className="new-subcategory-section">
            <h2>Add New Subcategory</h2>
            <input
              type="text"
              value={newSubcategory.name}
              onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
              placeholder="Subcategory Name"
            />
            <select
              value={newSubcategory.categoryId}
              onChange={(e) => setNewSubcategory({ ...newSubcategory, categoryId: e.target.value })}
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button onClick={handleAddSubcategory}>Add Subcategory</button>
          </div>

          <div className="category-list-wrapper">
            <h2>Categories and Subcategories</h2>
            {categories.length > 0 ? (
              categories.map((category) => (
                <motion.div key={category.id} className="category-block" layout>
                  <div className="category-title-bar">
                    {editingCategory === category.id ? (
                      <input
                        type="text"
                        value={category.name}
                        onChange={(e) => {
                          const updatedCategories = categories.map((c) =>
                            c.id === category.id ? { ...c, name: e.target.value } : c
                          )
                          setCategories(updatedCategories)
                        }}
                      />
                    ) : (
                      <span>{category.name}</span>
                    )}
                    <div className="category-controls">
                      {editingCategory === category.id ? (
                        <>
                          <button onClick={() => handleEditCategory(category.id, category.name)}>
                            <Save size={18} />
                          </button>
                          <button onClick={() => setEditingCategory(null)}>
                            <XCircle size={18} />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setEditingCategory(category.id)}>
                          <Edit size={18} />
                        </button>
                      )}
                      <button onClick={() => handleDeleteCategory(category.id)}>
                        <Trash2 size={18} />
                      </button>
                      <button onClick={() => toggleCategoryExpansion(category.id)} aria-label="Toggle subcategories">
                        {expandedCategories[category.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {expandedCategories[category.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="subcategory-collection"
                      >
                        {loadingSubcategories[category.id] ? (
                          <motion.div className="subcategory-entry" layout>
                            <span>Loading...</span>
                          </motion.div>
                        ) : hasSubcategories(category) ? (
                          category.subcategories.map((subcategory) => (
                            <motion.div key={subcategory.id} className="subcategory-entry" layout>
                              {editingSubcategory === subcategory.id ? (
                                <input
                                  type="text"
                                  value={subcategory.name}
                                  onChange={(e) => {
                                    const updatedCategories = categories.map((c) => {
                                      if (c.id === category.id) {
                                        return {
                                          ...c,
                                          subcategories: c.subcategories.map((s) =>
                                            s.id === subcategory.id ? { ...s, name: e.target.value } : s
                                          ),
                                        }
                                      }
                                      return c
                                    })
                                    setCategories(updatedCategories)
                                  }}
                                />
                              ) : (
                                <span>{subcategory.name}</span>
                              )}
                              <div className="subcategory-controls">
                                {editingSubcategory === subcategory.id ? (
                                  <>
                                    <button onClick={() => handleEditSubcategory(subcategory.id, subcategory.name)}>
                                      <Save size={16} />
                                    </button>
                                    <button onClick={() => setEditingSubcategory(null)}>
                                      <XCircle size={16} />
                                    </button>
                                  </>
                                ) : (
                                  <button onClick={() => setEditingSubcategory(subcategory.id)}>
                                    <Edit size={16} />
                                  </button>
                                )}
                                <button onClick={() => handleDeleteSubcategory(subcategory.id)}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <motion.div className="subcategory-entry" layout>
                            <span>No subcategories available</span>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <div className="no-categories">No categories available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminCategories