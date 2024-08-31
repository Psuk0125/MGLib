document.addEventListener('DOMContentLoaded', () => {
    async function showDetails(bookId) {
        console.log(`Clicked Show Details for book ID: ${bookId}`); // Log the book ID
        try {
            const response = await fetch(`/books/${bookId}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const book = await response.json();
            displayBookDetails(book);
        } catch (error) {
            console.error('Error fetching book details:', error);
            alert('Failed to load book details');
        }
    }
    

    function displayBookDetails(book) {
        document.getElementById('book-title').textContent = book.title;
        document.getElementById('book-author').textContent = book.author;
        document.getElementById('book-description').textContent = book.description;
        document.getElementById('book-cover').src = book.book_cover ? `/Bookcovers/${book.book_cover}` : '';
        document.getElementById('book-cover').alt = `${book.title} cover`;
    }

    // Add event listeners to table rows
    const rows = document.querySelectorAll('#book-list tr');
    rows.forEach(row => {
        row.addEventListener('click', () => {
            const bookId = row.getAttribute('data-id');
            showDetails(bookId);
        });
    });
});
