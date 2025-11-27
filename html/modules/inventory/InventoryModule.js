/**
 * Inventory Module - Design Update (3-Column Layout)
 */

const { computed, ref, onMounted } = Vue;

const InventoryModule = {
    name: 'InventoryModule',
    
    setup() {
        const inventoryStore = useInventoryStore();
        const appStore = useAppStore();
        const { send, onClose } = useNUI();

        // Drag & Drop State
        const dragOverSlot = ref(null);

        // Computed
        const isOpen = computed(() => inventoryStore.isOpen);
        const slots = computed(() => inventoryStore.slotsGrid);
        const weightPercent = computed(() => inventoryStore.weightPercent);
        const contextMenu = computed(() => inventoryStore.contextMenu);

        // Dummy Keys für Visualisierung (falls keine echten Daten kommen)
        const keys = computed(() => [
            { label: 'Autoschlüssel', plate: 'PANDA-1' },
            { label: 'Haustürschlüssel', id: 'Haus 12' },
            { label: 'Job Schlüssel', job: 'Police' }
        ]);

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
            
            // Map actions to store functions
            if (action === 'use') inventoryStore.useItem(item, item.slot);
            if (action === 'drop') inventoryStore.dropItem(item, item.slot, 1);
            if (action === 'give') inventoryStore.giveItem(item, item.slot, 1);
            
            inventoryStore.hideContextMenu();
        };

        // Drag & Drop Handlers
        const handleDragStart = (event, slot, item) => {
            if (!item) return;
            inventoryStore.startDrag(slot, item);
        };
        const handleDragOver = (event, slot) => {
            event.preventDefault();
            dragOverSlot.value = slot;
        };
        const handleDrop = (event, targetSlot) => {
            event.preventDefault();
            dragOverSlot.value = null;
            inventoryStore.endDrag(targetSlot);
        };

        onClose(handleClose);

        return {
            isOpen, slots, weightPercent, contextMenu, dragOverSlot, appStore, keys,
            handleClose, handleSlotClick, handleSlotRightClick, handleContextAction,
            handleDragStart, handleDragOver, handleDrop
        };
    },

    template: `
    <Transition name="fade">
        <div v-if="isOpen" class="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm font-sans">
            
            <div class="flex gap-6 h-[700px]">
                
                <div class="w-[280px] flex flex-col gap-4">
                    
                    <div class="bg-[#121317] border border-[#2a2b36] rounded-2xl p-5 flex flex-col shadow-xl">
                        <h3 class="text-[#d4b483] text-lg font-bold mb-4 tracking-wide text-center">Geldbörse</h3>
                        <div class="flex items-center justify-between mb-4">
                            <div class="text-5xl">wallet</div> <div class="text-right">
                                <div class="text-[#2e3038] text-xs font-bold uppercase">Bargeld</div>
                                <div class="text-white text-xl font-bold font-mono">{{ appStore.player.cash }} $</div>
                            </div>
                        </div>
                        <div class="flex items-center justify-between pt-4 border-t border-[#2a2b36]">
                            <div class="text-3xl">💳</div>
                            <div class="text-right">
                                <div class="text-[#2e3038] text-xs font-bold uppercase">Bank</div>
                                <div class="text-white text-lg font-bold font-mono">{{ appStore.player.bank }} $</div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-[#121317] border border-[#2a2b36] rounded-2xl p-5 flex-1 flex flex-col shadow-xl overflow-hidden">
                        <h3 class="text-[#d4b483] text-lg font-bold mb-4 tracking-wide text-center">Schlüsselbund</h3>
                        <div class="flex-1 overflow-y-auto pr-2 space-y-3">
                            <div v-for="(key, i) in keys" :key="i" class="flex items-center gap-3 p-2 rounded hover:bg-[#1c1e24] transition">
                                <div class="text-2xl text-gray-500">🔑</div>
                                <div>
                                    <div class="text-gray-200 font-medium text-sm">{{ key.label }}</div>
                                    <div class="text-gray-500 text-xs">{{ key.plate || key.id || key.job }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="w-[500px] bg-[#121317] border border-[#2a2b36] rounded-2xl flex flex-col shadow-2xl relative">
                    <div class="py-5 text-center border-b border-[#2a2b36]">
                        <h1 class="text-[#d4b483] text-2xl font-bold tracking-[0.2em]">INVENTAR</h1>
                    </div>
                    
                    <button class="absolute top-5 right-5 text-gray-500 hover:text-white">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                    </button>

                    <div class="p-6 grid grid-cols-5 gap-3 overflow-y-auto custom-scrollbar">
                        <div 
                            v-for="slotData in slots" 
                            :key="slotData.slot"
                            @click="handleSlotClick(slotData.slot, slotData.item)"
                            @contextmenu="handleSlotRightClick($event, slotData.slot, slotData.item)"
                            @dragstart="handleDragStart($event, slotData.slot, slotData.item)"
                            @dragover="handleDragOver($event, slotData.slot)"
                            @drop="handleDrop($event, slotData.slot)"
                            draggable="true"
                            class="aspect-square bg-[#0b0c0f] border rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 group"
                            :class="[
                                slotData.item ? 'border-[#2a2b36] hover:border-[#d4b483]/50 hover:bg-[#16171d]' : 'border-[#1a1b21]',
                                dragOverSlot === slotData.slot ? '!border-yellow-500 !bg-yellow-500/10' : ''
                            ]"
                        >
                            <div v-if="slotData.item" class="w-full h-full p-2 flex flex-col items-center">
                                <div class="flex-1 flex items-center justify-center">
                                    <img v-if="slotData.item.image" :src="'img/' + slotData.item.image" class="w-12 h-12 object-contain drop-shadow-md">
                                    <span v-else class="text-3xl">📦</span>
                                </div>
                                <div v-if="slotData.item.amount > 1" class="absolute top-1 right-1 bg-[#1a1b21] text-gray-400 text-[10px] font-bold px-1.5 rounded border border-[#2a2b36]">
                                    x{{ slotData.item.amount }}
                                </div>
                                <div class="text-[10px] text-gray-400 font-medium text-center w-full truncate px-1 mt-1 group-hover:text-white">
                                    {{ slotData.item.label }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="w-[280px] bg-[#121317] border border-[#2a2b36] rounded-2xl p-6 flex flex-col shadow-xl">
                    
                    <div class="h-48 flex items-center justify-center mb-6 opacity-30">
                        <svg viewBox="0 0 24 24" fill="currentColor" class="w-32 h-32 text-gray-400">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                    </div>

                    <div class="mb-2 text-gray-300 font-medium">Ped</div>

                    <div class="space-y-4 mb-8">
                        <div>
                            <div class="flex justify-between text-xs text-gray-500 mb-1"><span>Armor</span></div>
                            <div class="h-1.5 bg-[#0b0c0f] rounded-full overflow-hidden">
                                <div class="h-full bg-blue-500" :style="{ width: appStore.armorPercent + '%' }"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between text-xs text-gray-500 mb-1"><span>Hunger</span></div>
                            <div class="h-1.5 bg-[#0b0c0f] rounded-full overflow-hidden">
                                <div class="h-full bg-orange-500" :style="{ width: appStore.player.hunger + '%' }"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between text-xs text-gray-500 mb-1"><span>Durst</span></div>
                            <div class="h-1.5 bg-[#0b0c0f] rounded-full overflow-hidden">
                                <div class="h-full bg-cyan-500" :style="{ width: appStore.player.thirst + '%' }"></div>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center justify-between text-gray-300 text-sm mb-6">
                        <span>{{ Math.round(inventoryStore.currentWeight) }} / {{ inventoryStore.maxWeight }}.0 kg</span>
                        <span class="text-green-500">🍃</span>
                    </div>

                    <div class="space-y-3 mt-auto">
                        <button class="w-full py-2.5 rounded-lg border border-[#d4b483]/30 text-[#d4b483] text-sm hover:bg-[#d4b483]/10 transition">
                            Auf den Boden ablegen
                        </button>
                        <button class="w-full py-2.5 rounded-lg border border-[#2a2b36] bg-[#1a1b21] text-gray-400 text-sm hover:bg-[#25262e] transition">
                            Geben-Modus
                        </button>
                        <button class="w-full py-2.5 rounded-lg border border-[#d4b483]/30 text-[#d4b483] text-sm hover:bg-[#d4b483]/10 transition">
                            Vom Boden aufheben
                        </button>
                    </div>
                </div>

            </div>

            <div 
                v-if="contextMenu.visible"
                class="fixed bg-[#1a1b21] border border-[#2a2b36] rounded shadow-2xl py-1 z-[60] w-40"
                :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
            >
                <button @click="handleContextAction('use')" class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2b36] hover:text-white">Benutzen</button>
                <button @click="handleContextAction('give')" class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2b36] hover:text-white">Geben</button>
                <button @click="handleContextAction('drop')" class="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#2a2b36] hover:text-red-300">Wegwerfen</button>
            </div>

        </div>
    </Transition>
    `
};