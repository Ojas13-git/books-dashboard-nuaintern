
import './App.css';
// import BookTable from './components/BookTable';

function App() {
  return (
    
    <div className="App">
      <h1 className='text-3xl font-bold p-6'>Sign In to access the Books Dashboard</h1>
      <a className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800" href="/sign-in">SignIn</a>
        {/* <h1>Open Library Dashboard</h1>
      <main>
        <BookTable />
      </main> */}
    </div>
  );
}

export default App;
