import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTable, useSortBy, usePagination } from "react-table";
import { CSVLink } from "react-csv";

const BookTable = () => {
  const [books, setBooks] = useState([]);
  const [pageSize, setLocalPageSize] = useState(10);
  const [searchAuthor, setSearchAuthor] = useState("");
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

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
    setLoading(true);
    try {
      const response = await axios.get(
        "https://openlibrary.org/people/mekBot/books/want-to-read.json?limit=100"
      );
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
        if (subjects && subjects.length > 0) {
          return subjectResponse.data.subjects[0];
        }

        return "NA";
      });

      //author
      const authorPromiseArray = bookEntries.map((book) => {
        const authorId = book.work.author_keys[0]; // Assuming key format is something like "/author/OL123W"
        return axios.get(`https://openlibrary.org${authorId}.json`);
      });

      const authorResponseArray = await Promise.all(authorPromiseArray);

      const bookAuthorsBirthDates = authorResponseArray.map(
        (authorResponse) => {
          return authorResponse.data.birth_date;
        }
      );

      setBooks((prev) => {
        const newState = bookEntries.map((book, index) => {
          return {
            id: book.work.key, // Add unique identifier for each book
            title: book.work.title,
            author_name: book.work.author_names[0] || "N/A",
            first_publish_year: book.work.first_publish_year || "N/A",
            subject: bookSubjects[index],
            author_birth_date: bookAuthorsBirthDates[index]
              ? bookAuthorsBirthDates[index]
              : "NA",
            ratings_average: bookRatings[index]
              ? Math.round(bookRatings[index] * 100) / 100
              : "NA",
            author_top_work: book.work.title ? book.work.title : "N/A",
          };
        });

        return newState;
      });
    } catch (error) {
      console.error("Error fetching book data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (searchAuthor === "") {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter((book) =>
        book.author_name.toLowerCase().includes(searchAuthor.toLowerCase())
      );
      setFilteredBooks(filtered);
    }
  }, [searchAuthor, books]);

  const data = React.useMemo(() => filteredBooks, [filteredBooks]);
  const columns = React.useMemo(
    () => [
      { Header: "Title", accessor: "title" },
      { Header: "Author Name", accessor: "author_name" },
      { Header: "First Publish Year", accessor: "first_publish_year" },
      { Header: "Subject", accessor: "subject" },
      { Header: "Ratings Average", accessor: "ratings_average" },
      { Header: "Author Birth Date", accessor: "author_birth_date" },
      { Header: "Author Top Work", accessor: "author_top_work" },
      {
        Header: "Actions",
        accessor: "id",
        Cell: ({ row }) => (
          <button
            className='text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"'
            onClick={() => handleEdit(row.original)}
          >
            Edit
          </button>
        ),
      },
    ],
    []
  );

  const handleEdit = (book) => {
    setEditingBook(book);
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedBooks = books.map((book) =>
      book.id === editingBook.id ? editingBook : book
    );
    setBooks(updatedBooks);
    setFilteredBooks(updatedBooks);
    setIsEditing(false);
    setEditingBook(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditingBook((prevBook) => ({
      ...prevBook,
      [name]: value,
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
    state: { pageIndex, pageSize: tablePageSize },
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

  const csvData = filteredBooks.map((book) => ({
    Title: book.title,
    "Author Name": book.author_name,
    "First Publish Year": book.first_publish_year,
    Subject: book.subject,
    "Ratings Average": book.ratings_average,
    "Author Birth Date": book.author_birth_date,
    "Author Top Work": book.author_top_work,
  }));

  return (
    <div>
      {loading ? (
        <div className="flex justify-center items-center">
          <div role="status">
            <svg
              aria-hidden="true"
              class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span class="sr-only">Loading...</span>
          </div>
          <div className="loader">
            Please wait while the data is being fetched...
          </div>
        </div>
      ) : (
        <>
          <div>
            <input
              type="text"
              className="items-center w-80 p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-100 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Search by author..."
              value={searchAuthor}
              onChange={(e) => setSearchAuthor(e.target.value)}
            />
          </div>
          {isEditing && (
            <div className="modal">
              <h2 className="text-xl p-2">Edit Book Form</h2>
              <label className="p-2">
                Title:
                <input
                  className="items-center w-50 p-4 ps-10 h-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-100 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  type="text"
                  name="title"
                  value={editingBook.title}
                  onChange={handleChange}
                />
              </label>
              <label className="p-2">
                Author Name:
                <input
                  type="text"
                  className="items-center w-50 p-4 ps-10 h-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-100 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  name="author_name"
                  value={editingBook.author_name}
                  onChange={handleChange}
                />
              </label>
              <label className="p-2">
                First Publish Year:
                <input
                  type="text"
                  className="items-center w-50 p-4 ps-10 h-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-100 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  name="first_publish_year"
                  value={editingBook.first_publish_year}
                  onChange={handleChange}
                />
              </label>
              <label className="p-2">
                Subject:
                <input
                  type="text"
                  className="items-center w-50 p-4 ps-10 h-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-100 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  name="subject"
                  value={editingBook.subject}
                  onChange={handleChange}
                />
              </label>
              <label className="p-2">
                Ratings Average:
                <input
                  type="text"
                  className="items-center w-50 p-4 ps-10 h-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-100 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  name="ratings_average"
                  value={editingBook.ratings_average}
                  onChange={handleChange}
                />
              </label>
              <label className="p-2">
                Author Birth Date:
                <input
                  type="text"
                  className="items-center w-50 p-4 ps-10 h-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-100 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  name="author_birth_date"
                  value={editingBook.author_birth_date}
                  onChange={handleChange}
                />
              </label>
              <label className="p-2">
                Author Top Work:
                <input
                  type="text"
                  className="items-center w-50 p-4 ps-10 h-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-100 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  name="author_top_work"
                  value={editingBook.author_top_work}
                  onChange={handleChange}
                />
              </label>
              <div className="p-2">
                <button
                  className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
                  onClick={handleSave}
                >
                  Save
                </button>
                <button
                  className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <table
            {...getTableProps()}
            style={{ width: "100%", border: "1px solid black" }}
          >
            <thead>
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                    >
                      {column.render("Header")}
                      <span>
                        {column.isSorted
                          ? column.isSortedDesc
                            ? " 🔽"
                            : " 🔼"
                          : ""}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {page.map((row) => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()}>
                    {row.cells.map((cell) => (
                      <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="p-4">
            <button
              className="px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
              onClick={() => gotoPage(0)}
              disabled={!canPreviousPage}
            >
              {"<<"}
            </button>{" "}
            <button
              className="px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
              onClick={() => previousPage()}
              disabled={!canPreviousPage}
            >
              {"<"}
            </button>{" "}
            <button
              className="px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
              onClick={() => nextPage()}
              disabled={!canNextPage}
            >
              {">"}
            </button>{" "}
            <button
              className="px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
              onClick={() => gotoPage(pageCount - 1)}
              disabled={!canNextPage}
            >
              {">>"}
            </button>{" "}
            <span>
              Page{" "}
              <strong>
                {pageIndex + 1} of {pageOptions.length}
              </strong>{" "}
            </span>
            <select
              className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
              value={tablePageSize}
              onChange={(e) => {
                setLocalPageSize(Number(e.target.value));
              }}
            >
              {[10, 20, 30, 40, 50, 100].map((size) => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
          </div>
          <div className="">
            <CSVLink
              className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
              data={csvData}
              filename="book_data.csv"
            >
              Download CSV
            </CSVLink>
          </div>
        </>
      )}
    </div>
  );
};

export default BookTable;
