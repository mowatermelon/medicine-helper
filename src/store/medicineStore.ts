import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Medicine } from '@/types/medicine';

interface MedicineState {
  medicines: Medicine[];
  addMedicine: (med: Medicine) => void;
  updateMedicine: (id: number, med: Medicine) => void;
  deleteMedicine: (id: number) => void;
}

export const useMedicineStore = create<MedicineState>()(
  persist(
    (set) => ({
      medicines: [],
      addMedicine: (med: Medicine) => {
        set((state) => ({
          medicines: [...state.medicines, med]
        }));
        localStorage.setItem('medicine-storage', JSON.stringify({ state: { medicines: [...useMedicineStore.getState().medicines, med] } }));
      },
      updateMedicine: (id: number, med: Medicine) => {
        set((state) => ({
          medicines: state.medicines.map(m =>
            m.id === id ? { ...med, id } : m
          )
        }));
      },
      deleteMedicine: (id: number) => {
        set((state) => ({
          medicines: state.medicines.filter(m => m.id !== id)
        }));
      },
    }),
    {
      name: 'medicine-storage',
      // storage: localStorage,
    }
  ));