
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useTable, useSortBy, usePagination } from 'react-table';

// const BookTable = () => {
//   const [books, setBooks] = useState([]);
//   const [pageSize, setLocalPageSize] = useState(10);

//   const fetchBooks = async () => {
//     try {
//       const response = await axios.get('https://openlibrary.org/subjects/music.json?limit=100');
//       const works = response.data.works.map(work => ({
//         title: work.title,
//         author_name: work.authors[0]?.name || 'N/A',
//         first_publish_year: work.first_publish_year || 'N/A',
//         subject: work.subject || 'N/A',
//         ratings_average: work.rating || 'N/A',  // Assuming there is a rating field
//         author_birth_date: work.authors[0]?.birth_date || 'N/A',  // Assuming this field exists
//         author_top_work: work.authors[0]?.top_work || 'N/A'  // Assuming this field exists
//       }));
//       setBooks(works);
//     } catch (error) {
//       console.error('Error fetching book data:', error);
//     }
//   };

//   useEffect(() => {
//     fetchBooks();
//   }, []);

//   const data = React.useMemo(() => books, [books]);
//   const columns = React.useMemo(() => [
//     { Header: 'Title', accessor: 'title' },
//     { Header: 'Author Name', accessor: 'author_name' },
//     { Header: 'First Publish Year', accessor: 'first_publish_year' },
//     { Header: 'Subject', accessor: 'subject' },
//     { Header: 'Ratings Average', accessor: 'ratings_average' },
//     { Header: 'Author Birth Date', accessor: 'author_birth_date' },
//     { Header: 'Author Top Work', accessor: 'author_top_work' }
//   ], []);

//   const {
//     getTableProps,
//     getTableBodyProps,
//     headerGroups,
//     page,
//     prepareRow,
//     canPreviousPage,
//     canNextPage,
//     pageOptions,
//     pageCount,
//     gotoPage,
//     nextPage,
//     previousPage,
//     setPageSize: setTablePageSize,
//     state: { pageIndex, pageSize: tablePageSize }
//   } = useTable(
//     {
//       columns,
//       data,
//       initialState: { pageIndex: 0, pageSize: pageSize },
//     },
//     useSortBy,
//     usePagination
//   );

//   useEffect(() => {
//     setTablePageSize(pageSize);
//   }, [pageSize, setTablePageSize]);

//   return (
//     <div>
//       <table {...getTableProps()} style={{ width: '100%', border: '1px solid black' }}>
//         <thead>
//           {headerGroups.map(headerGroup => (
//             <tr {...headerGroup.getHeaderGroupProps()}>
//               {headerGroup.headers.map(column => (
//                 <th {...column.getHeaderProps(column.getSortByToggleProps())}>
//                   {column.render('Header')}
//                   <span>
//                     {column.isSorted
//                       ? column.isSortedDesc
//                         ? ' 🔽'
//                         : ' 🔼'
//                       : ''}
//                   </span>
//                 </th>
//               ))}
//             </tr>
//           ))}
//         </thead>
//         <tbody {...getTableBodyProps()}>
//           {page.map(row => {
//             prepareRow(row);
//             return (
//               <tr {...row.getRowProps()}>
//                 {row.cells.map(cell => (
//                   <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
//                 ))}
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//       <div>
//         <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
//           {'<<'}
//         </button>{' '}
//         <button onClick={() => previousPage()} disabled={!canPreviousPage}>
//           {'<'}
//         </button>{' '}
//         <button onClick={() => nextPage()} disabled={!canNextPage}>
//           {'>'}
//         </button>{' '}
//         <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
//           {'>>'}
//         </button>{' '}
//         <span>
//           Page{' '}
//           <strong>
//             {pageIndex + 1} of {pageOptions.length}
//           </strong>{' '}
//         </span>
//         <select
//           value={tablePageSize}
//           onChange={e => {
//             setLocalPageSize(Number(e.target.value));
//           }}
//         >
//           {[10, 20, 30, 40, 50, 100].map(size => (
//             <option key={size} value={size}>
//               Show {size}
//             </option>
//           ))}
//         </select>
//       </div>
//     </div>
//   );
// };

// export default BookTable;



import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTable, useSortBy, usePagination } from 'react-table';
import { CSVLink } from 'react-csv';

const BookTable = () => {
  const [books, setBooks] = useState([]);
  const [pageSize, setLocalPageSize] = useState(10);
  const [searchAuthor, setSearchAuthor] = useState('');
  const [filteredBooks, setFilteredBooks] = useState([]);

  const fetchBooks = async () => {
    try {
      const response = await axios.get('https://openlibrary.org/subjects/science_fiction.json?limit=100');
      // console.log(response.data.reading_log_entries);
      const works = response.data.works.map(work => ({
        id: work.key, // Add unique identifier for each book
        title: work.title,
        author_name: work.authors[0]?.name || 'N/A',
        first_publish_year: work.first_publish_year || 'N/A',
        subject: work.subject || 'N/A',
        ratings_average: work.rating || 'N/A',
        author_birth_date: work.authors[0]?.birth_date || 'N/A',
        author_top_work: work.authors[0]?.top_work || 'N/A'
      }));
      setBooks(works);
      setFilteredBooks(works);
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
    // Implement your edit logic here
    console.log('Editing book:', book);
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
