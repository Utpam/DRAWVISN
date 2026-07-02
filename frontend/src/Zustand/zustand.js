import {create} from 'zustand';

// Storing Auth State in Zustand    
const useAuthStore = create((set) => ({
    authStatus: false,
    userData: null,
    login: (userData) => set(() => ({authStatus: true, userData:userData})),
    logout: () => set(() => ({authStatus: false, userData:null})),
}))

