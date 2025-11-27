// ============================================
// 1. STORE: modules/garage/GarageStore.js
// ============================================

const { defineStore } = Pinia;

const useGarageStore = defineStore('garage', {
    state: () => ({
        isOpen: false,
        vehicles: [],           // Spieler Fahrzeuge
        selectedVehicle: null,
        filter: 'all',          // 'all', 'owned', 'stored'
        isLoading: false
    }),

    getters: {
        filteredVehicles: (state) => {
            if (state.filter === 'all') return state.vehicles;
            if (state.filter === 'owned') return state.vehicles.filter(v => v.owned);
            if (state.filter === 'stored') return state.vehicles.filter(v => v.stored);
            return state.vehicles;
        },

        selectedVehicleData: (state) => {
            if (!state.selectedVehicle) return null;
            return state.vehicles.find(v => v.plate === state.selectedVehicle);
        }
    },

    actions: {
        open() {
            this.isOpen = true;
            this.loadVehicles();
        },

        close() {
            this.isOpen = false;
            this.selectedVehicle = null;
            this.filter = 'all';
        },

        async loadVehicles() {
            this.isLoading = true;
            try {
                const result = await window.NUIBridge.send('garage:getVehicles');
                this.vehicles = result.vehicles || [];
            } catch (error) {
                console.error('[GarageStore] Error loading vehicles:', error);
                // Fallback für Dev
                this.vehicles = [
                    { plate: 'ABC123', model: 'Adder', stored: true, fuel: 85, owned: true },
                    { plate: 'XYZ789', model: 'T20', stored: false, fuel: 60, owned: true }
                ];
            } finally {
                this.isLoading = false;
            }
        },

        selectVehicle(plate) {
            this.selectedVehicle = plate;
        },

        setFilter(filter) {
            this.filter = filter;
        },

        async spawnVehicle(plate) {
            try {
                await window.NUIBridge.send('garage:spawnVehicle', { plate });
                console.log(`[GarageStore] Spawned vehicle ${plate}`);
                this.close();
            } catch (error) {
                console.error('[GarageStore] Error spawning vehicle:', error);
            }
        },

        async storeVehicle(plate) {
            try {
                await window.NUIBridge.send('garage:storeVehicle', { plate });
                console.log(`[GarageStore] Stored vehicle ${plate}`);
                await this.loadVehicles();
            } catch (error) {
                console.error('[GarageStore] Error storing vehicle:', error);
            }
        }
    }
});