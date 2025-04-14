import React from 'react';
import Header from '../components/Header';

/**
 * HomePage – Página Inicial do App Web.
 *
 * Esta página exibe um cabeçalho e uma mensagem de boas-vindas ao usuário.
 * Pode ser expandida para incluir mais componentes e funcionalidades conforme necessário.
 */
export default function HomePage() {
  return (
    <div style={{ padding: '20px' }}>
      {/* Componente Header: pode conter logo, menu de navegação, etc. */}
      <Header />
      <h2>Bem-vindo ao App Web!</h2>
    </div>
  );
}
