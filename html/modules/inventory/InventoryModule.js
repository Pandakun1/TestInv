/**
 * Inventory Module - Komplettes Inventar-System als Vue Component
 */

const { computed, ref, onMounted } = Vue;

const InventoryModule = {
    name: 'InventoryModule',
    
    setup() {
        const inventoryStore = useInventoryStore();
        const appStore = useAppStore();
        const { send, onClose } = useNUI();

        // Local State
        const dragOverSlot = ref(null);

        // Computed
        const isOpen = computed(() => inventoryStore.isOpen);
        const slots = computed(() => inventoryStore.slotsGrid);
        const weightPercent = computed(() => inventoryStore.weightPercent);
        const contextMenu = computed(() => inventoryStore.contextMenu);

        // Methods
        const handleClose = () => {
            inventoryStore.close();
            send('closeInventory');
        };

        const handleSlotClick = (slot, item) => {
            if (!item) return;
            inventoryStore.selectedSlot = slot;
        };

        const handleSlotRightClick = (event, slot, item) => {
            if (!item) return;
            
            event.preventDefault();
            inventoryStore.showContextMenu(event.clientX, event.clientY, { ...item, slot });
        };

        const handleContextAction = (action) => {
            const item = contextMenu.value.item;
            
            if (!item) return;
            
            switch (action) {
                case 'use':
                    inventoryStore.useItem(item, item.slot);
                    break;
                case 'drop':
                    inventoryStore.dropItem(item, item.slot, 1);
                    break;
                case 'give':
                    inventoryStore.giveItem(item, item.slot, 1);
                    break;
            }
            
            inventoryStore.hideContextMenu();
        };

        // Drag & Drop
        const handleDragStart = (event, slot, item) => {
            if (!item) return;
            
            inventoryStore.startDrag(slot, item);
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', slot);
        };

        const handleDragOver = (event, slot) => {
            event.preventDefault();
            dragOverSlot.value = slot;
        };

        const handleDragLeave = () => {
            dragOverSlot.value = null;
        };

        const handleDrop = (event, targetSlot) => {
            event.preventDefault();
            dragOverSlot.value = null;
            inventoryStore.endDrag(targetSlot);
        };

        // Close on ESC
        onClose(handleClose);

        // Hide context menu on outside click
        onMounted(() => {
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.context-menu')) {
                    inventoryStore.hideContextMenu();
                }
            });
        });

        return {
            isOpen,
            slots,
            weightPercent,
            contextMenu,
            dragOverSlot,
            appStore,
            handleClose,
            handleSlotClick,
            handleSlotRightClick,
            handleContextAction,
            handleDragStart,
            handleDragOver,
            handleDragLeave,
            handleDrop
        };
    },

    template: `
        <Transition name="fade">
            <div v-if="isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <!-- Main Inventory Container -->
                <div class="bg-gray-900/95 rounded-2xl shadow-2xl border border-gray-700/50 w-[800px] p-6">
                    <!-- Header -->
                    <div class="flex items-center justify-between mb-6">
                        <div>
                            <h2 class="text-2xl font-bold text-white">Inventar</h2>
                            <p class="text-gray-400 text-sm mt-1">
                                {{ appStore.player.name || 'Spieler' }}
                            </p>
                        </div>
                        
                        <!-- Weight Bar -->
                        <div class="flex items-center gap-4">
                            <div class="text-right">
                                <div class="text-xs text-gray-400">Gewicht</div>
                                <div class="text-sm font-semibold text-white">
                                    {{ Math.round(inventoryStore.currentWeight) }} / {{ inventoryStore.maxWeight }} kg
                                </div>
                            </div>
                            <div class="w-48 h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                    class="h-full transition-all duration-300"
                                    :class="weightPercent > 90 ? 'bg-red-500' : weightPercent > 70 ? 'bg-yellow-500' : 'bg-green-500'"
                                    :style="{ width: weightPercent + '%' }"
                                ></div>
                            </div>
                        </div>
                        
                        <!-- Close Button -->
                        <button 
                            @click="handleClose"
                            class="text-gray-400 hover:text-white transition-colors"
                        >
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    <!-- Stats Bar -->
                    <div class="grid grid-cols-4 gap-3 mb-6">
                        <div class="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
                            <div class="text-xs text-gray-400 mb-1">Health</div>
                            <div class="flex items-center gap-2">
                                <div class="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div class="h-full bg-red-500 transition-all" :style="{ width: appStore.healthPercent + '%' }"></div>
                                </div>
                                <span class="text-xs text-white font-medium">{{ Math.round(appStore.healthPercent) }}%</span>
                            </div>
                        </div>
                        
                        <div class="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
                            <div class="text-xs text-gray-400 mb-1">Armor</div>
                            <div class="flex items-center gap-2">
                                <div class="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div class="h-full bg-blue-500 transition-all" :style="{ width: appStore.armorPercent + '%' }"></div>
                                </div>
                                <span class="text-xs text-white font-medium">{{ Math.round(appStore.armorPercent) }}%</span>
                            </div>
                        </div>
                        
                        <div class="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
                            <div class="text-xs text-gray-400 mb-1">Hunger</div>
                            <div class="flex items-center gap-2">
                                <div class="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div class="h-full bg-orange-500 transition-all" :style="{ width: appStore.player.hunger + '%' }"></div>
                                </div>
                                <span class="text-xs text-white font-medium">{{ Math.round(appStore.player.hunger) }}%</span>
                            </div>
                        </div>
                        
                        <div class="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
                            <div class="text-xs text-gray-400 mb-1">Thirst</div>
                            <div class="flex items-center gap-2">
                                <div class="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div class="h-full bg-cyan-500 transition-all" :style="{ width: appStore.player.thirst + '%' }"></div>
                                </div>
                                <span class="text-xs text-white font-medium">{{ Math.round(appStore.player.thirst) }}%</span>
                            </div>
                        </div>
                    </div>

                    <!-- Inventory Grid -->
                    <div class="grid grid-cols-5 gap-2">
                        <div 
                            v-for="slotData in slots" 
                            :key="slotData.slot"
                            @click="handleSlotClick(slotData.slot, slotData.item)"
                            @contextmenu="handleSlotRightClick($event, slotData.slot, slotData.item)"
                            @dragstart="handleDragStart($event, slotData.slot, slotData.item)"
                            @dragover="handleDragOver($event, slotData.slot)"
                            @dragleave="handleDragLeave"
                            @drop="handleDrop($event, slotData.slot)"
                            :draggable="!!slotData.item"
                            class="aspect-square bg-gray-800/70 border-2 rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer transition-all hover:border-gray-600 relative group"
                            :class="{
                                'border-gray-700': !slotData.item,
                                'border-blue-500': slotData.item,
                                'border-yellow-500': dragOverSlot === slotData.slot,
                                'ring-2 ring-blue-400': inventoryStore.selectedSlot === slotData.slot
                            }"
                        >
                            <!-- Empty Slot -->
                            <div v-if="!slotData.item" class="text-gray-600 text-xs">{{ slotData.slot + 1 }}</div>
                            
                            <!-- Item -->
                            <div v-else class="w-full h-full flex flex-col items-center justify-center">
                                <!-- Item Image/Icon -->
                                <div class="w-12 h-12 bg-gray-700 rounded flex items-center justify-center mb-1">
                                    <img 
                                        v-if="slotData.item.image" 
                                        :src="slotData.item.image" 
                                        class="w-10 h-10 object-contain"
                                        :alt="slotData.item.label"
                                    >
                                    <span v-else class="text-2xl">📦</span>
                                </div>
                                
                                <!-- Item Label -->
                                <div class="text-xs text-white font-medium text-center truncate w-full">
                                    {{ slotData.item.label || slotData.item.name }}
                                </div>
                                
                                <!-- Item Amount -->
                                <div 
                                    v-if="slotData.item.amount > 1"
                                    class="absolute top-1 right-1 bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded"
                                >
                                    {{ slotData.item.amount }}
                                </div>
                                
                                <!-- Slot Number -->
                                <div class="absolute bottom-1 left-1 text-gray-500 text-xs">
                                    {{ slotData.slot + 1 }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Context Menu -->
                    <Transition name="fade">
                        <div 
                            v-if="contextMenu.visible"
                            class="context-menu fixed bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 min-w-[160px] z-50"
                            :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
                        >
                            <button 
                                @click="handleContextAction('use')"
                                class="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                                <span>✓</span> Benutzen
                            </button>
                            <button 
                                @click="handleContextAction('give')"
                                class="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                                <span>👤</span> Geben
                            </button>
                            <button 
                                @click="handleContextAction('drop')"
                                class="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                                <span>🗑️</span> Wegwerfen
                            </button>
                        </div>
                    </Transition>
                </div>
            </div>
        </Transition>
    `
};