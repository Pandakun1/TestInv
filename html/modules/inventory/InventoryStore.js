/**
 * Inventory Store - Verwaltung des Inventar-States
 */

const { defineStore } = Pinia;

const useInventoryStore = defineStore('inventory', {
    state: () => ({
        // Inventory Data
        items: [],           // Array of items: { slot, name, label, amount, weight, image }
        maxWeight: 50,
        currentWeight: 0,
        maxSlots: 20,        // 5x4 Grid
        
        // Ground Items (nearby)
        groundItems: [],
        
        // UI State
        isOpen: false,
        selectedSlot: null,
        contextMenu: {
            visible: false,
            x: 0,
            y: 0,
            item: null
        },
        
        // Drag & Drop State
        draggedItem: null,
        dragSourceSlot: null
    }),

    getters: {
        /**
         * Get Item by Slot
         */
        getItemBySlot: (state) => (slot) => {
            return state.items.find(item => item.slot === slot) || null;
        },

        /**
         * Freie Slots
         */
        freeSlots: (state) => {
            const usedSlots = state.items.map(item => item.slot);
            return state.maxSlots - usedSlots.length;
        },

        /**
         * Gewichts-Prozent
         */
        weightPercent: (state) => {
            return Math.min(100, (state.currentWeight / state.maxWeight) * 100);
        },

        /**
         * Ist Inventar voll?
         */
        isFull: (state) => {
            return state.currentWeight >= state.maxWeight;
        },

        /**
         * Alle Slots als Array (für Grid-Rendering)
         */
        slotsGrid: (state) => {
            const grid = [];
            for (let i = 0; i < state.maxSlots; i++) {
                const item = state.items.find(item => item.slot === i);
                grid.push({
                    slot: i,
                    item: item || null
                });
            }
            return grid;
        }
    },

    actions: {
        /**
         * Öffne Inventar
         */
        open() {
            this.isOpen = true;
            console.log('[InventoryStore] Inventory opened');
        },

        /**
         * Schließe Inventar
         */
        close() {
            this.isOpen = false;
            this.selectedSlot = null;
            this.hideContextMenu();
            this.clearDrag();
            console.log('[InventoryStore] Inventory closed');
        },

        /**
         * Lade Inventar-Daten vom Server
         */
        loadInventoryData(data) {
            console.log('[InventoryStore] Loading inventory data', data);
            
            this.items = data.main || [];
            this.maxWeight = data.maxWeight || 50;
            this.groundItems = data.groundItems || [];
            
            // Berechne aktuelles Gewicht
            this.currentWeight = this.items.reduce((sum, item) => {
                return sum + ((item.weight || 0) * (item.amount || 1));
            }, 0);
        },

        /**
         * Update einzelnes Item
         */
        updateItem(slot, itemData) {
            const index = this.items.findIndex(item => item.slot === slot);
            
            if (index !== -1) {
                if (itemData) {
                    this.items[index] = { ...this.items[index], ...itemData };
                } else {
                    // Item entfernen
                    this.items.splice(index, 1);
                }
            } else if (itemData) {
                // Neues Item hinzufügen
                this.items.push({ slot, ...itemData });
            }
            
            this.recalculateWeight();
        },

        /**
         * Gewicht neu berechnen
         */
        recalculateWeight() {
            this.currentWeight = this.items.reduce((sum, item) => {
                return sum + ((item.weight || 0) * (item.amount || 1));
            }, 0);
        },

        /**
         * Context Menu anzeigen
         */
        showContextMenu(x, y, item) {
            this.contextMenu = {
                visible: true,
                x,
                y,
                item
            };
        },

        /**
         * Context Menu verstecken
         */
        hideContextMenu() {
            this.contextMenu = {
                visible: false,
                x: 0,
                y: 0,
                item: null
            };
        },

        /**
         * Drag Start
         */
        startDrag(slot, item) {
            this.draggedItem = item;
            this.dragSourceSlot = slot;
            console.log(`[InventoryStore] Drag started from slot ${slot}`);
        },

        /**
         * Drag End
         */
        endDrag(targetSlot) {
            if (this.dragSourceSlot === null) return;
            
            console.log(`[InventoryStore] Drag ended at slot ${targetSlot}`);
            
            // Sende Move-Request an Server
            window.NUIBridge.send('moveItem', {
                fromSlot: this.dragSourceSlot,
                toSlot: targetSlot
            });
            
            this.clearDrag();
        },

        /**
         * Clear Drag State
         */
        clearDrag() {
            this.draggedItem = null;
            this.dragSourceSlot = null;
        },

        /**
         * Item benutzen
         */
        async useItem(item, slot) {
            console.log(`[InventoryStore] Using item: ${item.name} from slot ${slot}`);
            
            try {
                const result = await window.NUIBridge.send('useItem', {
                    itemName: item.name,
                    slot: slot,
                    zone: 'main',
                    amount: 1
                });
                
                console.log('[InventoryStore] Use item result:', result);
                
                // Server wird inventory:refresh Event senden wenn erfolgreich
            } catch (error) {
                console.error('[InventoryStore] Error using item:', error);
            }
        },

        /**
         * Item droppen
         */
        async dropItem(item, slot, amount = 1) {
            console.log(`[InventoryStore] Dropping ${amount}x ${item.name} from slot ${slot}`);
            
            try {
                await window.NUIBridge.send('dropItem', {
                    slot: slot,
                    amount: amount
                });
            } catch (error) {
                console.error('[InventoryStore] Error dropping item:', error);
            }
        },

        /**
         * Item geben
         */
        async giveItem(item, slot, amount = 1) {
            console.log(`[InventoryStore] Giving ${amount}x ${item.name} from slot ${slot}`);
            
            try {
                await window.NUIBridge.send('giveItem', {
                    slot: slot,
                    amount: amount
                });
            } catch (error) {
                console.error('[InventoryStore] Error giving item:', error);
            }
        }
    }
});