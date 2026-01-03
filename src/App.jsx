import { useState } from 'react'
import './index.css'
import AddItem from './components/AddItem'
import ProductList from './components/ProductList'

function App() {
  return (
    <main>
      <div className="container">
        <header style={{ marginBottom: 'var(--spacing-xl)', paddingTop: 'var(--spacing-lg)' }}>
          <h1 className="title">Groceries</h1>
          <p className="subtitle">Your mobile shopping list</p>
        </header>
        
        <AddItem />
        <ProductList />
        
      </div>
    </main>
  )
}

export default App
