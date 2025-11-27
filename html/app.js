/**
 * Main App - Vue Application Initialisierung & Modul-Registrierung
 */

const { createApp } = Vue;
const { createPinia } = Pinia;

// Root App Component
const App = {
    name: 'App',
    
    setup() {
        const appStore = useAppStore();
        const inventoryStore = useInventoryStore();
        const adminStore = useAdminStore();

        // Track aktives Modul
        window.addEventListener('ui:moduleOpened', (e) => {
            appStore.setCurrentModule(e.detail.name);
        });

        window.addEventListener('ui:moduleClosed', (e) => {
            if (appStore.currentModule === e.detail.name) {
                appStore.setCurrentModule(null);
            }
        });

        return {
            inventoryStore,
            adminStore
        };
    },

    template: `
        <div id="nui-container">
            <!-- Inventory Module -->
            <InventoryModule />
            
            <!-- Admin Module -->
            <AdminModule />
        </div>
    `
};

// Initialize Vue App
const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

// Register Components
app.component('InventoryModule', InventoryModule);
app.component('AdminModule', AdminModule);
app.component('GarageModule', GarageModule);

// Mount App
app.mount('#app');

console.log('[FW Core] Vue App initialized');

// ========================================
// Module Registration
// ========================================

// Register Inventory Module
window.UIManager.register({
    name: 'inventory',
    component: InventoryModule,
    store: useInventoryStore,
    exclusive: false, // Kann mit anderen Modulen offen sein
    actions: ['openInventory'],
    onOpen: (data) => {
        const store = useInventoryStore();
        store.open();
        
        // Lade Inventar-Daten wenn vorhanden
        if (data && data.inventory) {
            store.loadInventoryData(data);
        }
        
        // Update Player Stats
        if (data) {
            const appStore = useAppStore();
            appStore.updatePlayer({
                health: data.health || 100,
                armor: data.armor || 0,
                hunger: data.hunger || 100,
                thirst: data.thirst || 100,
                cash: data.cash || 0,
                bank: data.bank || 0
            });
        }
    },
    onClose: () => {
        const store = useInventoryStore();
        store.close();
    }
});

// Register Admin Module
window.UIManager.register({
    name: 'admin',
    component: AdminModule,
    store: useAdminStore,
    exclusive: true, // Schließt andere Module
    actions: ['openAdmin'],
    onOpen: (data) => {
        const store = useAdminStore();
        store.open();
    },
    onClose: () => {
        const store = useAdminStore();
        store.close();
    }
});

window.UIManager.register({
    name: 'garage',
    component: GarageModule,
    store: useGarageStore,
    exclusive: true,
    actions: ['openGarage'],
    onOpen: (data) => {
        const store = useGarageStore();
        store.open();
    },
    onClose: () => {
        const store = useGarageStore();
        store.close();
    }
});

console.log('[FW Core] UI Modules registered:', Array.from(window.UIManager.getModules().keys()));

// ========================================
// NUI Event Handlers
// ========================================

// Listen for focus changes from Lua
window.NUIBridge.on('setFocus', (data) => {
    // This is handled by focusManager internally
});

// Listen for inventory updates
window.NUIBridge.on('updateInventory', (data) => {
    const store = useInventoryStore();
    if (data.inventory) {
        store.loadInventoryData(data.inventory);
    }
});

// Listen for inventory refresh (after item move/use)
window.NUIBridge.on('fw:inventory:refresh', (data) => {
    const store = useInventoryStore();
    store.loadInventoryData(data);
});

// Listen for player stat updates
window.NUIBridge.on('updatePlayerStats', (data) => {
    const appStore = useAppStore();
    appStore.updatePlayer(data);
});

// Development Mode Helpers
if (!window.GetParentResourceName) {
    console.log('[FW Core] Running in DEVELOPMENT mode');
    console.log('[FW Core] Use these commands in console:');
    console.log('  openInventory() - Open inventory');
    console.log('  openAdmin() - Open admin panel');
    console.log('  closeAll() - Close all modules');
    
    // Global dev helpers
    window.openInventory = () => {
        window.NUIBridge.trigger('openInventory', {
            inventory: {
                main: [
                    { slot: 0, name: 'water', label: 'Wasser', amount: 5, weight: 0.5 },
                    { slot: 1, name: 'bread', label: 'Brot', amount: 3, weight: 0.2 },
                    { slot: 5, name: 'phone', label: 'Handy', amount: 1, weight: 0.3 }
                ],
                maxWeight: 50,
                groundItems: []
            },
            health: 85,
            armor: 50,
            hunger: 75,
            thirst: 60,
            cash: 1500,
            bank: 25000
        });
    };
    
    window.openAdmin = () => {
        window.NUIBridge.trigger('openAdmin', {});
    };
    
    window.closeAll = () => {
        window.UIManager.closeAll();
    };
}

// Ready Event
window.dispatchEvent(new Event('nui:ready'));
console.log('[FW Core] NUI System ready!');