const mysql = require("mysql");
require("dotenv").config(); // Load environment variables from .env file

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect((err) => {
    if (err) {
        console.error("Error connecting to database:", err);
        return;
    }
    console.log("Connected to database");
});

function insertUser(username, password, email, callback) {
    const sql = "INSERT INTO login_credentials (username, password, email) VALUES (?, ?, ?)";
    connection.query(sql, [username, password, email], (err, result) => {
        if (err) {
            console.error("Error inserting user:", err);
            callback(err, null);
            return;
        }
        console.log("User inserted successfully");
        callback(null, result);
    });
}

function getUserByUsername(username, callback) {
    const sql = "SELECT * FROM login_credentials WHERE username = ?";
    connection.query(sql, [username], (err, results) => {
        if (err) {
            console.error("Error fetching user:", err);
            callback(err, null);
            return;
        }
        if (results.length > 0) {
            callback(null, results[0]);
        } else {
            callback(null, null); // No user found
        }
    });
}

function getUserByEmail(email, callback) {
    const sql = "SELECT * FROM login_credentials WHERE email = ?";
    connection.query(sql, [email], (err, results) => {
        if (err) {
            console.error("Error fetching user by email:", err);
            callback(err, null);
            return;
        }
        if (results.length > 0) {
            callback(null, results[0]);
        } else {
            callback(null, null); // No user found
        }
    });
}

function getBorrowedBooksByUsername(username, callback) {
    const sql = "SELECT book_title AS title, author_name AS author, 'Borrowed' AS borrowed FROM borrowed_books WHERE borrower_name = ?";
    connection.query(sql, [username], (err, results) => {
        if (err) {
            console.error("Error fetching borrowed books:", err);
            callback(err, null);
            return;
        }
        callback(null, results);
    });
}

// Add query function
function query(sql, params, callback) {
    connection.query(sql, params, (err, results) => {
        if (err) {
            console.error("Error executing query:", err);
            callback(err, null);
            return;
        }
        callback(null, results);
    });
}

function getBookDetailsByTitle(bookTitle, callback) {
    console.log(`Executing query to fetch book with title: ${bookTitle}`); // Log the query action
    const sql = "SELECT book_title AS title, author_name AS author, book_cover, description FROM borrowed_books WHERE book_title = ?";
    connection.query(sql, [bookTitle], (err, results) => {
        if (err) {
            console.error("Error querying book details:", err);
            callback(err, null);
            return;
        }
        console.log(`Query result: ${JSON.stringify(results)}`); // Log the query result
        if (results.length === 0) {
            callback(new Error('Book not found'), null);
            return;
        }
        callback(null, results[0]);
    });
}

module.exports = {
    insertUser,
    getUserByUsername,
    getUserByEmail,
    getBorrowedBooksByUsername,
    getBookDetailsByTitle,
    query
};
