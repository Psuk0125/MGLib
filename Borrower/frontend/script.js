document.getElementById('borrowForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const borrowerName = document.getElementById('borrowerName').value;
  const bookTitle = document.getElementById('bookTitle').value;

  // Validate the username against the login_credentials table
  const usernameValidationResponse = await fetch(`/validate-username?username=${borrowerName}`);
  const usernameValidationData = await usernameValidationResponse.json();

  if (usernameValidationData.valid) {
    // Proceed with borrowing the book
    const borrowBookResponse = await fetch(`/borrow-book?borrowerName=${borrowerName}&bookTitle=${bookTitle}`);
    const borrowBookData = await borrowBookResponse.json();

    if (borrowBookData.success) {
      alert('Book borrowed successfully');
      fetchBorrowedBooks();
    } else {
      alert(borrowBookData.message || 'Failed to borrow book');
    }
  } else {
    alert('Invalid username');
  }
});

async function fetchBorrowedBooks() {
  try {
    const response = await fetch('/get-borrowed-books');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const borrowedBooks = await response.json();
    displayBorrowedBooks(borrowedBooks);
  } catch (error) {
    console.error('Error fetching borrowed books:', error.message);
  }
}

async function deleteBorrowedBook(bookId) {
  try {
    const response = await fetch(`/return-book?id=${bookId}`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    if (data.success) {
      alert('Book returned successfully');
      fetchBorrowedBooks();
    } else {
      alert(data.message || 'Failed to return book');
    }
  } catch (error) {
    console.error('Error deleting borrowed book:', error.message);
  }
}

function displayBorrowedBooks(borrowedBooks) {
  const borrowedBooksBody = document.getElementById('borrowedBooksBody');
  borrowedBooksBody.innerHTML = '';

  borrowedBooks.forEach(book => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${book.borrower_name}</td>
      <td>${book.book_title}</td>
      <td>${book.author_name}</td>
      <td><img src="${book.book_cover}" alt="${book.book_title} cover" style="width: 100px;"></td>
      <td>${book.description}</td>
      <td>${book.borrowed_date}</td>
      <td>${book.return_date}</td>
      <td><button onclick="deleteBorrowedBook(${book.id})">Delete</button></td>
    `;
    borrowedBooksBody.appendChild(row);
  });
}

// Initial call to populate the table with borrowed books
fetchBorrowedBooks();
