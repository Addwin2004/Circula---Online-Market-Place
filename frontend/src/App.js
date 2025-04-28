"use client"

import { useEffect } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ErrorBoundary } from "react-error-boundary"
import Header from "./components/Header"
import Home from "./components/Home"
import About from "./components/About"
import Products from "./components/Products"
import Login from "./components/Login"
import Signup from "./components/Signup"
import Feedback from "./components/Feedback"
import ListItem from "./components/ListItem"
import Footer from "./components/Footer"
import ItemDetail from "./components/ItemDetail"
import Profile from "./components/Profile"
import AdminDashboard from "./components/AdminDashboard"
import Users from "./components/Users"
import Wishlist from "./components/Wishlist"
import AdminItems from "./components/AdminItems"
import Payment from "./components/Payment"
import Card from "./components/Card"
import UserProducts from "./components/UserProducts"
import Purchased from "./components/Purchased" 
import Sold from "./components/Sold"
import AdminCategories from './components/AdminCategories';
import AdminPurchase from './components/AdminPurchase';
import AdminFeedback from './components/AdminFeedback';


import "./App.css"
import { AuthProvider, useAuth } from "./utils/AuthContext"

function ErrorFallback({ error }) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 text-center">
      <div>
        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong:</h2>
        <pre className="text-sm text-gray-600">{error.message}</pre>
      </div>
    </div>
  )
}

function AppContent() {
  const { user } = useAuth()

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth"
    return () => {
      document.documentElement.style.scrollBehavior = "auto"
    }
  }, [])

  const isAdmin = user && user.role === "Admin"

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          {!isAdmin && <Header />}
          <main className={`flex-grow ${!isAdmin ? "pt-20" : ""}`}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/products" element={<Products />} />
              <Route path="/item/:id" element={<ItemDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/list-item" element={<ListItem />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/admin-items" element={<AdminItems />} />
              <Route path="/users" element={<Users />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/payment/:orderId" element={<Payment />} />
              <Route path="/card" element={<Card />} />
              <Route path="/user-products" element={<UserProducts />} />
              <Route path="/purchased" element={<Purchased />} />
              <Route path="/sold" element={<Sold />} />
              <Route path="/admin-categories" element={<AdminCategories />} />
```           <Route path="/admin-purchase" element={<AdminPurchase />} />
```           <Route path="/admin-feedback" element={<AdminFeedback />} />


            </Routes>
          </main>
          {!isAdmin && <Footer />}
        </ErrorBoundary>
      </div>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App