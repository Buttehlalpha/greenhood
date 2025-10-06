const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();

// ✅ MongoDB Connection
mongoose.connect(
  "mongodb+srv://alphaDB:alpha%402019@cluster0.akwwbwn.mongodb.net/greenhood?retryWrites=true&w=majority&appName=Cluster0"
)
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.log("❌ MongoDB error:", err));


const FormSchema = new mongoose.Schema({
  title: String,
  first_name: String,
  last_name: String,
  position: String,
  agentcode: String,
  product: String,
  street: String,
  additional: String,
  state: String,
  lga: String,
  code: String,
  phone: String,
  your_email: String,
  checkbox: String, // "on" or ""
  register: String,
}, { timestamps: true });

const Form = mongoose.model("Form", FormSchema);

// ✅ Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: "greenhood-secret-key",
  resave: false,
  saveUninitialized: true
}));

// ✅ Dummy admin credentials
const ADMIN = { email: "admin@greenhood.com", password: "alpha@2019" };

// ✅ Middleware to protect dashboard
function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}

// --- Routes ---

// Serve index
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

//// ✅ Login action
app.post("/login", (req, res) => {
  const { email, password } = req.body; 

  if (email === "admin@greenhood.com" && password === "alpha@2019") {
    req.session.user = { email };
    return res.redirect("/dashboard");
  }
  res.status(401).send("Invalid credentials");
});

// Dashboard (protected)
app.get("/dashboard", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// Handle form submissions
app.post("/submit-form", async (req, res) => {
  try {
    req.body.checkbox = req.body.checkbox === "on" ? "on" : "";
    const newForm = new Form(req.body);
    await newForm.save();
    console.log("✅ Form saved:", newForm);
    res.json({ success: true, message: "Form submitted successfully!", data: req.body });
  } catch (err) {
    console.error("❌ Error saving form:", err, err.stack);
    res.status(500).json({ success: false, message: "Error saving form", error: String(err) });
  }
});

// Fetch all submissions (for dashboard)
app.get("/submissions", isAuthenticated, async (req, res) => {
  try {
    const submissions = await Form.find().sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    console.error("❌ Error fetching submissions:", err);
    res.status(500).json({ success: false, message: "Error fetching submissions", error: String(err) });
  }
});

// Catch-all for other HTML pages
app.get("/:page", (req, res) => {
  const page = req.params.page + ".html";
  res.sendFile(path.join(__dirname, "public", page));
});

// ✅ Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
