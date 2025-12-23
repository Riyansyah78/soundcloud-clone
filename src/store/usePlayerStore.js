import { create } from 'zustand'; 

const usePlayerStore = create((set, get) => ({
  ids: [],
  activeId: undefined,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  
  setId: (id) => set({ activeId: id }),
  setIds: (ids) => set({ ids: ids }),
  setIsPlaying: (state) => set({ isPlaying: state }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration: duration }),
  
 
  togglePlay: () => {
    const { isPlaying } = get(); 
    set({ isPlaying: !isPlaying });
  },

  reset: () => set({ ids: [], activeId: undefined, isPlaying: false })
}));

export default usePlayerStore;