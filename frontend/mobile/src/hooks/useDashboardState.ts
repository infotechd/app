import { useReducer, useCallback } from 'react';
import { UserRole } from '@/types/user';

// Definição dos tipos para o estado do dashboard
export interface DashboardStats {
  buyer: {
    contratacoesPendentes: number;
    contratacoesConcluidas: number;
    avaliacoesRecebidas: number;
  };
  provider: {
    ofertasAtivas: number;
    solicitacoesPendentes: number;
    avaliacaoMedia: number;
  };
  advertiser: {
    treinamentosAtivos: number;
    visualizacoesTotais: number;
    inscricoesTotais: number;
  };
}

// Estado inicial do dashboard
export interface DashboardState {
  activeRole: UserRole | null;
  isLoading: boolean;
  stats: DashboardStats;
}

// Tipos de ações para o reducer
export type DashboardAction =
  | { type: 'SET_ACTIVE_ROLE'; payload: UserRole | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_BUYER_STATS'; payload: Partial<DashboardStats['buyer']> }
  | { type: 'UPDATE_PROVIDER_STATS'; payload: Partial<DashboardStats['provider']> }
  | { type: 'UPDATE_ADVERTISER_STATS'; payload: Partial<DashboardStats['advertiser']> }
  | { type: 'RESET_STATS' };

// Estado inicial padrão
const initialState: DashboardState = {
  activeRole: null,
  isLoading: true,
  stats: {
    buyer: {
      contratacoesPendentes: 0,
      contratacoesConcluidas: 0,
      avaliacoesRecebidas: 0,
    },
    provider: {
      ofertasAtivas: 0,
      solicitacoesPendentes: 0,
      avaliacaoMedia: 0,
    },
    advertiser: {
      treinamentosAtivos: 0,
      visualizacoesTotais: 0,
      inscricoesTotais: 0,
    },
  },
};

// Reducer para gerenciar o estado do dashboard
function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_ACTIVE_ROLE':
      return { ...state, activeRole: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'UPDATE_BUYER_STATS':
      return {
        ...state,
        stats: {
          ...state.stats,
          buyer: { ...state.stats.buyer, ...action.payload },
        },
      };
    
    case 'UPDATE_PROVIDER_STATS':
      return {
        ...state,
        stats: {
          ...state.stats,
          provider: { ...state.stats.provider, ...action.payload },
        },
      };
    
    case 'UPDATE_ADVERTISER_STATS':
      return {
        ...state,
        stats: {
          ...state.stats,
          advertiser: { ...state.stats.advertiser, ...action.payload },
        },
      };
    
    case 'RESET_STATS':
      return { ...state, stats: initialState.stats };
    
    default:
      return state;
  }
}

/**
 * Custom hook para gerenciar o estado do dashboard
 * Usa useReducer para consolidar múltiplos estados relacionados
 * 
 * @param customInitialState - Estado inicial personalizado (opcional)
 * @returns Estado atual e funções para atualizar o estado
 */
export function useDashboardState(customInitialState?: Partial<DashboardState>) {
  // Mesclar o estado inicial padrão com o personalizado, se fornecido
  const mergedInitialState = customInitialState 
    ? { ...initialState, ...customInitialState }
    : initialState;
  
  const [state, dispatch] = useReducer(dashboardReducer, mergedInitialState);

  // Funções memoizadas para atualizar o estado
  const setActiveRole = useCallback((role: UserRole | null) => {
    dispatch({ type: 'SET_ACTIVE_ROLE', payload: role });
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: isLoading });
  }, []);

  const updateBuyerStats = useCallback((stats: Partial<DashboardStats['buyer']>) => {
    dispatch({ type: 'UPDATE_BUYER_STATS', payload: stats });
  }, []);

  const updateProviderStats = useCallback((stats: Partial<DashboardStats['provider']>) => {
    dispatch({ type: 'UPDATE_PROVIDER_STATS', payload: stats });
  }, []);

  const updateAdvertiserStats = useCallback((stats: Partial<DashboardStats['advertiser']>) => {
    dispatch({ type: 'UPDATE_ADVERTISER_STATS', payload: stats });
  }, []);

  const resetStats = useCallback(() => {
    dispatch({ type: 'RESET_STATS' });
  }, []);

  // Retornar o estado atual e as funções para atualizá-lo
  return {
    state,
    setActiveRole,
    setLoading,
    updateBuyerStats,
    updateProviderStats,
    updateAdvertiserStats,
    resetStats,
  };
}