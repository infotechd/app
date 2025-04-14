import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header style={{ padding: '10px', backgroundColor: '#eee' }}>
      <nav>
        <Link to="/">Home</Link> | <Link to="/login">Login</Link> | <Link to="/register">Cadastro</Link>
      </nav>
    </header>
  );
}
