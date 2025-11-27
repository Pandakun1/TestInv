/**
 * Admin Store - Verwaltung des Admin-Panel States
 */

const { defineStore } = Pinia;

const useAdminStore = defineStore('admin', {
    state: () => ({
        isOpen: false,
        
        // Current State
        selectedCategory: 'players',
        selectedPlayer: null,
        
        // Data
        players: [],
        vehicles: [],
        items: [],
        
        // Categories
        categories: [
            { id: 'players', label: 'Spieler', icon: '👥' },
            { id: 'teleport', label: 'Teleport', icon: '📍' },
            { id: 'vehicles', label: 'Fahrzeuge', icon: '🚗' },
            { id: 'items', label: 'Items', icon: '📦' },
            { id: 'weather', label: 'Wetter', icon: '🌤️' },
            { id: 'time', label: 'Zeit', icon: '⏰' },
            { id: 'noclip', label: 'Noclip', icon: '✈️' },
            { id: 'settings', label: 'Einstellungen', icon: '⚙️' }
        ],
        
        // Settings
        noclipEnabled: false,
        godmodeEnabled: false,
        invisibleEnabled: false
    }),

    getters: {
        /**
         * Aktuelle Kategorie
         */
        currentCategory: (state) => {
            return state.categories.find(c => c.id === state.selectedCategory);
        },

        /**
         * Online Spieler Count
         */
        onlinePlayersCount: (state) => {
            return state.players.length;
        }
    },

    actions: {
        /**
         * Öffne Admin Panel
         */
        open() {
            this.isOpen = true;
            this.loadPlayers();
            console.log('[AdminStore] Admin panel opened');
        },

        /**
         * Schließe Admin Panel
         */
        close() {
            this.isOpen = false;
            this.selectedPlayer = null;
            console.log('[AdminStore] Admin panel closed');
        },

        /**
         * Wähle Kategorie
         */
        selectCategory(categoryId) {
            this.selectedCategory = categoryId;
            console.log(`[AdminStore] Category selected: ${categoryId}`);
            
            // Lade Daten für Kategorie
            switch (categoryId) {
                case 'players':
                    this.loadPlayers();
                    break;
                case 'vehicles':
                    this.loadVehicles();
                    break;
                case 'items':
                    this.loadItems();
                    break;
            }
        },

        /**
         * Wähle Spieler
         */
        selectPlayer(player) {
            this.selectedPlayer = player;
            console.log('[AdminStore] Player selected:', player);
        },

        /**
         * Lade Spieler-Liste
         */
        async loadPlayers() {
            try {
                const result = await window.NUIBridge.send('admin:getPlayers');
                if (result && result.players) {
                    this.players = result.players;
                }
            } catch (error) {
                console.error('[AdminStore] Error loading players:', error);
                // Fallback für Development
                this.players = [
                    { id: 1, name: 'Spieler 1', steamid: 'steam:123' },
                    { id: 2, name: 'Spieler 2', steamid: 'steam:456' }
                ];
            }
        },

        /**
         * Lade Fahrzeug-Liste
         */
        async loadVehicles() {
            try {
                const result = await window.NUIBridge.send('admin:getVehicles');
                if (result && result.vehicles) {
                    this.vehicles = result.vehicles;
                }
            } catch (error) {
                console.error('[AdminStore] Error loading vehicles:', error);
            }
        },

        /**
         * Lade Item-Liste
         */
        async loadItems() {
            try {
                const result = await window.NUIBridge.send('admin:getItems');
                if (result && result.items) {
                    this.items = result.items;
                }
            } catch (error) {
                console.error('[AdminStore] Error loading items:', error);
            }
        },

        /**
         * Admin Actions
         */
        async teleportToPlayer(playerId) {
            try {
                await window.NUIBridge.send('admin:teleportToPlayer', { playerId });
                console.log(`[AdminStore] Teleported to player ${playerId}`);
            } catch (error) {
                console.error('[AdminStore] Error teleporting:', error);
            }
        },

        async healPlayer(playerId) {
            try {
                await window.NUIBridge.send('admin:healPlayer', { playerId });
                console.log(`[AdminStore] Healed player ${playerId}`);
            } catch (error) {
                console.error('[AdminStore] Error healing player:', error);
            }
        },

        async kickPlayer(playerId, reason) {
            try {
                await window.NUIBridge.send('admin:kickPlayer', { playerId, reason });
                console.log(`[AdminStore] Kicked player ${playerId}`);
                await this.loadPlayers();
            } catch (error) {
                console.error('[AdminStore] Error kicking player:', error);
            }
        },

        async spawnVehicle(model) {
            try {
                await window.NUIBridge.send('admin:spawnVehicle', { model });
                console.log(`[AdminStore] Spawned vehicle ${model}`);
            } catch (error) {
                console.error('[AdminStore] Error spawning vehicle:', error);
            }
        },

        async giveItem(playerId, itemName, amount) {
            try {
                await window.NUIBridge.send('admin:giveItem', { 
                    playerId, 
                    itemName, 
                    amount 
                });
                console.log(`[AdminStore] Gave ${amount}x ${itemName} to player ${playerId}`);
            } catch (error) {
                console.error('[AdminStore] Error giving item:', error);
            }
        },

        /**
         * Toggle Noclip
         */
        async toggleNoclip() {
            this.noclipEnabled = !this.noclipEnabled;
            try {
                await window.NUIBridge.send('admin:toggleNoclip', { 
                    enabled: this.noclipEnabled 
                });
            } catch (error) {
                console.error('[AdminStore] Error toggling noclip:', error);
            }
        },

        /**
         * Toggle Godmode
         */
        async toggleGodmode() {
            this.godmodeEnabled = !this.godmodeEnabled;
            try {
                await window.NUIBridge.send('admin:toggleGodmode', { 
                    enabled: this.godmodeEnabled 
                });
            } catch (error) {
                console.error('[AdminStore] Error toggling godmode:', error);
            }
        }
    }
});