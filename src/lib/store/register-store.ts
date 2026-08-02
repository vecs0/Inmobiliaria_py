import { create } from 'zustand';

export type AccountType = 'buyer' | 'particular' | 'empresa';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  cedula: string;
  companyName: string;
  ruc: string;
  hasWebsite: boolean;
  websiteUrl: string;
}

interface RegisterStore {
  step: 1 | 2 | 3 | 4;
  accountType: AccountType | null;
  supabaseUserId: string | null;
  formData: FormData;
  direction: number;
  actions: {
    nextStep: () => void;
    prevStep: () => void;
    setStep: (step: 1 | 2 | 3 | 4) => void;
    setAccountType: (type: AccountType) => void;
    setSupabaseUserId: (id: string) => void;
    setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
    reset: () => void;
  };
}

const initialFormData: FormData = {
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  phone: '',
  cedula: '',
  companyName: '',
  ruc: '',
  hasWebsite: false,
  websiteUrl: '',
};

const STORAGE_KEY = 'inmobiliariapy_register_state';

function loadFromSessionStorage(): Partial<Pick<RegisterStore, 'step' | 'accountType' | 'formData' | 'supabaseUserId'>> | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        step: parsed.step,
        accountType: parsed.accountType,
        formData: { ...initialFormData, ...parsed.formData },
        supabaseUserId: parsed.supabaseUserId,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

function saveToSessionStorage(state: Pick<RegisterStore, 'step' | 'accountType' | 'formData' | 'supabaseUserId'>) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      step: state.step,
      accountType: state.accountType,
      formData: state.formData,
      supabaseUserId: state.supabaseUserId,
    }));
  } catch {
    // ignore
  }
}

export const useRegisterStore = create<RegisterStore>((set, get) => ({
  step: 1,
  accountType: null,
  supabaseUserId: null,
  formData: initialFormData,
  direction: 1,

  actions: {
    nextStep: () => {
      const current = get().step;
      if (current < 4) {
        set((state) => {
          const next = { ...state, step: (current + 1) as 1 | 2 | 3 | 4, direction: 1 };
          saveToSessionStorage(next);
          return next;
        });
      }
    },

    prevStep: () => {
      const current = get().step;
      if (current > 1) {
        set((state) => {
          const prev = { ...state, step: (current - 1) as 1 | 2 | 3 | 4, direction: -1 };
          saveToSessionStorage(prev);
          return prev;
        });
      }
    },

    setStep: (step) => {
      set((state) => {
        const updated = { ...state, step };
        saveToSessionStorage(updated);
        return updated;
      });
    },

    setAccountType: (accountType) => {
      set((state) => {
        const updated = { ...state, accountType };
        saveToSessionStorage(updated);
        return updated;
      });
    },

    setSupabaseUserId: (supabaseUserId) => {
      set((state) => {
        const updated = { ...state, supabaseUserId };
        saveToSessionStorage(updated);
        return updated;
      });
    },

    setField: (key, value) => {
      set((state) => {
        const updated = { ...state, formData: { ...state.formData, [key]: value } };
        saveToSessionStorage(updated);
        return updated;
      });
    },

    reset: () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(STORAGE_KEY);
      }
      set({ step: 1, accountType: null, supabaseUserId: null, formData: initialFormData, direction: 1 });
    },
  },
}));

export function initStoreFromSession() {
  const stored = loadFromSessionStorage();
  if (stored) {
    useRegisterStore.setState(stored);
  }
}
