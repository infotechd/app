// src/navigation/types.ts

// Importe User se precisar passar o objeto User como parâmetro (embora geralmente não recomendado)
// import { User } from '../types/user';

/**
 * Define os parâmetros esperados por cada tela no Root Stack Navigator.
 * 'undefined' significa que a tela não recebe parâmetros.
 * Adicione todas as telas definidas em AppNavigation.tsx e outras que possam existir.
 *
 * ATENÇÃO: Passar dados sensíveis como 'token' ou o objeto 'user' inteiro via
 * parâmetros de navegação não é a prática mais segura. É preferível buscar
 * essas informações do AuthContext dentro da própria tela protegida.
 * Considere refatorar as telas que atualmente esperam token/user via params.
 */
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Registration: undefined;
  ResetPassword?: undefined; // Tela opcional (?)
  Home:  undefined ;
  EditProfile: undefined;
  // Telas adicionais identificadas na sua estrutura src/screens/
  TreinamentoList: undefined;
  TreinamentoDetail: { treinamentoId: string };
  // Exemplo de refatoração: Em vez de passar token, a tela buscaria do context
  TreinamentoCreate: undefined; // { token: string };
  Relatorio: undefined; // { token: string };
  ProviderDashboard: undefined;
  OfferDetail: { offerId: string};
  ContratacaoDetalhe: { contratacaoId: string};
  Pagamento: { contratacaoId: string }; // { token: string; contratacaoId: string };
  OfertaServico: { offerId: string; mode: string }; // Parâmetros para visualização/edição de oferta
  Notificacao: undefined; // { token: string };
  Negociacao: { contratacaoId: string; providerId: string }; // { token: string; contratacaoId: string; providerId: string };
  // Exemplo de refatoração: Buscar user/token do context dentro da tela

  DeleteAccount: undefined; // { token: string };
  CurriculoForm: undefined; // { token: string };
  Contratacao: { ofertaId: string}; // { token: string };
  Community: undefined; // { token: string };
  Chat: { roomId: string }; // { token: string; roomId: string };
  BuyerDashboard: undefined;
  BuscarOfertas: undefined;
  Avaliacao: { receptorId : string; receptorNome?: string} // { token: string };
  Agenda: undefined; // { token: string };
  AdvertiserDashboard: undefined;
  AdDetail: { adId: string}; // Rota para detalhes do anúncio

  // Adicione outras rotas como OfferDetails, BookingDetails etc. se aplicável
};


// Exportar tipos de props para telas específicas pode ser feito aqui ou na própria tela
// Exemplo: export type LoginScreenNavProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
