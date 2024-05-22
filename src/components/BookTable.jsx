import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTable, useSortBy, usePagination } from 'react-table';
import { CSVLink } from 'react-csv';

const BookTable = () => {
  const [books, setBooks] = useState([]);
  const [pageSize, setLocalPageSize] = useState(10);
  const [searchAuthor, setSearchAuthor] = useState('');
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // const fetchBooks = async () => {
  //   try {
  //     const response = await axios.get('https://openlibrary.org/subjects/science_fiction.json?limit=100');
  //     const works = response.data.works.map(work => ({
  //       id: work.key, // Add unique identifier for each book
  //       title: work.title,
  //       author_name: work.authors[0]?.name || 'N/A',
  //       first_publish_year: work.first_publish_year || 'N/A',
  //       subject: work.subject || 'N/A',
  //       ratings_average: work.rating || 'N/A',
  //       author_birth_date: work.authors[0]?.birth_date || 'N/A',
  //       author_top_work: work.authors[0]?.top_work || 'N/A'
  //     }));
  //     setBooks(works);
  //     setFilteredBooks(works);
  //   } catch (error) {
  //     console.error('Error fetching book data:', error);
  //   }
  // };

  const fetchBooks = async () => {
    try {
      const response = await axios.get('https://openlibrary.org/people/mekBot/books/want-to-read.json?limit=100');
      const bookEntries = response.data.reading_log_entries;

      //rating
      const ratingPromiseArray = bookEntries.map((book) => {
        const bookId = book.work.key; // Assuming key format is something like "/works/OL123W"
        return axios.get(`https://openlibrary.org${bookId}/ratings.json`);
      });

      const ratingResponseArray = await Promise.all(ratingPromiseArray);
      const bookRatings = ratingResponseArray.map((ratingResponse) => {
        return ratingResponse.data.summary.average;
      });

      //subject
      const subjectPromiseArray = bookEntries.map((book) => {
        const bookId = book.work.key; // Assuming key format is something like "/works/OL123W"
        return axios.get(`https://openlibrary.org${bookId}.json`);
      });

      const subjectResponseArray = await Promise.all(subjectPromiseArray);
      const bookSubjects = subjectResponseArray.map((subjectResponse) => {
        const subjects = subjectResponse.data.subjects;
        if(subjects && subjects.length > 0){
          return subjectResponse.data.subjects[0] 
        }

        return "NA";
        
      });


      //author
      const authorPromiseArray = bookEntries.map((book) => {
        const authorId = book.work.author_keys[0]; // Assuming key format is something like "/author/OL123W"
        return axios.get(`https://openlibrary.org${authorId}.json`);
      });

      const authorResponseArray = await Promise.all(authorPromiseArray);

      const bookAuthorsBirthDates = authorResponseArray.map((authorResponse) => {
        return authorResponse.data.birth_date;
      });
      

      setBooks((prev) => {
        const newState = bookEntries.map((book,index) => {
          return ({
            id: book.work.key, // Add unique identifier for each book
            title: book.work.title,
            author_name: book.work.author_names[0] || 'N/A',
            first_publish_year: book.work.first_publish_year || 'N/A',
            subject : bookSubjects[index],
            author_birth_date : bookAuthorsBirthDates[index] ? bookAuthorsBirthDates[index] : 'NA',
            ratings_average : bookRatings[index] ? Math.round(bookRatings[index] * 100) / 100:  'NA',
            author_top_work: book.work.title? book.work.title:'N/A' 
          })
        })

        return newState;
      });

    } catch (error) {
      console.error('Error fetching book data:', error);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (searchAuthor === '') {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(book =>
        book.author_name.toLowerCase().includes(searchAuthor.toLowerCase())
      );
      setFilteredBooks(filtered);
    }
  }, [searchAuthor, books]);

  const data = React.useMemo(() => filteredBooks, [filteredBooks]);
  const columns = React.useMemo(() => [
    { Header: 'Title', accessor: 'title' },
    { Header: 'Author Name', accessor: 'author_name' },
    { Header: 'First Publish Year', accessor: 'first_publish_year' },
    { Header: 'Subject', accessor: 'subject' },
    { Header: 'Ratings Average', accessor: 'ratings_average' },
    { Header: 'Author Birth Date', accessor: 'author_birth_date' },
    { Header: 'Author Top Work', accessor: 'author_top_work' },
    {
      Header: 'Actions',
      accessor: 'id',
      Cell: ({ row }) => (
        <button onClick={() => handleEdit(row.original)}>Edit</button>
      )
    }
  ], []);

  const handleEdit = (book) => {
    setEditingBook(book);
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedBooks = books.map(book => book.id === editingBook.id ? editingBook : book);
    setBooks(updatedBooks);
    setFilteredBooks(updatedBooks);
    setIsEditing(false);
    setEditingBook(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditingBook(prevBook => ({
      ...prevBook,
      [name]: value
    }));
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize: setTablePageSize,
    state: { pageIndex, pageSize: tablePageSize }
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: pageSize },
    },
    useSortBy,
    usePagination
  );

  useEffect(() => {
    setTablePageSize(pageSize);
  }, [pageSize, setTablePageSize]);

  const csvData = filteredBooks.map(book => ({
    Title: book.title,
    'Author Name': book.author_name,
    'First Publish Year': book.first_publish_year,
    Subject: book.subject,
    'Ratings Average': book.ratings_average,
    'Author Birth Date': book.author_birth_date,
    'Author Top Work': book.author_top_work
  }));

  return (
    <div>
      <div>
        <input
          type="text"
          placeholder="Search by author..."
          value={searchAuthor}
          onChange={e => setSearchAuthor(e.target.value)}
        />
      </div>
      {isEditing && (
        <div className="modal">
          <h2>Edit Book</h2>
          <label>
            Title:
            <input
              type="text"
              name="title"
              value={editingBook.title}
              onChange={handleChange}
            />
          </label>
          <label>
            Author Name:
            <input
              type="text"
              name="author_name"
              value={editingBook.author_name}
              onChange={handleChange}
            />
          </label>
          <label>
            First Publish Year:
            <input
              type="text"
              name="first_publish_year"
              value={editingBook.first_publish_year}
              onChange={handleChange}
            />
          </label>
          <label>
            Subject:
            <input
              type="text"
              name="subject"
              value={editingBook.subject}
              onChange={handleChange}
            />
          </label>
          <label>
            Ratings Average:
            <input
              type="text"
              name="ratings_average"
              value={editingBook.ratings_average}
              onChange={handleChange}
            />
          </label>
          <label>
            Author Birth Date:
            <input
              type="text"
              name="author_birth_date"
              value={editingBook.author_birth_date}
              onChange={handleChange}
            />
          </label>
          <label>
            Author Top Work:
            <input
              type="text"
              name="author_top_work"
              value={editingBook.author_top_work}
              onChange={handleChange}
            />
          </label>
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      )}
      <table {...getTableProps()} style={{ width: '100%', border: '1px solid black' }}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? ' 🔽'
                        : ' 🔼'
                      : ''}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div>
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>{' '}
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>{' '}
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>{' '}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>{' '}
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{' '}
        </span>
        <select
          value={tablePageSize}
          onChange={e => {
            setLocalPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50, 100].map(size => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
      <div>
        <CSVLink data={csvData} filename="book_data.csv">
          Download CSV
        </CSVLink>
      </div>
    </div>
  );
};

export default BookTable;
