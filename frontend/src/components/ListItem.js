"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, DollarSign, Camera, Tag, FileText } from "lucide-react"
import listItemImage from "../assets/list-item.png"
import "../styles/ListItem.css"

const ListItem = () => {
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [imagePreview, setImagePreview] = useState(null)
  const [formData, setFormData] = useState({
    item_name: "",
    description: "",
    price: "",
    category: "",
    subcategory: "",
    image: null,
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState({ show: false, message: "", type: "success" })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/categories")
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error("Error fetching categories:", error)
      setToast({
        show: true,
        message: "Error loading categories",
        type: "error",
      })
    }
  }

  const fetchSubcategories = async (categoryId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/subcategories/${categoryId}`)
      const data = await response.json()
      setSubcategories(data)
    } catch (error) {
      console.error("Error fetching subcategories:", error)
      setToast({
        show: true,
        message: "Error loading subcategories",
        type: "error",
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.item_name.trim() || formData.item_name.length > 50)
      newErrors.item_name = "Item name is required and must be less than 50 characters"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (formData.description.length > 250) newErrors.description = "Description must be less than 250 characters"
    if (!formData.price || Number.parseFloat(formData.price) <= 0) newErrors.price = "Valid price is required"
    if (!formData.category) newErrors.category = "Category is required"
    if (!formData.subcategory) newErrors.subcategory = "Subcategory is required"
    if (!formData.image) newErrors.image = "Image is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target

    if (name === "image" && files) {
      const file = files[0]
      setFormData((prev) => ({ ...prev, image: file }))

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))

      if (name === "category" && value) {
        fetchSubcategories(Number(value))
        setFormData((prev) => ({ ...prev, subcategory: "" })) // Reset subcategory when category changes
      }
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: null }))
    setImagePreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
  
    if (!validateForm()) return
  
    setIsLoading(true)
  
    try {
      const formDataToSend = new FormData()
      formDataToSend.append("item_name", formData.item_name)
      formDataToSend.append("description", formData.description)
      formDataToSend.append("price", formData.price.toString()) // Convert to string
      formDataToSend.append("category", formData.category)
      formDataToSend.append("subcategory", formData.subcategory)
      if (formData.image) {
        formDataToSend.append("image", formData.image)
      }
  
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Authentication token not found")
      }
  
      const response = await fetch("http://localhost:8000/api/items", {
        method: "POST",
        body: formDataToSend,
        headers: {
          Authorization: `Bearer ${token}`,
          // Remove Content-Type header to let browser set it with boundary
        },
      })
  
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to list item")
      }
  
      const data = await response.json()
      setToast({
        show: true,
        message: data.message || "Item listed successfully!",
        type: "success",
      })
  
      // Reset form
      setFormData({
        item_name: "",
        description: "",
        price: "",
        category: "",
        subcategory: "",
        image: null,
      })
      setImagePreview(null)
      setErrors({})
    } catch (error) {
      console.error("Error listing item:", error)
      setToast({
        show: true,
        message: error.message || "Error listing item. Please try again.",
        type: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderToast = () => (
    <AnimatePresence>
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`toast-message ${toast.type}`}
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "1rem",
            borderRadius: "4px",
            backgroundColor: toast.type === "error" ? "#ff4444" : "#44b700",
            color: "white",
            zIndex: 1000,
          }}
        >
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="list-item-container">
      {renderToast()}
      <img src={listItemImage || "/placeholder.svg"} alt="List Item Illustration" className="list-item-image" />
      <motion.div
        className="list-item-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="form-layout">
          <div className="form-sidebar">
            <h2 className="sidebar-title">List Your Item</h2>
            <p className="sidebar-description">Share the details of your item and find its new home through Circula.</p>
            <ul className="sidebar-list">
              <li>
                <Camera size={20} /> Add clear photos
              </li>
              <li>
                <Tag size={20} /> Choose the right category
              </li>
              <li>
                <FileText size={20} /> Write a detailed description
              </li>
              <li>
                <DollarSign size={20} /> Set a fair price
              </li>
            </ul>
          </div>
          <div className="form-content">
            <form onSubmit={handleSubmit} className="item-form">
              <div className="form-group">
                <label htmlFor="item_name" className="form-label">
                  Item Name
                </label>
                <input
                  type="text"
                  id="item_name"
                  name="item_name"
                  className={`form-input ${errors.item_name ? "form-input-error" : ""}`}
                  value={formData.item_name}
                  onChange={handleChange}
                  maxLength={50}
                />
                {errors.item_name && <div className="error-message">{errors.item_name}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  className={`form-textarea ${errors.description ? "form-input-error" : ""}`}
                  value={formData.description}
                  onChange={handleChange}
                  maxLength={250}
                />
                {errors.description && <div className="error-message">{errors.description}</div>}
                <div className="character-count">{formData.description.length}/250</div>
              </div>

              <div className="form-group">
                <label htmlFor="price" className="form-label">
                ₹ Price
                </label>
                <div className="price-input-wrapper">
                  {/* <DollarSign size={20} className="price-icon" /> */}
                  <input
                    type="number"
                    id="price"
                    name="price"
                    className={`form-input price-input ${errors.price ? "form-input-error" : ""}`}
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
                {errors.price && <div className="error-message">{errors.price}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="category" className="form-label">
                  Category
                </label>
                <div className="select-wrapper">
                  <select
                    id="category"
                    name="category"
                    className={`form-select ${errors.category ? "form-input-error" : ""}`}
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.category && <div className="error-message">{errors.category}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="subcategory" className="form-label">
                  Subcategory
                </label>
                <div className="select-wrapper">
                  <select
                    id="subcategory"
                    name="subcategory"
                    className={`form-select ${errors.subcategory ? "form-input-error" : ""}`}
                    value={formData.subcategory}
                    onChange={handleChange}
                    disabled={!formData.category}
                  >
                    <option value="">Select a subcategory</option>
                    {subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.subcategory && <div className="error-message">{errors.subcategory}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Product Image</label>
                {!imagePreview ? (
                  <div className="image-upload-area">
                    <input
                      type="file"
                      id="image"
                      name="image"
                      className="hidden-input"
                      onChange={handleChange}
                      accept="image/png, image/jpeg, image/jpg"
                    />
                    <label htmlFor="image" className="upload-placeholder">
                      <Upload size={48} className="upload-icon" />
                      <p className="upload-text">
                        <span className="upload-label">Click to upload</span> or drag and drop
                      </p>
                      <p className="upload-hint">PNG, JPG, JPEG up to 10MB</p>
                    </label>
                  </div>
                ) : (
                  <div className="image-preview">
                    <img src={imagePreview || "/placeholder.svg"} alt="Product Preview" className="preview-image" />
                    <button type="button" onClick={removeImage} className="remove-image-button">
                      <X size={20} />
                    </button>
                  </div>
                )}
                {errors.image && <div className="error-message">{errors.image}</div>}
              </div>

              <motion.button
                type="submit"
                className="submit-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div className="spinner-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="spinner" />
                  </motion.div>
                ) : (
                  "List Item"
                )}
              </motion.button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ListItem

