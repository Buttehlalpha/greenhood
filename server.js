const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();

//  MongoDB Connection
mongoose.connect(
  "mongodb+srv://alphaDB:alpha%402019@cluster0.akwwbwn.mongodb.net/greenhood?retryWrites=true&w=majority&appName=Cluster0"
)
.then(() => console.log(" MongoDB connected"))
.catch(err => console.log(" MongoDB error:", err));

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
  checkbox: String,
  register: String,
}, { timestamps: true });

const Form = mongoose.model("Form", FormSchema);

//  Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: "greenhood-secret-key",
  resave: false,
  saveUninitialized: true
}));

const ADMIN = { email: "admin@greenhood.com", password: "alpha@2019" };

//  Middleware to protect dashboard
function isAuthenticated(req, res, next){
  if(req.session.user) return next();
  res.redirect("/login");
}

// --- Routes ---
app.get("/", (req,res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/login", (req,res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

app.post("/login", (req,res) => {
  const { email, password } = req.body;
  if(email === ADMIN.email && password === ADMIN.password){
    req.session.user = { email };
    return res.redirect("/dashboard");
  }
  res.status(401).send("Invalid credentials");
});

app.get("/dashboard", isAuthenticated, (req,res) => {
  res.sendFile(path.join(__dirname, "public/dashboard.html"));
});

app.get("/logout", (req,res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// Handle form submission (JSON response for SweetAlert)
app.post("/submit-form", async (req,res) => {
  try {
    req.body.checkbox = req.body.checkbox === "on" ? "on" : "";
    const newForm = new Form(req.body);
    await newForm.save();
    console.log(" Form saved:", newForm);
    res.json({ success: true, message: "Form submitted successfully!" });
  } catch(err){
    console.error("❌ Error saving form:", err);
    res.status(500).json({ success: false, message: "Error submitting form. Try again." });
  }
});

app.get("/submissions", isAuthenticated, async (req,res) => {
  try {
    const submissions = await Form.find().sort({ createdAt: -1 });
    res.json(submissions);
  } catch(err){
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.get("/:page", (req,res) => {
  const page = req.params.page + ".html";
  res.sendFile(path.join(__dirname, "public", page));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
