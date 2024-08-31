const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const path = require("path");
const session = require("express-session");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

// Declare verificationCodes as an empty object
let verificationCodes = {};

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware setup
app.use(session({
    secret: "your-secret-key", // Replace with a strong secret
    resave: false,
    saveUninitialized: true
}));

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "parkchung.myanmar@gmail.com",
        pass: "oagz hzsv ukti ysuv" // Consider using environment variables for sensitive data
    }
});

// Set the view engine to EJS and specify the views directory
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Serve the home page
app.get("/", (req, res) => {
    res.render("home");
});

// Serve the login page
app.get("/login", (req, res) => {
    res.render("login", { errorMessage: req.session.errorMessage || null });
    req.session.errorMessage = null; // Clear the error message after rendering
});

// Serve the register page
app.get("/register", (req, res) => {
    res.render("register", { errorMessage: req.session.errorMessage || null });
    req.session.errorMessage = null; // Clear the error message after rendering
});

// Serve the books page
app.get("/books", (req, res) => {
    const username = req.session.username;

    if (!username) {
        return res.redirect("/login");
    }

    db.getBorrowedBooksByUsername(username, (err, books) => {
        if (err) {
            console.error("Error fetching borrowed books:", err);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }

        res.render("books", { user: { username }, books });
    });
});

// Handle sending verification code
app.post("/sendVerificationCode", (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Check if email already exists
    db.getUserByEmail(email, (err, userByEmail) => {
        if (err) {
            console.error("Error checking email:", err);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }

        if (userByEmail) {
            return res.json({ success: false, message: "Email already registered" });
        }

        // Check if username already exists
        db.getUserByUsername(username, (err, userByUsername) => {
            if (err) {
                console.error("Error checking username:", err);
                return res.status(500).json({ success: false, message: "Internal server error" });
            }

            if (userByUsername) {
                return res.json({ success: false, message: "Username already taken" });
            }

            const verificationCode = Math.floor(1000 + Math.random() * 9000);
            verificationCodes[email] = verificationCode;

            const mailOptions = {
                from: "parkchung.myanmar@gmail.com",
                to: email,
                subject: "Email Verification Code",
                text: `Your verification code is: ${verificationCode}`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error sending email:", error);
                    res.json({ success: false, message: "Failed to send verification code. Please try again." });
                } else {
                    console.log("Email sent:", info.response);
                    res.json({ success: true, message: "Verification code sent. Please check your email." });
                }
            });
        });
    });
});

// Handle verifying the code
app.post("/verifyCode", (req, res) => {
    const { email, username, password, verificationCode } = req.body;

    const storedVerificationCode = verificationCodes[email];

    if (storedVerificationCode && verificationCode === storedVerificationCode.toString()) {
        db.insertUser(username, password, email, (err, result) => {
            if (err) {
                console.error("Error inserting user into database:", err);
                res.json({ success: false, message: "Failed to register user. Please try again." });
            } else {
                console.log("User inserted into database successfully");
                res.json({ success: true, message: "User registered successfully!" });
                delete verificationCodes[email]; // Remove the code after successful registration
            }
        });
    } else {
        res.json({ success: false, message: "Invalid verification code. Please try again." });
    }
});

// Handle user login
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    db.getUserByUsername(username, (err, user) => {
        if (err) {
            console.error("Error fetching user from database:", err);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }

        if (user) {
            if (user.password === password) {
                req.session.username = username;
                res.redirect("/books");
            } else {
                req.session.errorMessage = "Invalid username or password. Try again.";
                res.redirect("/login");
            }
        } else {
            req.session.errorMessage = "Invalid username or password. Try again.";
            res.redirect("/login");
        }
    });
});

// Handle user logout
app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
        }
        res.redirect("/login");
    });
});

// Route to get book details for a pop-up
app.get('/books/details', (req, res) => {
    const bookTitle = req.query.title;

    const query = 'SELECT book_cover, description FROM borrowed_books WHERE book_title = ?';
    db.query(query, [bookTitle], (err, results) => {
        if (err) {
            console.error('Error querying book details:', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }
        res.json(results[0]);
    });
});

// Route to serve book description page
app.get('/books/description', (req, res) => {
    const bookTitle = req.query.title;

    const query = 'SELECT book_title AS title, author_name AS author, book_cover, description FROM borrowed_books WHERE book_title = ?';
    db.query(query, [bookTitle], (err, results) => {
        if (err) {
            console.error('Error querying book details:', err);
            return res.status(500).send('Internal server error');
        }
        if (results.length === 0) {
            return res.status(404).send('Book not found');
        }

        const book = results[0];
        const user = { username: req.session.username };
        res.render('book_description', { book, user });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
