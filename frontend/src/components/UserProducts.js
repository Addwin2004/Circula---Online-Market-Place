"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Heart, Package, ShoppingBag, DollarSign, CreditCard, Search, Edit, Trash2, X } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import "../styles/UserProducts.css"

const UserProducts = () => {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState("products")
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    const currentPath = location.pathname.split("/")[1]
    setActiveTab(currentPath === "user-products" ? "products" : currentPath || "products")
  }, [location])

  useEffect(() => {
    fetchUserProducts()
  }, [])

  const fetchUserProducts = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No token found")

      const response = await fetch("http://localhost:8000/api/user/products", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to fetch user products")
      const data = await response.json()
      setProducts(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching user products:", error)
      setError(error.message)
      setLoading(false)
    }
  }

  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch(`http://localhost:8000/api/products/${productId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) throw new Error("Failed to delete product")
        setProducts(products.filter((product) => product.id !== productId))
      } catch (error) {
        console.error("Error deleting product:", error)
        alert("Failed to delete product. Please try again.")
      }
    }
  }

  const handleEdit = (product) => {
    setEditingProduct({ ...product, imageFile: null })
  }

  const handleEditChange = (e) => {
    const { name, value, files } = e.target
    if (name === "imageFile") {
      setEditingProduct({ ...editingProduct, imageFile: files[0] })
    } else {
      setEditingProduct({ ...editingProduct, [name]: value })
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("name", editingProduct.name)
      formData.append("description", editingProduct.description || "")
      formData.append("price", editingProduct.price)
      if (editingProduct.imageFile) {
        formData.append("image", editingProduct.imageFile)
      }

      const response = await fetch(`http://localhost:8000/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update product")
      }

      const updatedProduct = await response.json()
      setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p))
      setEditingProduct(null)
    } catch (error) {
      console.error("Error updating product:", error)
      alert(`Failed to update product: ${error.message}`)
    }
  }

  const filteredProducts = products.filter((product) => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sidebarItems = [
    { name: "Profile", icon: User, link: "/profile" },
    { name: "Wishlist", icon: Heart, link: "/wishlist" },
    { name: "Products", icon: Package, link: "/user-products" },
    { name: "Purchased", icon: ShoppingBag, link: "/purchased" },
    { name: "Sold", icon: DollarSign, link: "/sold" },
    { name: "Card", icon: CreditCard, link: "/card" },
  ]

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="user-products">
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
          <h1 className="page-title">My Products</h1>
          <div className="search-bar">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search your products"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                className="product-card"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="product-image" />
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-price">₹{product.price}</p>
                  <div className="product-actions">
                    <button className="edit-button" onClick={() => handleEdit(product)}>
                      <Edit size={18} />
                      Edit
                    </button>
                    <button className="delete-button" onClick={() => handleDelete(product.id)}>
                      <Trash2 size={18} />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <p className="no-products">No products found. Start selling by listing your items!</p>
          )}
        </motion.div>

        {editingProduct && (
          <div className="modal-overlay">
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleEditSubmit} className="edit-form">
                <div className="modal-header">
                  <h2>Edit Product</h2>
                  <button type="button" className="close-button" onClick={() => setEditingProduct(null)}>
                    <X size={24} />
                  </button>
                </div>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={editingProduct.name}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={editingProduct.description || ""}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="price">Price (₹)</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={editingProduct.price}
                    onChange={handleEditChange}
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="imageFile">Upload New Image</label>
                  <input
                    type="file"
                    id="imageFile"
                    name="imageFile"
                    accept="image/*"
                    onChange={handleEditChange}
                  />
                  {editingProduct.image_url && !editingProduct.imageFile && (
                    <img
                      src={editingProduct.image_url}
                      alt="Current product"
                      className="current-image-preview"
                    />
                  )}
                </div>
                <div className="form-actions">
                  <button type="submit" className="save-button">Save Changes</button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setEditingProduct(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
    </div>
  )
}

export default UserProducts