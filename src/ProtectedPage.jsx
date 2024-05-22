import { UserButton } from '@clerk/clerk-react'
import React from 'react'
import BookTable from './components/BookTable'
import './App.css';


const ProtectedPage = () => {
  return (
    <div className='App'>
        <UserButton/>
        <h1 className='p-2 text-3xl font-medium'>Open Library Dashboard</h1>
      <main>
        <BookTable />
      </main>
    </div>
    
    
  )
}

export default ProtectedPage