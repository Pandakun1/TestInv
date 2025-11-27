/**
 * Admin Module - Vollständiges Admin-Panel als Vue Component
 */

const { computed, ref } = Vue;

const AdminModule = {
    name: 'AdminModule',
    
    setup() {
        const adminStore = useAdminStore();
        const { send, onClose } = useNUI();

        // Local State
        const searchQuery = ref('');
        const vehicleSearchQuery = ref('');

        // Computed
        const isOpen = computed(() => adminStore.isOpen);
        const selectedCategory = computed(() => adminStore.selectedCategory);
        const categories = computed(() => adminStore.categories);
        
        const filteredPlayers = computed(() => {
            if (!searchQuery.value) return adminStore.players;
            
            return adminStore.players.filter(player => 
                player.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                player.steamid.toLowerCase().includes(searchQuery.value.toLowerCase())
            );
        });

        // Methods
        const handleClose = () => {
            adminStore.close();
            send('closeAdmin');
        };

        const selectCategory = (categoryId) => {
            adminStore.selectCategory(categoryId);
        };

        const handlePlayerAction = (action, player) => {
            switch (action) {
                case 'teleport':
                    adminStore.teleportToPlayer(player.id);
                    break;
                case 'heal':
                    adminStore.healPlayer(player.id);
                    break;
                case 'kick':
                    if (confirm(`Spieler ${player.name} kicken?`)) {
                        adminStore.kickPlayer(player.id, 'Admin Kick');
                    }
                    break;
            }
        };

        const handleVehicleSpawn = (model) => {
            adminStore.spawnVehicle(model);
        };

        // Close on ESC
        onClose(handleClose);

        return {
            isOpen,
            selectedCategory,
            categories,
            adminStore,
            searchQuery,
            vehicleSearchQuery,
            filteredPlayers,
            handleClose,
            selectCategory,
            handlePlayerAction,
            handleVehicleSpawn
        };
    },

    template: `
        <Transition name="fade">
            <div v-if="isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <!-- Admin Panel Container -->
                <div class="bg-gray-900/95 rounded-2xl shadow-2xl border border-red-500/50 w-[1000px] h-[700px] flex overflow-hidden">
                    
                    <!-- Sidebar -->
                    <div class="w-64 bg-gray-800/80 border-r border-gray-700 p-4">
                        <!-- Header -->
                        <div class="mb-6">
                            <h2 class="text-xl font-bold text-red-400 flex items-center gap-2">
                                <span>⚠️</span> Admin Panel
                            </h2>
                            <p class="text-gray-400 text-sm mt-1">Verwaltung</p>
                        </div>

                        <!-- Categories -->
                        <div class="space-y-1">
                            <button
                                v-for="category in categories"
                                :key="category.id"
                                @click="selectCategory(category.id)"
                                class="w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all"
                                :class="selectedCategory === category.id 
                                    ? 'bg-red-500 text-white' 
                                    : 'text-gray-300 hover:bg-gray-700'"
                            >
                                <span class="text-xl">{{ category.icon }}</span>
                                <span class="font-medium">{{ category.label }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Content Area -->
                    <div class="flex-1 flex flex-col">
                        <!-- Header Bar -->
                        <div class="bg-gray-800/50 border-b border-gray-700 p-4 flex items-center justify-between">
                            <h3 class="text-lg font-semibold text-white">
                                {{ adminStore.currentCategory?.label }}
                            </h3>
                            <button 
                                @click="handleClose"
                                class="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <!-- Content -->
                        <div class="flex-1 overflow-y-auto p-6">
                            
                            <!-- Players Category -->
                            <div v-if="selectedCategory === 'players'">
                                <!-- Search -->
                                <input 
                                    v-model="searchQuery"
                                    type="text"
                                    placeholder="Spieler suchen..."
                                    class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 mb-4 focus:outline-none focus:border-red-500"
                                >

                                <!-- Player List -->
                                <div class="space-y-2">
                                    <div 
                                        v-for="player in filteredPlayers"
                                        :key="player.id"
                                        class="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                                    >
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <div class="text-white font-semibold">{{ player.name }}</div>
                                                <div class="text-gray-400 text-sm">ID: {{ player.id }} | {{ player.steamid }}</div>
                                            </div>
                                            <div class="flex gap-2">
                                                <button 
                                                    @click="handlePlayerAction('teleport', player)"
                                                    class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                                                >
                                                    Teleport
                                                </button>
                                                <button 
                                                    @click="handlePlayerAction('heal', player)"
                                                    class="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                                                >
                                                    Heilen
                                                </button>
                                                <button 
                                                    @click="handlePlayerAction('kick', player)"
                                                    class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                                                >
                                                    Kick
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="filteredPlayers.length === 0" class="text-center text-gray-500 mt-8">
                                    Keine Spieler gefunden
                                </div>
                            </div>

                            <!-- Teleport Category -->
                            <div v-if="selectedCategory === 'teleport'" class="grid grid-cols-2 gap-3">
                                <button class="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 text-white transition-colors">
                                    📍 Waypoint
                                </button>
                                <button class="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 text-white transition-colors">
                                    🏢 Legion Square
                                </button>
                                <button class="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 text-white transition-colors">
                                    🏥 Pillbox Hospital
                                </button>
                                <button class="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 text-white transition-colors">
                                    👮 Police Station
                                </button>
                            </div>

                            <!-- Vehicles Category -->
                            <div v-if="selectedCategory === 'vehicles'">
                                <input 
                                    v-model="vehicleSearchQuery"
                                    type="text"
                                    placeholder="Fahrzeug Spawn Code..."
                                    class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 mb-4 focus:outline-none focus:border-red-500"
                                >
                                <button 
                                    @click="handleVehicleSpawn(vehicleSearchQuery)"
                                    class="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors"
                                    :disabled="!vehicleSearchQuery"
                                >
                                    Fahrzeug spawnen
                                </button>

                                <div class="grid grid-cols-3 gap-3 mt-4">
                                    <button 
                                        @click="handleVehicleSpawn('adder')"
                                        class="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-3 text-white text-sm transition-colors"
                                    >
                                        🏎️ Adder
                                    </button>
                                    <button 
                                        @click="handleVehicleSpawn('t20')"
                                        class="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-3 text-white text-sm transition-colors"
                                    >
                                        🏎️ T20
                                    </button>
                                    <button 
                                        @click="handleVehicleSpawn('zentorno')"
                                        class="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-3 text-white text-sm transition-colors"
                                    >
                                        🏎️ Zentorno
                                    </button>
                                </div>
                            </div>

                            <!-- Noclip Category -->
                            <div v-if="selectedCategory === 'noclip'">
                                <div class="space-y-4">
                                    <div class="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <h4 class="text-white font-semibold mb-1">Noclip</h4>
                                                <p class="text-gray-400 text-sm">Frei durch die Map fliegen</p>
                                            </div>
                                            <button 
                                                @click="adminStore.toggleNoclip()"
                                                class="px-6 py-3 rounded-lg font-semibold transition-colors"
                                                :class="adminStore.noclipEnabled 
                                                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                                                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'"
                                            >
                                                {{ adminStore.noclipEnabled ? 'AN' : 'AUS' }}
                                            </button>
                                        </div>
                                    </div>

                                    <div class="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <h4 class="text-white font-semibold mb-1">Godmode</h4>
                                                <p class="text-gray-400 text-sm">Unverwundbar</p>
                                            </div>
                                            <button 
                                                @click="adminStore.toggleGodmode()"
                                                class="px-6 py-3 rounded-lg font-semibold transition-colors"
                                                :class="adminStore.godmodeEnabled 
                                                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                                                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'"
                                            >
                                                {{ adminStore.godmodeEnabled ? 'AN' : 'AUS' }}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Weather Category -->
                            <div v-if="selectedCategory === 'weather'" class="grid grid-cols-4 gap-3">
                                <button class="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 text-white transition-colors">
                                    ☀️ Klar
                                </button>
                                <button class="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 text-white transition-colors">
                                    ☁️ Bewölkt
                                </button>
                                <button class="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 text-white transition-colors">
                                    🌧️ Regen
                                </button>
                                <button class="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 text-white transition-colors">
                                    ⚡ Gewitter
                                </button>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </Transition>
    `
};