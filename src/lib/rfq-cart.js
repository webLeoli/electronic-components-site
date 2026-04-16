'use client';

/**
 * RFQ Cart — Global state manager using React Context + localStorage
 * 
 * Allows users to add parts to a persistent "inquiry cart" from any page,
 * then view/edit/submit them all at once on the /rfq page.
 * 
 * Each cart item: { partNumber, manufacturer, qty, targetPrice, addedAt }
 */

import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'fpgacenter_rfq_cart';
const MAX_ITEMS = 50; // Safety: prevent abuse

// Actions
const ACTIONS = {
  INIT: 'INIT',
  ADD: 'ADD',
  REMOVE: 'REMOVE',
  UPDATE: 'UPDATE',
  CLEAR: 'CLEAR',
  IMPORT_BULK: 'IMPORT_BULK',
};

function cartReducer(state, action) {
  switch (action.type) {
    case ACTIONS.INIT:
      return { ...state, items: action.payload, initialized: true };

    case ACTIONS.ADD: {
      const { partNumber, manufacturer = '', qty = 1, targetPrice = '' } = action.payload;
      if (!partNumber) return state;
      
      // Check if already in cart
      const exists = state.items.findIndex(
        item => item.partNumber.toUpperCase() === partNumber.toUpperCase()
      );
      
      let newItems;
      if (exists >= 0) {
        // Update existing: add quantity
        newItems = [...state.items];
        const existing = newItems[exists];
        newItems[exists] = {
          ...existing,
          qty: Math.max(1, (parseInt(existing.qty) || 0) + (parseInt(qty) || 1)),
          manufacturer: manufacturer || existing.manufacturer,
          targetPrice: targetPrice || existing.targetPrice,
        };
      } else {
        if (state.items.length >= MAX_ITEMS) return state; // Cap
        newItems = [...state.items, {
          partNumber: partNumber.trim(),
          manufacturer: manufacturer.trim(),
          qty: parseInt(qty) || 1,
          targetPrice: targetPrice ? String(targetPrice) : '',
          addedAt: Date.now(),
        }];
      }
      return { ...state, items: newItems };
    }

    case ACTIONS.REMOVE: {
      return {
        ...state,
        items: state.items.filter((_, i) => i !== action.payload),
      };
    }

    case ACTIONS.UPDATE: {
      const { index, field, value } = action.payload;
      const newItems = [...state.items];
      if (newItems[index]) {
        newItems[index] = { ...newItems[index], [field]: value };
      }
      return { ...state, items: newItems };
    }

    case ACTIONS.CLEAR:
      return { ...state, items: [] };

    case ACTIONS.IMPORT_BULK: {
      // Import array of items (e.g., from BOM paste)
      const bulkItems = action.payload.slice(0, MAX_ITEMS).map(item => ({
        partNumber: (item.partNumber || '').trim(),
        manufacturer: (item.manufacturer || '').trim(),
        qty: parseInt(item.qty) || 1,
        targetPrice: item.targetPrice ? String(item.targetPrice) : '',
        addedAt: Date.now(),
      })).filter(item => item.partNumber);
      return { ...state, items: bulkItems };
    }

    default:
      return state;
  }
}

const RfqCartContext = createContext(null);

export function RfqCartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], initialized: false });
  const isFirstRender = useRef(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          dispatch({ type: ACTIONS.INIT, payload: parsed });
          return;
        }
      }
    } catch (e) {
      // Corrupted data — reset
      localStorage.removeItem(STORAGE_KEY);
    }
    dispatch({ type: ACTIONS.INIT, payload: [] });
  }, []);

  // Persist to localStorage on changes (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (state.initialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
      } catch (e) {
        // localStorage full — silent fail
      }
    }
  }, [state.items, state.initialized]);

  // Memoized actions
  const addItem = useCallback((partNumber, manufacturer, qty, targetPrice) => {
    dispatch({ type: ACTIONS.ADD, payload: { partNumber, manufacturer, qty, targetPrice } });
  }, []);

  const removeItem = useCallback((index) => {
    dispatch({ type: ACTIONS.REMOVE, payload: index });
  }, []);

  const updateItem = useCallback((index, field, value) => {
    dispatch({ type: ACTIONS.UPDATE, payload: { index, field, value } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR });
  }, []);

  const importBulk = useCallback((items) => {
    dispatch({ type: ACTIONS.IMPORT_BULK, payload: items });
  }, []);

  const value = {
    items: state.items,
    count: state.items.length,
    initialized: state.initialized,
    addItem,
    removeItem,
    updateItem,
    clearCart,
    importBulk,
  };

  return (
    <RfqCartContext.Provider value={value}>
      {children}
    </RfqCartContext.Provider>
  );
}

export function useRfqCart() {
  const ctx = useContext(RfqCartContext);
  if (!ctx) throw new Error('useRfqCart must be used within RfqCartProvider');
  return ctx;
}
