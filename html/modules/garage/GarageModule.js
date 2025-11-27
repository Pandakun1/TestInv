// ============================================
// 2. COMPONENT: modules/garage/GarageModule.js
// ============================================

const { computed, ref } = Vue;

const GarageModule = {
    name: 'GarageModule',
    
    setup() {
        const garageStore = useGarageStore();
        const { send, onClose } = useNUI();

        const searchQuery = ref('');

        const isOpen = computed(() => garageStore.isOpen);
        const vehicles = computed(() => {
            const filtered = garageStore.filteredVehicles;
            if (!searchQuery.value) return filtered;
            
            return filtered.filter(v => 
                v.model.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                v.plate.toLowerCase().includes(searchQuery.value.toLowerCase())
            );
        });
        const selectedVehicle = computed(() => garageStore.selectedVehicleData);
        const isLoading = computed(() => garageStore.isLoading);

        const handleClose = () => {
            garageStore.close();
            send('closeGarage');
        };

        const handleSelectVehicle = (vehicle) => {
            garageStore.selectVehicle(vehicle.plate);
        };

        const handleSpawn = () => {
            if (!selectedVehicle.value) return;
            garageStore.spawnVehicle(selectedVehicle.value.plate);
        };

        const handleStore = () => {
            if (!selectedVehicle.value) return;
            garageStore.storeVehicle(selectedVehicle.value.plate);
        };

        const setFilter = (filter) => {
            garageStore.setFilter(filter);
        };

        onClose(handleClose);

        return {
            isOpen,
            vehicles,
            selectedVehicle,
            isLoading,
            searchQuery,
            garageStore,
            handleClose,
            handleSelectVehicle,
            handleSpawn,
            handleStore,
            setFilter
        };
    },

    template: `
        <Transition name="fade">
            <div v-if="isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <div class="bg-gray-900/95 rounded-2xl shadow-2xl border border-blue-500/50 w-[900px] h-[600px] flex overflow-hidden">
                    
                    <!-- Vehicle List -->
                    <div class="w-2/3 border-r border-gray-700 flex flex-col">
                        <!-- Header -->
                        <div class="bg-gray-800/50 border-b border-gray-700 p-4">
                            <h2 class="text-xl font-bold text-white mb-2">🚗 Garage</h2>
                            
                            <!-- Search -->
                            <input 
                                v-model="searchQuery"
                                type="text"
                                placeholder="Fahrzeug oder Kennzeichen suchen..."
                                class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            >
                        </div>

                        <!-- Filter Tabs -->
                        <div class="flex border-b border-gray-700">
                            <button 
                                @click="setFilter('all')"
                                class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
                                :class="garageStore.filter === 'all' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'"
                            >
                                Alle
                            </button>
                            <button 
                                @click="setFilter('stored')"
                                class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
                                :class="garageStore.filter === 'stored' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'"
                            >
                                Eingelagert
                            </button>
                            <button 
                                @click="setFilter('owned')"
                                class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
                                :class="garageStore.filter === 'owned' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'"
                            >
                                Im Besitz
                            </button>
                        </div>

                        <!-- Vehicle List -->
                        <div class="flex-1 overflow-y-auto p-4">
                            <div v-if="isLoading" class="text-center text-gray-500 mt-8">
                                Lade Fahrzeuge...
                            </div>

                            <div v-else-if="vehicles.length === 0" class="text-center text-gray-500 mt-8">
                                Keine Fahrzeuge gefunden
                            </div>

                            <div v-else class="space-y-2">
                                <div 
                                    v-for="vehicle in vehicles"
                                    :key="vehicle.plate"
                                    @click="handleSelectVehicle(vehicle)"
                                    class="bg-gray-800/70 border-2 rounded-lg p-4 cursor-pointer transition-all hover:bg-gray-800"
                                    :class="selectedVehicle?.plate === vehicle.plate 
                                        ? 'border-blue-500 ring-2 ring-blue-400/50' 
                                        : 'border-gray-700'"
                                >
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <div class="text-white font-semibold text-lg">
                                                {{ vehicle.model }}
                                            </div>
                                            <div class="text-gray-400 text-sm">
                                                {{ vehicle.plate }}
                                            </div>
                                        </div>
                                        
                                        <div class="flex items-center gap-3">
                                            <!-- Fuel -->
                                            <div class="text-right">
                                                <div class="text-xs text-gray-400">Benzin</div>
                                                <div class="text-sm font-semibold" :class="vehicle.fuel > 20 ? 'text-green-400' : 'text-red-400'">
                                                    {{ vehicle.fuel }}%
                                                </div>
                                            </div>
                                            
                                            <!-- Status Badge -->
                                            <div 
                                                class="px-2 py-1 rounded text-xs font-medium"
                                                :class="vehicle.stored 
                                                    ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                                                    : 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'"
                                            >
                                                {{ vehicle.stored ? '🅿️ Eingelagert' : '🚗 Draußen' }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Vehicle Details -->
                    <div class="w-1/3 flex flex-col">
                        <!-- Header -->
                        <div class="bg-gray-800/50 border-b border-gray-700 p-4 flex justify-between items-center">
                            <h3 class="text-lg font-semibold text-white">Details</h3>
                            <button 
                                @click="handleClose"
                                class="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <!-- Details Content -->
                        <div class="flex-1 p-6">
                            <div v-if="!selectedVehicle" class="text-center text-gray-500 mt-12">
                                Wähle ein Fahrzeug aus
                            </div>

                            <div v-else class="space-y-6">
                                <!-- Vehicle Info -->
                                <div>
                                    <h4 class="text-white text-2xl font-bold mb-1">
                                        {{ selectedVehicle.model }}
                                    </h4>
                                    <p class="text-gray-400">
                                        Kennzeichen: {{ selectedVehicle.plate }}
                                    </p>
                                </div>

                                <!-- Stats -->
                                <div class="space-y-3">
                                    <div class="bg-gray-800/50 rounded-lg p-3">
                                        <div class="text-xs text-gray-400 mb-1">Benzin</div>
                                        <div class="flex items-center gap-2">
                                            <div class="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div 
                                                    class="h-full transition-all"
                                                    :class="selectedVehicle.fuel > 20 ? 'bg-green-500' : 'bg-red-500'"
                                                    :style="{ width: selectedVehicle.fuel + '%' }"
                                                ></div>
                                            </div>
                                            <span class="text-white text-sm font-medium">
                                                {{ selectedVehicle.fuel }}%
                                            </span>
                                        </div>
                                    </div>

                                    <div class="bg-gray-800/50 rounded-lg p-3">
                                        <div class="text-xs text-gray-400 mb-1">Status</div>
                                        <div 
                                            class="inline-block px-3 py-1 rounded text-sm font-medium"
                                            :class="selectedVehicle.stored 
                                                ? 'bg-green-600/20 text-green-400' 
                                                : 'bg-yellow-600/20 text-yellow-400'"
                                        >
                                            {{ selectedVehicle.stored ? 'Eingelagert' : 'Draußen' }}
                                        </div>
                                    </div>
                                </div>

                                <!-- Actions -->
                                <div class="space-y-2 pt-4">
                                    <button 
                                        v-if="selectedVehicle.stored"
                                        @click="handleSpawn"
                                        class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                                    >
                                        🚗 Ausholen
                                    </button>
                                    <button 
                                        v-else
                                        @click="handleStore"
                                        class="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
                                    >
                                        🅿️ Einlagern
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </Transition>
    `
};