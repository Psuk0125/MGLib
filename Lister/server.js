// server.js
const express = require('express');
const mysql = require('mysql');
const path = require('path');

const app = express();
const port = 4000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL database');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/books', (req, res) => {
  const { title } = req.query;
  let query = 'SELECT * FROM books';

  if (title) {
    query = `SELECT * FROM books WHERE title LIKE '%${title}%'`;
  }

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching books:', error);
      res.status(500).json({ error: 'Failed to fetch books' });
      return;
    }
    res.json(results);
  });
});

app.post('/books', (req, res) => {
  const { title, author, isbn, book_cover, description } = req.body;
  connection.query('INSERT INTO books (title, author, isbn, book_cover, description) VALUES (?, ?, ?, ?, ?)', [title, author, isbn, book_cover, description], (error, results) => {
    if (error) {
      console.error('Error adding book:', error);
      res.status(500).json({ error: 'Failed to add book' });
      return;
    }
    res.status(201).json({ message: 'Book added successfully' });
  });
});

app.delete('/books/:id', (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM books WHERE id = ?', id, (error, results) => {
    if (error) {
      console.error('Error deleting book:', error);
      res.status(500).json({ error: 'Failed to delete book' });
      return;
    }
    res.json({ message: 'Book deleted successfully' });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
