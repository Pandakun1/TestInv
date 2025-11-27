/**
 * App Store - Globaler Application State
 * 
 * Verwaltet übergreifende Informationen wie:
 * - Aktuelle UI-Sichtbarkeit
 * - Player-Daten
 * - Globale Settings
 */

const { defineStore } = Pinia;

const useAppStore = defineStore('app', {
    state: () => ({
        // UI State
        currentModule: null,
        isAnyModuleOpen: false,
        
        // Player Data
        player: {
            id: 0,
            name: '',
            health: 100,
            armor: 0,
            hunger: 100,
            thirst: 100,
            cash: 0,
            bank: 0
        },

        // Settings
        settings: {
            language: 'de',
            soundEnabled: true,
            notificationsEnabled: true
        }
    }),

    getters: {
        /**
         * Ist irgendein Modul gerade offen?
         */
        hasActiveModule: (state) => state.currentModule !== null,

        /**
         * Player Health Prozent
         */
        healthPercent: (state) => Math.max(0, Math.min(100, state.player.health)),

        /**
         * Player Armor Prozent
         */
        armorPercent: (state) => Math.max(0, Math.min(100, state.player.armor))
    },

    actions: {
        /**
         * Setze aktuelles aktives Modul
         */
        setCurrentModule(moduleName) {
            this.currentModule = moduleName;
            this.isAnyModuleOpen = moduleName !== null;
            console.log(`[AppStore] Current module: ${moduleName}`);
        },

        /**
         * Update Player-Daten
         */
        updatePlayer(data) {
            this.player = { ...this.player, ...data };
            console.log('[AppStore] Player data updated', this.player);
        },

        /**
         * Update Health
         */
        setHealth(value) {
            this.player.health = Math.max(0, Math.min(100, value));
        },

        /**
         * Update Armor
         */
        setArmor(value) {
            this.player.armor = Math.max(0, Math.min(100, value));
        },

        /**
         * Update Hunger
         */
        setHunger(value) {
            this.player.hunger = Math.max(0, Math.min(100, value));
        },

        /**
         * Update Thirst
         */
        setThirst(value) {
            this.player.thirst = Math.max(0, Math.min(100, value));
        },

        /**
         * Update Cash & Bank
         */
        setMoney(cash, bank) {
            this.player.cash = cash || 0;
            this.player.bank = bank || 0;
        },

        /**
         * Reset alle Daten
         */
        reset() {
            this.currentModule = null;
            this.isAnyModuleOpen = false;
            this.player = {
                id: 0,
                name: '',
                health: 100,
                armor: 0,
                hunger: 100,
                thirst: 100,
                cash: 0,
                bank: 0
            };
        }
    }
});