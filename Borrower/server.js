const express = require('express');
const mysql = require('mysql');
const path = require('path');

const app = express();
const port = 5000;

// MySQL connection configuration
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL database');
});

// Serve static files from the 'frontend' directory
const publicDirectoryPath = 'C:/Users/psuk0/OneDrive/중요 사진 보관/바탕 화면/ActuallyWorking Library Program/Lister/public';
app.use(express.static(path.join(__dirname, 'frontend')));

// Route handler for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// API endpoint to borrow a book
app.get('/borrow-book', (req, res) => {
  const { borrowerName, bookTitle } = req.query;
  const borrowedDate = new Date().toISOString().slice(0, 10); // Today's date
  const returnDate = new Date();
  returnDate.setDate(returnDate.getDate() + 15); // 15 days from today

  // Check if the book is already borrowed
  const checkQuery = `SELECT * FROM borrowed_books WHERE book_title = ?`;
  db.query(checkQuery, [bookTitle], (err, result) => {
    if (err) {
      res.status(500).send('Error querying database');
      return;
    }
    if (result.length > 0) {
      res.send({ success: false, message: 'Book already borrowed' });
      return;
    }

    // Check if the book exists in the library and get details
    const bookQuery = `SELECT * FROM books WHERE title = ?`;
    db.query(bookQuery, [bookTitle], (err, result) => {
      if (err) {
        res.status(500).send('Error querying database');
        return;
      }
      if (result.length === 0) {
        res.send({ success: false, message: 'Book not found' });
        return;
      }

      // Get book details
      const book = result[0];
      const { author, book_cover, description } = book;

      // Insert borrowed book record including book details
      const insertQuery = `INSERT INTO borrowed_books (borrower_name, book_title, author_name, book_cover, description, borrowed_date, return_date) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      db.query(insertQuery, [borrowerName, bookTitle, author, book_cover, description, borrowedDate, returnDate.toISOString().slice(0, 10)], (err, result) => {
        if (err) {
          res.status(500).send('Error inserting record into database');
          return;
        }
        res.send({ success: true });
      });
    });
  });
});


// API endpoint to return a book (delete borrowed book record)
app.delete('/return-book', (req, res) => {
  const bookId = req.query.id;

  const deleteQuery = `DELETE FROM borrowed_books WHERE id = ?`;
  db.query(deleteQuery, [bookId], (err, result) => {
    if (err) {
      res.status(500).send('Error deleting record from database');
      return;
    }
    res.send({ success: true });
  });
});

// API endpoint to fetch borrowed books
app.get('/get-borrowed-books', (req, res) => {
  const query = `SELECT * FROM borrowed_books`;
  db.query(query, (err, result) => {
    if (err) {
      res.status(500).send('Error querying database');
      return;
    }
    res.send(result);
  });
});

// API endpoint to validate username
app.get('/validate-username', (req, res) => {
  const username = req.query.username;
  const validateQuery = `SELECT * FROM login_credentials WHERE username = ?`;

  db.query(validateQuery, [username], (err, result) => {
    if (err) {
      res.status(500).send('Error querying database');
      return;
    }
    if (result.length > 0) {
      res.send({ valid: true });
    } else {
      res.send({ valid: false });
    }
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
