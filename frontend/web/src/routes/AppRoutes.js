// Importa React e os componentes necessários do React Router
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importa as páginas de acordo com os casos de uso do App
// - OnboardingPage: página inicial para novos usuários (walkthrough)
// - LoginPage: página de login
// - RegisterPage: página de cadastro de usuário
// - ResetPasswordPage: página para recuperação de senha
// - HomePage: área privada do app, acessível após autenticação
import OnboardingPage from '../pages/OnboardingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import HomePage from '../pages/HomePage';

// Importa um componente de rota privada que verifica se o usuário está autenticado
// Esse componente encapsula a lógica de proteção das rotas privadas (exemplo: verifica token armazenado)
import PrivateRoute from '../components/PrivateRoute';

/**
 * Componente principal de rotas do app web.
 * Define as rotas públicas (onboarding, login, cadastro, reset de senha) e
 * as rotas privadas (Home, Dashboard, etc.), utilizando o componente PrivateRoute.
 */
function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Rota de Onboarding: página introdutória para novos usuários */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Rotas públicas: acessíveis sem autenticação */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Rota privada: envolve a Home dentro de um componente que protege a rota */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
