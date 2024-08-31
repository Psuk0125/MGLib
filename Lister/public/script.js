// script.js

document.addEventListener('DOMContentLoaded', () => {
    const bookList = document.getElementById('book-list');
    const searchForm = document.getElementById('search-form');
    const addBookForm = document.getElementById('add-book-form');
    const homeButton = document.getElementById('home-button');

    function fetchBooks(searchTerm = '') {
        let url = '/books';
        if (searchTerm) {
            url += `?title=${encodeURIComponent(searchTerm)}`;
        }
        fetch(url)
            .then(response => response.json())
            .then(books => {
                bookList.innerHTML = '';
                books.forEach(book => {
                    const li = document.createElement('li');
                    li.textContent = `${book.title} by ${book.author} (ISBN: ${book.isbn}) - ${book.description}`;
                    
                    // Check if book_cover is available and display it
                    if (book.book_cover) {
                        const img = document.createElement('img');
                        img.src = book.book_cover;  // This should be the path stored in the database
                        img.alt = `${book.title} cover`;
                        img.style.width = '100px';  // Adjust size as needed
                        img.style.display = 'block';  // Make sure it is displayed as a block element
                        li.appendChild(img);
                    }

                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.addEventListener('click', () => {
                        deleteBook(book.id);
                    });

                    li.appendChild(deleteButton);
                    bookList.appendChild(li);
                });
            })
            .catch(error => console.error('Error fetching books:', error));
    }

    function deleteBook(bookId) {
        fetch(`/books/${bookId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete book');
            }
            return response.json();
        })
        .then(data => {
            fetchBooks();
        })
        .catch(error => console.error('Error deleting book:', error));
    }

    fetchBooks();

    searchForm.addEventListener('submit', event => {
        event.preventDefault();
        const searchTerm = document.getElementById('search-term').value;
        fetchBooks(searchTerm);
    });

    addBookForm.addEventListener('submit', event => {
        event.preventDefault();
        const title = document.getElementById('title').value;
        const author = document.getElementById('author').value;
        const isbn = document.getElementById('isbn').value;
        const book_cover = document.getElementById('book_cover').value;
        const description = document.getElementById('description').value;

        fetch('/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, author, isbn, book_cover, description })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to add book');
            }
            return response.json();
        })
        .then(data => {
            fetchBooks();
            addBookForm.reset();
        })
        .catch(error => console.error('Error adding book:', error));
    });

    homeButton.addEventListener('click', () => {
        fetchBooks();
    });
});
