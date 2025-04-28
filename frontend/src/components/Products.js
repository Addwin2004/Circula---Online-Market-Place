"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Heart, Filter, ChevronDown, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/Products.css";

const Products = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState(new Set());
  const [error, setError] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check authentication once on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      // Fetch products with Authorization header
      const productsResponse = await fetch("http://localhost:8000/api/items", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!productsResponse.ok) throw new Error("Failed to load products");
      const productsData = await productsResponse.json();
      console.log("Fetched items:", productsData);

      // Filter out sold items
      const unsoldItems = productsData.filter((item) => item.is_sold !== "Yes");
      setItems(unsoldItems);

      // Extract unique cities
      const uniqueCities = [
        ...new Set(unsoldItems.map((item) => item.seller_city).filter(Boolean)),
      ];
      setCities(uniqueCities.sort());

      // Fetch categories
      const categoriesResponse = await fetch("http://localhost:8000/api/categories", {
        headers: {
          Authorization: `Bearer ${token}`, // Add token here if categories endpoint is protected
        },
      });
      if (!categoriesResponse.ok) throw new Error("Failed to fetch categories");
      const categoriesData = await categoriesResponse.json();
      setCategories(categoriesData);

      // Fetch wishlist if user is authenticated
      const wishlistResponse = await fetch("http://localhost:8000/api/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (wishlistResponse.ok) {
        const wishlistData = await wishlistResponse.json();
        setWishlistItems(new Set(wishlistData.map((item) => item.item_id)));
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      setError(`Failed to load data. Please try again. Details: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Fetch subcategories when category changes
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!selectedCategory) {
        setSubcategories([]);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:8000/api/subcategories/${selectedCategory}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Add token if this endpoint is protected
          },
        });
        if (!response.ok) throw new Error("Failed to fetch subcategories");
        const data = await response.json();
        setSubcategories(data);
      } catch (error) {
        console.error("Error fetching subcategories:", error);
      }
    };

    fetchSubcategories();
  }, [selectedCategory]);

  const handleWishlistToggle = async (itemId, e) => {
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to add items to wishlist");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/wishlist/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId }),
      });

      if (response.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!response.ok) throw new Error("Failed to update wishlist");

      const data = await response.json();
      setWishlistItems((prev) => {
        const newSet = new Set(prev);
        if (data.removed) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
    } catch (error) {
      console.error("Error updating wishlist:", error);
    }
  };

  // Filter items based on search and filters
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || item.category_id === Number.parseInt(selectedCategory);
    const matchesSubcategory =
      !selectedSubcategory || item.subcategory_id === Number.parseInt(selectedSubcategory);
    const matchesCity = !selectedCity || item.seller_city === selectedCity;
    const matchesMinPrice = !priceRange.min || item.price >= Number(priceRange.min);
    const matchesMaxPrice = !priceRange.max || item.price <= Number(priceRange.max);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesSubcategory &&
      matchesCity &&
      matchesMinPrice &&
      matchesMaxPrice
    );
  });

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader className="loading-spinner" size={48} />
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="search-container">
        <Search className="search-icon" />
        <input
          type="text"
          placeholder="Search products"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="products-content">
        <aside className={`filters-panel ${isFilterOpen ? "open" : ""}`}>
          <button className="filter-toggle" onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <Filter size={20} />
            Filters
            <ChevronDown size={20} className={isFilterOpen ? "rotate" : ""} />
          </button>
          <div className="filter-content">
            <h2>Filters</h2>
            <div className="filter-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory("");
                }}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="subcategory">Subcategory</label>
              <select
                id="subcategory"
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                disabled={!selectedCategory}
              >
                <option value="">All Subcategories</option>
                {subcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="city">City</label>
              <select id="city" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Price Range</label>
              <div className="price-inputs">
                <input
                  type="number"
                  name="min"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                />
                <input
                  type="number"
                  name="max"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                />
              </div>
            </div>

            <button
              className="reset-button"
              onClick={() => {
                setSelectedCategory("");
                setSelectedSubcategory("");
                setSelectedCity("");
                setPriceRange({ min: "", max: "" });
              }}
            >
              Reset Filters
            </button>
          </div>
        </aside>

        <main className="products-grid">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              className="product-card"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/item/${item.id}`)}
              style={{ cursor: "pointer" }}
            >
              <img
                src={`http://localhost:8000${item.image_url}` || "/placeholder.svg"}
                alt={item.name}
                className="product-image"
              />
              <button className="wishlist-button" onClick={(e) => handleWishlistToggle(item.id, e)}>
                <Heart size={20} fill={wishlistItems.has(item.id) ? "red" : "none"} />
              </button>
              <div className="product-info">
                <h3>{item.name}</h3>
                <p className="price">₹{item.price}</p>
                <p className="city">{item.seller_city}</p>
              </div>
            </motion.div>
          ))}
          {filteredItems.length === 0 && (
            <div className="no-results">
              <p>No items found matching your criteria.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;