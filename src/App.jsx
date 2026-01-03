import { useState, useEffect } from 'react'
import './index.css'
import AddItem from './components/AddItem'
import ProductList from './components/ProductList'
import { subscribeToCustomEmojis } from './services/firestore'
import { setCustomEmojiMap } from './utils/emoji'

function App() {
  useEffect(() => {
    // Load custom emoji preferences
    const unsubscribe = subscribeToCustomEmojis((map) => {
      setCustomEmojiMap(map);
    });
    return () => unsubscribe();
  }, []);

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
