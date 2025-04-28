const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 8000;
const cors = require("cors");

app.use(cors());
app.use(express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal server error" });
});

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "uploads", "profile-pictures");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});


// Database connection
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "circula",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.post("/signup", upload.single("profilePicture"), async (req, res) => {
  const { username, email, password, phone, city } = req.body;

  try {
    // Check for duplicate email
    const [existingEmails] = await pool.execute(
      "SELECT * FROM customers WHERE email = ?",
      [email]
    );
    if (existingEmails.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Check for duplicate username
    const [existingUsernames] = await pool.execute(
      "SELECT * FROM customers WHERE username = ?",
      [username]
    );
    if (existingUsernames.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let profilePicturePath = null;
    if (req.file) {
      profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;
      // Verify the file was saved correctly
      if (!fs.existsSync(path.join(__dirname, "uploads", "profile-pictures", req.file.filename))) {
        throw new Error("Failed to save profile picture");
      }
    }

    const [result] = await pool.execute(
      "INSERT INTO customers (username, email, password, phone, city, profile_picture) VALUES (?, ?, ?, ?, ?, ?)",
      [username, email, hashedPassword, phone || null, city || null, profilePicturePath]
    );

    const userId = result.insertId;
    const token = jwt.sign({ userId }, process.env.JWT_SECRET || "your_jwt_secret", { expiresIn: "1h" });

    const [newUser] = await pool.execute(
      "SELECT id, username, email, phone, city, profile_picture, role, status FROM customers WHERE id = ?",
      [userId]
    );

    if (newUser.length === 0) {
      throw new Error("Failed to fetch newly created user");
    }

    res.status(201).json({
      message: "User created successfully",
      user: newUser[0],
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    // Handle specific database errors
    if (error.code === "ER_DUP_ENTRY") {
      if (error.message.includes("username")) {
        return res.status(400).json({ message: "Username already exists" });
      } else if (error.message.includes("email")) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await pool.execute(
      "SELECT id, username, email, password, phone, city, profile_picture, role, status FROM customers WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, "your_jwt_secret", {
      expiresIn: "1h",
    });

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: "Login successful",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Configure multer for product images
const productImagesDir = path.join(__dirname, "uploads", "product-images");
if (!fs.existsSync(productImagesDir)) {
  fs.mkdirSync(productImagesDir, { recursive: true });
}

const productImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productImagesDir);
  },
  filename: (req, file, cb) => {
    cb(null, `product-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const uploadProductImage = multer({
  storage: productImageStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, JPEG, and PNG are allowed."));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

app.get("/api/categories", async (req, res) => {
  try {
    const [categories] = await pool.execute(
      "SELECT id, name FROM categories ORDER BY name"
    );
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching categories" });
  }
});

app.get("/api/subcategories/:categoryId", async (req, res) => {
  try {
    const [subcategories] = await pool.execute(
      "SELECT id, name FROM subcategories WHERE category_id = ? ORDER BY name",
      [req.params.categoryId]
    );
    res.json(subcategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching subcategories" });
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, "your_jwt_secret", (err, decoded) => {
    if (err) {
      console.error("JWT Verification Error:", err);
      return res.status(403).json({ message: "Invalid token. Please log in again." });
    }

    console.log("✅ Decoded JWT:", decoded);

    req.user = decoded;
    next();
  });
};

// List new item
app.post("/api/items", verifyToken, uploadProductImage.single("image"), async (req, res) => {
  console.log("Request body:", req.body);
  console.log("File:", req.file);
  try {
    const { item_name, description, price, category, subcategory } = req.body;
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ message: "Product image is required" });
    }

    const imageUrl = `/uploads/product-images/${req.file.filename}`;

    const [result] = await pool.execute(
      "INSERT INTO items (customer_id, subcategory_id, name, description, price, image_url, is_sold) VALUES (?, ?, ?, ?, ?, ?, 'No')",
      [userId, subcategory, item_name, description, price, imageUrl]
    );

    res.status(201).json({
      message: "Item listed successfully",
      itemId: result.insertId,
      imageUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error listing item" });
  }
});

// Get all items - UPDATED to include is_sold field and filter out sold items by default
app.get("/api/items", verifyToken, async (req, res) => {
  try {
    const showAll = req.query.showAll === "true"; // Check if showAll is true
    let query = `
      SELECT 
        i.id, 
        i.customer_id, 
        i.subcategory_id, 
        i.name, 
        i.description, 
        i.price, 
        i.image_url, 
        i.is_sold, 
        i.created_at,
        c.username AS seller_name,
        c.city AS seller_city,
        sc.category_id AS category_id,  -- Fetch category_id from subcategories table
        EXISTS (
          SELECT 1 
          FROM \`order\` o 
          JOIN paymentdetails pd ON o.id = pd.order_id 
          WHERE o.product_id = i.id AND pd.payment_status = 'Success'
        ) AS isPurchased
      FROM items i
      JOIN customers c ON i.customer_id = c.id
      JOIN subcategories sc ON i.subcategory_id = sc.id  -- Join with subcategories to get category_id
    `;
    
    // If showAll is false, filter out purchased items
    if (!showAll) {
      query += ` WHERE NOT EXISTS (
        SELECT 1 
        FROM \`order\` o 
        JOIN paymentdetails pd ON o.id = pd.order_id 
        WHERE o.product_id = i.id AND pd.payment_status = 'Success'
      )`;
    }

    const [items] = await pool.execute(query);
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Error fetching items" });
  }
});
// Get user's wishlist
app.get("/api/wishlist", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [wishlist] = await pool.execute(
      `SELECT item_id FROM wishlist WHERE customer_id = ?`,
      [userId]
    );
    res.json(wishlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching wishlist" });
  }
});

// Add/Remove wishlist items
app.post("/api/wishlist/toggle", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: "Item ID is required" });
    }

    // Check if item exists in wishlist
    const [existing] = await pool.execute(
      `SELECT * FROM wishlist WHERE customer_id = ? AND item_id = ?`,
      [userId, itemId]
    );

    if (existing.length > 0) {
      // Remove from wishlist
      await pool.execute(`DELETE FROM wishlist WHERE customer_id = ? AND item_id = ?`, [userId, itemId]);
      return res.json({ message: "Removed from wishlist", removed: true });
    } else {
      // Add to wishlist
      await pool.execute(`INSERT INTO wishlist (customer_id, item_id) VALUES (?, ?)`, [userId, itemId]);
      return res.json({ message: "Added to wishlist", removed: false });
    }
  } catch (error) {
    console.error("Wishlist toggle error:", error);
    res.status(500).json({ message: "Error updating wishlist" });
  }
});

// Get item details - UPDATED to include is_sold field
app.get("/api/items/:id", async (req, res) => {
  try {
    const [items] = await pool.execute(
      `SELECT i.*, 
              c.username AS seller_name, 
              c.email AS seller_email,
              c.phone AS seller_phone,
              c.profile_picture AS seller_profile_picture,
              c.city AS seller_city
       FROM items i
       JOIN customers c ON i.customer_id = c.id
       WHERE i.id = ?`,
      [req.params.id]
    );

    if (items.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Process the profile picture path
    const item = items[0];
    if (item.seller_profile_picture) {
      // Remove any leading '/uploads' if it exists as we're already serving from that directory
      item.seller_profile_picture = item.seller_profile_picture.replace(/^\/uploads\//, '');
    }

    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching item details" });
  }
});

// Add this new endpoint for logout
app.post("/api/logout", verifyToken, async (req, res) => {
  try {
    // Here you would typically invalidate the token on the server-side
    // For example, you could add the token to a blacklist or invalidate the session
    // For this example, we'll just send a success response
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Error during logout" });
  }
});

//feedback

app.post("/api/feedback", verifyToken, async (req, res) => {
  try {
    const { rating, message } = req.body;
    const customerId = req.user.userId;

    const [result] = await pool.execute(
      "INSERT INTO feedback (customer_id, rating, message) VALUES (?, ?, ?)",
      [customerId, rating, message]
    );

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedbackId: result.insertId
    });
  } catch (error) {
    console.error("Feedback submission error:", error);
    res.status(500).json({ message: "Error submitting feedback" });
  }
});


// Profile endpoints
app.get("/api/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const [users] = await pool.execute(
      "SELECT id, username, email, phone, city, profile_picture FROM customers WHERE id = ?",
      [userId],
    )

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    const user = users[0]
    res.json(user)
  } catch (error) {
    console.error("Error fetching profile:", error)
    res.status(500).json({ message: "Error fetching profile" })
  }
})

app.put("/api/profile", verifyToken, upload.single("profilePicture"), async (req, res) => {
  try {
    const userId = req.user.userId
    const { username, email, phone, city } = req.body

    let updateQuery = "UPDATE customers SET username = ?, email = ?, phone = ?, city = ?"
    const queryParams = [username, email, phone, city]

    if (req.file) {
      const profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`
      updateQuery += ", profile_picture = ?"
      queryParams.push(profilePicturePath)
    }

    updateQuery += " WHERE id = ?"
    queryParams.push(userId)

    await pool.execute(updateQuery, queryParams)

    // Fetch and return updated user data
    const [users] = await pool.execute(
      "SELECT id, username, email, phone, city, profile_picture FROM customers WHERE id = ?",
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(users[0])
  } catch (error) {
    console.error("Error updating profile:", error)
    res.status(500).json({ message: "Error updating profile" })
  }
})


const isAdmin = async (req, res, next) => {
  try {
    const [users] = await pool.execute("SELECT role FROM customers WHERE id = ?", [req.user.userId])

    if (users.length === 0 || users[0].role !== "Admin") {
      return res.status(403).json({ message: "Access denied. Admin rights required." })
    }

    next()
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error verifying admin status" })
  }
}

app.get("/api/admin/dashboard-stats", verifyToken, isAdmin, async (req, res) => {
  try {
    // Get total customers
    const [customerCount] = await pool.execute("SELECT COUNT(*) as total FROM customers WHERE role = 'Customer'")

    // Get total items
    const [itemCount] = await pool.execute("SELECT COUNT(*) as total FROM items")

    // Get total sales (you'll need to add a sales/orders table for this)
    const [salesTotal] = await pool.execute("SELECT COALESCE(SUM(price), 0) as total FROM items WHERE is_sold = 'Yes'")

    // Get average rating from feedback
    const [avgRating] = await pool.execute("SELECT COALESCE(AVG(rating), 0) as average FROM feedback")

    res.json({
      totalCustomers: customerCount[0].total,
      totalItems: itemCount[0].total,
      totalSales: salesTotal[0].total,
      averageRating: Number.parseFloat(avgRating[0].average),
    })
  } catch (error) {
    console.error("Error in /api/admin/dashboard-stats:", error)
    res.status(500).json({ message: "Error fetching dashboard statistics", error: error.message })
  }
})

app.get("/api/admin/sales-data", verifyToken, isAdmin, async (req, res) => {
  try {
    // Get monthly sales data (you'll need to add a sales/orders table for this)
    const [salesData] = await pool.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%b') as month,
        COUNT(*) as sales
      FROM items 
      WHERE is_sold = 'Yes' 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY created_at DESC
      LIMIT 6
    `)

    res.json(salesData)
  } catch (error) {
    console.error("Error in /api/admin/sales-data:", error)
    res.status(500).json({ message: "Error fetching sales data", error: error.message })
  }
})

// Add this new endpoint for fetching users
app.get("/api/users", verifyToken, async (req, res) => {
  try {
    const [users] = await pool.execute("SELECT id, username, email, phone, city, created_at, role, status FROM customers")
    res.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    res.status(500).json({ message: "Error fetching users" })
  }
})

// Add this new endpoint for updating user status
app.put("/api/users/:id/status", verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    await pool.execute("UPDATE customers SET status = ? WHERE id = ?", [status, id])
    res.json({ message: "User status updated successfully" })
  } catch (error) {
    console.error("Error updating user status:", error)
    res.status(500).json({ message: "Error updating user status" })
  }
})

// Add this new endpoint to server.js - UPDATED to filter out sold items
app.get("/api/wishlist/items", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [wishlistItems] = await pool.execute(`
      SELECT 
        i.*,
        w.created_at as added_to_wishlist,
        c.city as seller_city
      FROM wishlist w
      JOIN items i ON w.item_id = i.id
      JOIN customers c ON i.customer_id = c.id
      WHERE w.customer_id = ? AND i.is_sold = 'No'
      ORDER BY w.created_at DESC
    `, [userId]);
    
    // Format the image URLs
    const formattedItems = wishlistItems.map(item => ({
      ...item,
      image_url: item.image_url
    }));

    res.json(formattedItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching wishlist items" });
  }
});

// Add this new endpoint to fetch user's items - UPDATED to include is_sold field
app.get("/api/users/:userId/items", verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const [items] = await pool.execute(`
      SELECT 
        i.id, 
        i.name, 
        i.description, 
        i.price, 
        i.image_url, 
        i.created_at,
        i.is_sold,
        i.subcategory_id,
        s.category_id,
        c.city AS seller_city
      FROM items i
      JOIN customers c ON i.customer_id = c.id
      JOIN subcategories s ON i.subcategory_id = s.id
      WHERE i.customer_id = ?
      ORDER BY i.created_at DESC
    `, [userId]);
    
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching user items" });
  }
});

// Add this new endpoint to delete an item
app.delete("/api/items/:id", verifyToken, async (req, res) => {
  try {
    const itemId = req.params.id;
    await pool.execute("DELETE FROM items WHERE id = ?", [itemId]);
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ message: "Error deleting item" });
  }
});
//////////////////////////////////////////////////////////////////payment

app.post("/api/orders", verifyToken, async (req, res) => {
  try {
    const { product_id } = req.body
    const buyer_id = req.user.userId

    // Fetch the seller_id from the items table
    const [itemResult] = await pool.execute("SELECT customer_id, price FROM items WHERE id = ? AND is_sold = 'No'", [
      product_id,
    ])

    if (itemResult.length === 0) {
      return res.status(404).json({ message: "Item not found or already sold" })
    }

    const seller_id = itemResult[0].customer_id

    // Insert the order
    const [orderResult] = await pool.execute(
      "INSERT INTO `order` (product_id, buyer_id, seller_id, order_date) VALUES (?, ?, ?, NOW())",
      [product_id, buyer_id, seller_id],
    )

    // Debug log
    console.log("Created order:", orderResult)

    res.status(201).json({
      message: "Order created successfully",
      id: orderResult.insertId, // This is the important part
    })
  } catch (error) {
    console.error("Error creating order:", error)
    res.status(500).json({ message: "Internal server error" })
  }
})

// Updated API endpoint for fetching order details
app.get("/api/orders/:orderId", verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    console.log("Fetching order:", orderId, "for user:", userId);

    const [orders] = await pool.execute(
      `SELECT 
        o.id AS orderId, 
        o.order_date AS date, 
        i.name AS item_name, 
        i.price AS total_amount, 
        i.image_url AS item_image_url, 
        c.username AS customerName, 
        c.email AS customerEmail, 
        s.username AS sellerName, 
        pd.payment_status AS status, 
        pd.payment_date
       FROM \`order\` o 
       JOIN items i ON o.product_id = i.id 
       JOIN customers c ON o.buyer_id = c.id 
       JOIN customers s ON o.seller_id = s.id 
       LEFT JOIN paymentdetails pd ON o.id = pd.order_id 
       WHERE o.id = ? AND (o.buyer_id = ? OR o.seller_id = ?)`,
      [orderId, userId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found or access denied" });
    }

    res.json(orders[0]);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Error fetching order details" });
  }
});
// Updated API endpoint for processing payments
app.post("/api/payments", verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { orderId, cardDetails } = req.body;
    const userId = req.user.userId;

    console.log("Received payment request:", { orderId, userId, cardDetails });

    // Check if the order exists and belongs to the user
    const [orderCheck] = await connection.execute(
      "SELECT o.*, i.id as item_id FROM `order` o JOIN items i ON o.product_id = i.id WHERE o.id = ? AND o.buyer_id = ?",
      [orderId, userId]
    );

    if (orderCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Order not found or access denied" });
    }

    const productId = orderCheck[0].product_id;

    // Check if the item is already sold (i.e., another order for the same product has a successful payment)
    const [existingPayment] = await connection.execute(
      `SELECT pd.* 
       FROM paymentdetails pd 
       JOIN \`order\` o ON pd.order_id = o.id 
       WHERE o.product_id = ? AND pd.payment_status = 'Success'`,
      [productId]
    );

    if (existingPayment.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Item is sold out" });
    }

    // Validate card details before proceeding
    if (!validateCardDetails(cardDetails)) {
      await connection.rollback();
      return res.status(400).json({ message: "Invalid card details" });
    }

    const [month, year] = cardDetails.expiryDate.split("/");
    const expiryDate = `20${year}-${month}-01`;

    // Check if the user already has a card
    const [existingCard] = await connection.execute(
      "SELECT id FROM card WHERE customer_id = ?",
      [userId]
    );

    let cardId;
    if (existingCard.length > 0) {
      // If the user already has a card, update it instead of inserting a new one
      cardId = existingCard[0].id;
      await connection.execute(
        "UPDATE card SET card_number = ?, expiry_date = ?, card_holder_name = ?, updated_at = NOW() WHERE id = ?",
        [cardDetails.cardNumber, expiryDate, cardDetails.cardHolderName, cardId]
      );
    } else {
      // If no existing card, insert a new one
      const [cardResult] = await connection.execute(
        "INSERT INTO card (customer_id, card_number, expiry_date, card_holder_name) VALUES (?, ?, ?, ?)",
        [userId, cardDetails.cardNumber, expiryDate, cardDetails.cardHolderName]
      );
      cardId = cardResult.insertId;
    }

    // Simulated successful payment
    const paymentStatus = "Success";

    if (paymentStatus === "Success") {
      // Mark item as sold
      const [updateResult] = await connection.execute(
        "UPDATE items SET is_sold = 'Yes' WHERE id = ? AND is_sold = 'No'",
        [orderCheck[0].item_id]
      );

      if (updateResult.affectedRows === 0) {
        throw new Error("Item is already sold");
      }

      // Insert payment details
      await connection.execute(
        "INSERT INTO paymentdetails (order_id, card_id, payment_status) VALUES (?, ?, ?)",
        [orderId, cardId, paymentStatus]
      );

      await connection.commit();
      console.log("Payment processed successfully for order:", orderId);
      res.json({ status: "Success", message: "Payment processed successfully" });
    } else {
      await connection.rollback();
      res.status(400).json({ status: "Failed", message: "Payment processing failed" });
    }
  } catch (error) {
    await connection.rollback();
    console.error("Error processing payment:", error);
    res.status(500).json({ message: "Error processing payment", error: error.message });
  } finally {
    connection.release();
  }
});

// Update the validateCardDetails function in your server.js
function validateCardDetails(cardDetails) {
  const { cardNumber, expiryDate, cardHolderName, cvv } = cardDetails;

  // Ensure only digits are present in the card number
  const cleanCardNumber = cardNumber.replace(/\D/g, ""); // ✅ Remove spaces & special characters

  console.log("Validating card details:", {
    ...cardDetails,
    cardNumber: cleanCardNumber.slice(-4).padStart(16, "*"), // ✅ Mask only for logging
  });

  // Card number must be 16 digits
  if (!/^\d{16}$/.test(cleanCardNumber)) {
    console.log("Invalid card number format");
    return false;
  }

  // CVV must be 3 digits
  if (!/^\d{3}$/.test(cvv)) {
    console.log("Invalid CVV");
    return false;
  }

  // Expiry date validation
  if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
    console.log("Invalid expiry date format");
    return false;
  }

  const [month, year] = expiryDate.split("/");
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (
    Number(year) < currentYear ||
    (Number(year) === currentYear && Number(month) < currentMonth) ||
    Number(month) > 12 ||
    Number(month) < 1
  ) {
    console.log("Invalid expiry date");
    return false;
  }

  if (cardHolderName.trim().length < 3) {
    console.log("Invalid card holder name");
    return false;
  }

  console.log("Card details are valid");
  return true;
}




// Get user's card
app.get("/api/user/card", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if the user has any cards in the database
    const [cardResult] = await pool.execute(
      "SELECT id, card_number, expiry_date, card_holder_name FROM card WHERE customer_id = ? ORDER BY updated_at DESC LIMIT 1",
      [userId]
    );

    if (cardResult.length === 0) {
      return res.status(404).json({ message: "No card found for this user" });
    }

    const card = cardResult[0]; // ✅ Send full card number without masking
    res.json(card);
  } catch (error) {
    console.error("Error fetching user card details:", error);
    res.status(500).json({ message: "Error fetching card details" });
  }
});


// Add or update card
app.post("/api/user/card", verifyToken, async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const userId = req.user.userId
    const { cardNumber, expiryDate, cardHolderName } = req.body

    // Check if user already has a card
    const [existingCard] = await connection.execute("SELECT id FROM card WHERE customer_id = ?", [userId])

    if (existingCard.length > 0) {
      // Update existing card
      await connection.execute(
        "UPDATE card SET card_number = ?, expiry_date = ?, card_holder_name = ?, updated_at = NOW() WHERE customer_id = ?",
        [cardNumber, expiryDate, cardHolderName, userId],
      )
    } else {
      // Insert new card
      await connection.execute(
        "INSERT INTO card (customer_id, card_number, expiry_date, card_holder_name) VALUES (?, ?, ?, ?)",
        [userId, cardNumber, expiryDate, cardHolderName],
      )
    }

    await connection.commit()
    res.json({ message: "Card saved successfully" })
  } catch (error) {
    await connection.rollback()
    console.error("Error saving card:", error)
    res.status(500).json({ message: "Error saving card details" })
  } finally {
    connection.release()
  }
})

// Update card
app.put("/api/user/card", verifyToken, async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const userId = req.user.userId
    const { cardNumber, expiryDate, cardHolderName } = req.body

    const [result] = await connection.execute(
      "UPDATE card SET card_number = ?, expiry_date = ?, card_holder_name = ?, updated_at = NOW() WHERE customer_id = ?",
      [cardNumber, expiryDate, cardHolderName, userId],
    )

    if (result.affectedRows === 0) {
      throw new Error("Card not found")
    }

    await connection.commit()
    res.json({ message: "Card updated successfully" })
  } catch (error) {
    await connection.rollback()
    console.error("Error updating card:", error)
    res.status(500).json({ message: "Error updating card details" })
  } finally {
    connection.release()
  }
})

// Delete card
app.delete("/api/user/card", verifyToken, async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const userId = req.user.userId

    const [result] = await connection.execute("DELETE FROM card WHERE customer_id = ?", [userId])

    if (result.affectedRows === 0) {
      throw new Error("Card not found")
    }

    await connection.commit()
    res.json({ message: "Card deleted successfully" })
  } catch (error) {
    await connection.rollback()
    console.error("Error deleting card:", error)
    res.status(500).json({ message: "Error deleting card" })
  } finally {
    connection.release()
  }
})
////////////////////////////////////////////////////////////


app.get("/api/user/products", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const query = `
      SELECT 
        i.id,
        i.name,
        i.description,
        i.price,
        i.image_url,
        i.created_at,
        sc.name as subcategory_name,
        c.name as category_name
      FROM items i
      LEFT JOIN subcategories sc ON i.subcategory_id = sc.id
      LEFT JOIN categories c ON sc.category_id = c.id
      WHERE i.customer_id = ? 
      AND i.is_sold = 'No'
      ORDER BY i.created_at DESC
    `;
    const [products] = await pool.execute(query, [userId]);
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number.parseFloat(product.price),
      image_url: product.image_url ? `http://localhost:8000${product.image_url}` : null,
      created_at: product.created_at,
      subcategory: product.subcategory_name,
      category: product.category_name,
    }));
    res.json(formattedProducts);
  } catch (error) {
    console.error("Error fetching user products:", error);
    res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
});

app.delete("/api/products/:id", verifyToken, async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user.userId;

    const [product] = await pool.execute("SELECT customer_id, is_sold FROM items WHERE id = ?", [productId]);
    if (product.length === 0) return res.status(404).json({ message: "Product not found" });
    if (product[0].customer_id !== userId) return res.status(403).json({ message: "Unauthorized" });
    if (product[0].is_sold === "Yes") return res.status(400).json({ message: "Cannot delete sold product" });

    const [orders] = await pool.execute("SELECT id FROM `order` WHERE product_id = ?", [productId]);
    if (orders.length > 0) return res.status(400).json({ message: "Product has associated orders" });

    await pool.execute("DELETE FROM items WHERE id = ? AND customer_id = ?", [productId, userId]);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
});

// Updated endpoint to use uploadProductImage middleware
app.put("/api/products/:id", verifyToken, uploadProductImage.single("image"), async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user.userId;
    const { name, description, price } = req.body;
    const imageFile = req.file;

    const [products] = await pool.execute(
      "SELECT customer_id, is_sold, image_url FROM items WHERE id = ?",
      [productId]
    );
    if (products.length === 0) return res.status(404).json({ message: "Product not found" });
    if (products[0].customer_id !== userId) return res.status(403).json({ message: "Unauthorized" });
    if (products[0].is_sold === "Yes") return res.status(400).json({ message: "Cannot edit sold product" });

    let image_url = products[0].image_url;
    if (imageFile) {
      image_url = `/uploads/product-images/${imageFile.filename}`;
    }

    await pool.execute(
      `UPDATE items 
       SET name = ?, description = ?, price = ?, image_url = ?
       WHERE id = ? AND customer_id = ?`,
      [name, description || null, price, image_url, productId, userId]
    );

    const updatedProduct = {
      id: productId,
      name,
      description,
      price: Number.parseFloat(price),
      image_url: image_url ? `http://localhost:8000${image_url}` : null,
    };

    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Failed to update product", error: error.message });
  }
});

/////////////////////////////////

// Get user's purchased items (only paid ones)
app.get("/api/user/purchased", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [purchasedItems] = await pool.execute(
      `
      SELECT 
        o.id AS order_id,    -- Unique key for each purchase
        i.id AS item_id,     -- Item ID for reference
        i.name,
        i.price,
        i.image_url,
        o.order_date AS purchase_date,
        c.username AS seller_username,
        c.email AS seller_email
      FROM \`order\` o
      JOIN items i ON o.product_id = i.id
      JOIN paymentdetails pd ON o.id = pd.order_id
      JOIN customers c ON o.seller_id = c.id
      WHERE o.buyer_id = ?
      AND pd.payment_status = 'Success'
      ORDER BY o.order_date DESC
    `,
      [userId]
    );

    // Format the response to match your frontend expectations
    const formattedItems = purchasedItems.map((item) => ({
      id: item.order_id,           // Use order_id as the unique identifier
      item_id: item.item_id,       // Include item_id if needed
      name: item.name,
      price: Number.parseFloat(item.price),
      image_url: item.image_url ? `http://localhost:8000${item.image_url}` : "/placeholder.svg",
      purchase_date: item.purchase_date,
      seller_username: item.seller_username,
      seller_email: item.seller_email,
    }));

    res.json(formattedItems);
  } catch (error) {
    console.error("Error fetching purchased items:", error);
    res.status(500).json({ message: "Error fetching purchased items" });
  }
});

//////////////////////////////

// Endpoint to get sold items for a user - CORRECTED VERSION
app.get("/api/user/sold", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId

    // Query to get all sold items with buyer information
    const query = `
      SELECT 
        i.id, 
        i.name, 
        i.description, 
        i.price, 
        i.image_url, 
        o.order_date AS sale_date, 
        c.username AS buyer_username, 
        c.email AS buyer_email
      FROM items i
      JOIN \`order\` o ON i.id = o.product_id
      JOIN customers c ON o.buyer_id = c.id
      JOIN paymentdetails p ON o.id = p.order_id
      WHERE o.seller_id = ? AND i.is_sold = 'Yes' AND p.payment_status = 'Success'
      ORDER BY o.order_date DESC
    `

    const [results] = await pool.execute(query, [userId])

    // Format image URLs
    const formattedResults = results.map((item) => ({
      ...item,
      image_url: item.image_url ? `http://localhost:8000${item.image_url}` : null,
    }))

    res.json(formattedResults)
  } catch (error) {
    console.error("Error in /api/user/sold endpoint:", error)
    res.status(500).json({ message: "Server error" })
  }
})


///////////////////////////////////////

// GET all categories with subcategories
app.get("/api/categories", verifyToken, async (req, res) => {
  try {
    const [categories] = await pool.execute("SELECT * FROM categories");
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
});
app.get("/api/subcategories/:categoryId", verifyToken, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const [subcategories] = await pool.execute("SELECT * FROM subcategories WHERE category_id = ?", [categoryId]);
    res.json(subcategories);
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({ message: "Error fetching subcategories" });
  }
});

// POST new category
app.post("/api/categories", verifyToken, async (req, res) => {
  try {
    const { name } = req.body
    const [result] = await pool.execute("INSERT INTO categories (name) VALUES (?)", [name])
    res.status(201).json({ id: result.insertId, name })
  } catch (error) {
    console.error("Error adding category:", error)
    res.status(500).json({ message: "Error adding category" })
  }
})

// PUT update category
app.put("/api/categories/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body
    await pool.execute("UPDATE categories SET name = ? WHERE id = ?", [name, id])
    res.json({ message: "Category updated successfully" })
  } catch (error) {
    console.error("Error updating category:", error)
    res.status(500).json({ message: "Error updating category" })
  }
})

// DELETE category
app.delete("/api/categories/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    await pool.execute("DELETE FROM subcategories WHERE category_id = ?", [id])
    await pool.execute("DELETE FROM categories WHERE id = ?", [id])
    res.json({ message: "Category and its subcategories deleted successfully" })
  } catch (error) {
    console.error("Error deleting category:", error)
    res.status(500).json({ message: "Error deleting category" })
  }
})

// POST new subcategory
app.post("/api/subcategories", verifyToken, async (req, res) => {
  try {
    const { name, categoryId } = req.body
    const [result] = await pool.execute("INSERT INTO subcategories (name, category_id) VALUES (?, ?)", [
      name,
      categoryId,
    ])
    res.status(201).json({ id: result.insertId, name, category_id: categoryId })
  } catch (error) {
    console.error("Error adding subcategory:", error)
    res.status(500).json({ message: "Error adding subcategory" })
  }
})

// PUT update subcategory
app.put("/api/subcategories/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body
    await pool.execute("UPDATE subcategories SET name = ? WHERE id = ?", [name, id])
    res.json({ message: "Subcategory updated successfully" })
  } catch (error) {
    console.error("Error updating subcategory:", error)
    res.status(500).json({ message: "Error updating subcategory" })
  }
})

// DELETE subcategory
app.delete("/api/subcategories/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    await pool.execute("DELETE FROM subcategories WHERE id = ?", [id])
    res.json({ message: "Subcategory deleted successfully" })
  } catch (error) {
    console.error("Error deleting subcategory:", error)
    res.status(500).json({ message: "Error deleting subcategory" })
  }
})


//////////////////////////////////purchase for admin
// 1. GET all purchases with optional filters
app.get("/api/purchases", verifyToken, async (req, res) => {
  try {
    const { status, dateFrom, dateTo, search } = req.query;
    
    let query = `
      SELECT o.id, o.id as orderId, o.order_date as date, i.price as amount,
             c.username as customerName, c.email as customerEmail,
             i.name as productName, i.id as productId,
             pd.payment_status as status,
             s.id as sellerId, s.username as sellerName
      FROM \`order\` o
      JOIN customers c ON o.buyer_id = c.id
      JOIN items i ON o.product_id = i.id
      JOIN paymentdetails pd ON o.id = pd.order_id
      JOIN customers s ON i.customer_id = s.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (status) {
      query += " AND pd.payment_status = ?";
      queryParams.push(status);
    }
    
    if (dateFrom) {
      query += " AND o.order_date >= ?";
      queryParams.push(dateFrom);
    }
    
    if (dateTo) {
      query += " AND o.order_date <= ?";
      queryParams.push(dateTo);
    }
    
    if (search) {
      query += " AND (o.id LIKE ? OR c.username LIKE ? OR i.name LIKE ? OR c.email LIKE ?)";
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam, searchParam, searchParam);
    }
    
    query += " ORDER BY o.order_date DESC";
    
    const [purchases] = await pool.execute(query, queryParams);
    
    res.json(purchases);
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res.status(500).json({ message: "Error fetching purchases" });
  }
});

// 2. GET purchase metrics
// GET purchase metrics
app.get("/api/purchases/metrics", verifyToken, async (req, res) => {
  try {
    // Total successful payments (status = 'Success')
    const [totalSuccessfulPaymentsResult] = await pool.execute(
      `SELECT COUNT(*) as totalSuccessfulPayments 
       FROM \`order\` o 
       JOIN paymentdetails pd ON o.id = pd.order_id 
       WHERE pd.payment_status = 'Success'`
    );

    // Total revenue (sum of successful transactions only)
    const [totalRevenueResult] = await pool.execute(
      `SELECT SUM(i.price) as totalRevenue 
       FROM \`order\` o 
       JOIN items i ON o.product_id = i.id 
       JOIN paymentdetails pd ON o.id = pd.order_id 
       WHERE pd.payment_status = 'Success'`
    );

    // Total amount of successful payments in the current month
    const [currentMonthPaymentsResult] = await pool.execute(
      `SELECT SUM(i.price) as currentMonthPayments 
       FROM \`order\` o 
       JOIN items i ON o.product_id = i.id 
       JOIN paymentdetails pd ON o.id = pd.order_id 
       WHERE pd.payment_status = 'Success'
       AND YEAR(o.order_date) = YEAR(CURRENT_DATE()) 
       AND MONTH(o.order_date) = MONTH(CURRENT_DATE())`
    );

    res.json({
      totalSuccessfulPayments: totalSuccessfulPaymentsResult[0].totalSuccessfulPayments,
      totalRevenue: totalRevenueResult[0].totalRevenue || 0,
      currentMonthPayments: currentMonthPaymentsResult[0].currentMonthPayments || 0
    });
  } catch (error) {
    console.error("Error fetching purchase metrics:", error);
    res.status(500).json({ message: "Error fetching purchase metrics" });
  }
});

// 3. GET a single purchase by ID (Unchanged)
app.get("/api/purchases/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [purchases] = await pool.execute(
      `SELECT o.id, o.id as orderId, o.order_date as date, i.price as amount,
              c.username as customerName, c.email as customerEmail,
              i.name as productName, i.id as productId,
              pd.payment_status as status,
              s.id as sellerId, s.username as sellerName
       FROM \`order\` o
       JOIN customers c ON o.buyer_id = c.id
       JOIN items i ON o.product_id = i.id
       JOIN paymentdetails pd ON o.id = pd.order_id
       JOIN customers s ON i.customer_id = s.id
       WHERE o.id = ?`,
      [id]
    );
    
    if (purchases.length === 0) {
      return res.status(404).json({ message: "Purchase not found" });
    }
    
    res.json(purchases[0]);
  } catch (error) {
    console.error("Error fetching purchase:", error);
    res.status(500).json({ message: "Error fetching purchase" });
  }
});

// 4. PUT update purchase status
app.put("/api/purchases/:id/status", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status to match frontend (Success, Failed only)
    const validStatuses = ["Success", "Failed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use Success or Failed only." });
    }
    
    const [result] = await pool.execute(
      "UPDATE paymentdetails SET payment_status = ? WHERE order_id = ?",
      [status, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Purchase not found" });
    }
    
    // Fetch and return the updated purchase
    const [updatedPurchase] = await pool.execute(
      `SELECT o.id as orderId, o.order_date as date, i.price as amount,
              c.username as customerName, c.email as customerEmail,
              i.name as productName, i.id as productId,
              pd.payment_status as status,
              s.id as sellerId, s.username as sellerName
       FROM \`order\` o
       JOIN customers c ON o.buyer_id = c.id
       JOIN items i ON o.product_id = i.id
       JOIN paymentdetails pd ON o.id = pd.order_id
       JOIN customers s ON i.customer_id = s.id
       WHERE o.id = ?`,
      [id]
    );
    
    res.json(updatedPurchase[0]);
  } catch (error) {
    console.error("Error updating purchase status:", error);
    res.status(500).json({ message: "Error updating purchase status" });
  }
});

// 5. GET export purchases (PDF format)
app.get("/api/purchases/export/pdf", verifyToken, async (req, res) => {
  const PDFDocument = require("pdfkit");
  try {
    const { dateFrom, dateTo } = req.query;

    let query = `
      SELECT o.id as OrderID, c.username as CustomerName, c.email as CustomerEmail,
             i.name as ProductName, i.price as Amount, 
             o.order_date as Date, pd.payment_status as Status
      FROM \`order\` o
      JOIN customers c ON o.buyer_id = c.id
      JOIN items i ON o.product_id = i.id
      JOIN paymentdetails pd ON o.id = pd.order_id
      WHERE 1=1
    `;

    const queryParams = [];

    if (dateFrom) {
      query += " AND o.order_date >= ?";
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      query += " AND o.order_date <= ?";
      queryParams.push(dateTo);
    }

    query += " ORDER BY o.order_date DESC";

    // Log the date range for debugging
    console.log("Backend Date Range:", { dateFrom, dateTo });

    const [purchases] = await pool.execute(query, queryParams);

    // Log the filtered purchases for debugging
    console.log("Filtered Purchases (Backend):", purchases.map(p => ({
      orderId: p.OrderID,
      date: p.Date,
    })));

    // Create a new PDF document
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="purchases.pdf"');

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Add a title and website name to the PDF
    doc.fontSize(20).text("Purchase Report", { align: "center" });
    doc.fontSize(12).text("Circula", { align: "center" });
    doc.moveDown(1);

    // Add filter information
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: "left" });
    if (dateFrom || dateTo) {
      doc.text(
        `Date Range: ${dateFrom ? new Date(dateFrom).toLocaleDateString() : "N/A"} to ${
          dateTo ? new Date(dateTo).toLocaleDateString() : "N/A"
        }`,
        { align: "left" }
      );
    }
    doc.moveDown(1);

    // Define table headers with increased column widths
    const headers = ["Order ID", "Customer Name", "Email", "Product Name", "Amount", "Date", "Status"];
    const colWidths = [60, 80, 140, 130, 60, 80, 60];
    const rowHeight = 30;
    let x = 50;
    let y = doc.y;

    // Draw table headers
    doc.font("Helvetica-Bold").fontSize(10);
    headers.forEach((header, i) => {
      doc.rect(x, y, colWidths[i], rowHeight).stroke();
      doc.text(header, x + 5, y + 10, { width: colWidths[i] - 10, align: "left" });
      x += colWidths[i];
    });

    y += rowHeight;

    // Draw table rows
    doc.font("Helvetica").fontSize(10);
    purchases.forEach((purchase, index) => {
      x = 50;

      const formattedAmount = purchase.Amount
        ? `₹${parseFloat(purchase.Amount).toFixed(2)}`
        : "₹0.00";

      const rowData = [
        purchase.OrderID.toString(),
        purchase.CustomerName || "N/A",
        purchase.CustomerEmail || "N/A",
        purchase.ProductName || "N/A",
        formattedAmount,
        purchase.Date ? new Date(purchase.Date).toLocaleDateString() : "N/A",
        purchase.Status || "N/A",
      ];

      rowData.forEach((data, i) => {
        doc.rect(x, y, colWidths[i], rowHeight).stroke();
        if (i === 2) {
          doc.text(data, x + 5, y + 10, {
            width: colWidths[i] - 10,
            align: "left",
            ellipsis: true,
            lineBreak: false,
          });
        } else {
          doc.text(data, x + 5, y + 10, {
            width: colWidths[i] - 10,
            align: "left",
            ellipsis: true,
          });
        }
        x += colWidths[i];
      });

      y += rowHeight;

      if (y > 700) {
        doc.addPage();
        y = 50;
        x = 50;

        doc.font("Helvetica-Bold").fontSize(10);
        headers.forEach((header, i) => {
          doc.rect(x, y, colWidths[i], rowHeight).stroke();
          doc.text(header, x + 5, y + 10, { width: colWidths[i] - 10, align: "left" });
          x += colWidths[i];
        });

        y += rowHeight;
      }
    });

    doc.end();
  } catch (error) {
    console.error("Error exporting purchases to PDF:", error);
    res.status(500).json({ message: "Error exporting purchases to PDF" });
  }
});
////////////////////////////////////admin feedback

// GET all feedbacks
app.get("/api/feedbacks", verifyToken, async (req, res) => {
  try {
    const { search } = req.query;

    let query = `
      SELECT f.id, c.username as userName, f.rating, f.message as comment, f.created_at as date
      FROM feedback f
      JOIN customers c ON f.customer_id = c.id
      WHERE 1=1
    `;

    const queryParams = [];

    if (search) {
      query += " AND (f.id LIKE ? OR c.username LIKE ? OR f.message LIKE ?)";
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam, searchParam);
    }

    query += " ORDER BY f.created_at DESC";

    const [feedbacks] = await pool.execute(query, queryParams);

    res.json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ message: "Error fetching feedbacks" });
  }
});

///////////////////////////admin dashboard
// GET dashboard metrics
app.get("/api/dashboard/metrics", verifyToken, async (req, res) => {
  try {
    const [totalUsersResult] = await pool.execute("SELECT COUNT(*) as totalUsers FROM customers");
    const [totalProductsResult] = await pool.execute("SELECT COUNT(*) as totalProducts FROM items");
    const [revenueResult] = await pool.execute(
      `SELECT COALESCE(SUM(i.price), 0) as revenue 
       FROM paymentdetails pd 
       JOIN \`order\` o ON pd.order_id = o.id 
       JOIN items i ON o.product_id = i.id 
       WHERE pd.payment_status = 'Success'`
    );
    const [pendingOrdersResult] = await pool.execute(
      `SELECT COUNT(*) as pendingOrders 
       FROM paymentdetails 
       WHERE payment_status = 'Failed'`
    );
    const [satisfactionResult] = await pool.execute(
      `SELECT COALESCE(AVG(rating), 0) as avgRating 
       FROM feedback`
    );
    const satisfaction = Number(satisfactionResult[0].avgRating) || 0;

    const metrics = {
      totalUsers: totalUsersResult[0].totalUsers || 0,
      totalProducts: totalProductsResult[0].totalProducts || 0,
      revenue: revenueResult[0].revenue || 0,
      satisfaction: satisfaction,
      pendingOrders: pendingOrdersResult[0].pendingOrders || 0,
    };

    console.log("Dashboard metrics:", metrics); // Debug log
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ message: "Error fetching dashboard metrics" });
  }
});

app.get("/api/top-sellers", verifyToken, async (req, res) => {
  try {
    const [topSellersResult] = await pool.execute(
      `SELECT 
        c.id,
        c.username AS name,  -- Changed c.name to c.username to match customers table
        c.email,
        COUNT(o.id) AS itemsSold
      FROM customers c
      JOIN items i ON i.customer_id = c.id  -- Fixed: Changed i.seller_id to i.customer_id
      JOIN \`order\` o ON o.product_id = i.id
      JOIN paymentdetails pd ON o.id = pd.order_id
      WHERE pd.payment_status = 'Success'
      GROUP BY c.id, c.username, c.email
      ORDER BY itemsSold DESC
      LIMIT 5`
    );

    const topSellers = topSellersResult.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      itemsSold: row.itemsSold,
    }));

    console.log("Top sellers data:", topSellers); // Debug log
    res.json(topSellers);
  } catch (error) {
    console.error("Error fetching top sellers:", error.message, error.stack);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

///////////////////////////////////
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})

console.log("Server file loaded successfully")




