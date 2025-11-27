# FiveM NUI Framework - Vollständige Dokumentation

## 📋 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Architektur](#architektur)
3. [Tech-Stack](#tech-stack)
4. [Projektstruktur](#projektstruktur)
5. [Core-Systeme](#core-systeme)
6. [Module erstellen](#module-erstellen)
7. [Beispiele](#beispiele)
8. [Best Practices](#best-practices)

---

## Übersicht

Dieses Framework bietet ein **modulares, skalierbares NUI-System** für FiveM mit:

- ✅ Zentralisierte UI-Verwaltung
- ✅ Modulare Architektur (neue UIs leicht hinzufügbar)
- ✅ Automatisches Focus-Management
- ✅ Vue 3 + Composition API
- ✅ Pinia State Management
- ✅ TailwindCSS Styling
- ✅ Drag & Drop Support
- ✅ Type-safe NUI Communication

---

## Architektur

### Schichten-Modell

```
┌─────────────────────────────────────────┐
│        Lua Client (FiveM)               │
│  ↓ SendNUIMessage / RegisterNUICallback │
├─────────────────────────────────────────┤
│         NUI Bridge (JS)                 │
│  ↓ Event Bus & Callback Handler         │
├─────────────────────────────────────────┤
│         UI Manager (JS)                 │
│  ↓ Module Registry & Lifecycle          │
├─────────────────────────────────────────┤
│    Module Layer (Vue Components)        │
│  • Inventory  • Admin  • Shop ...       │
├─────────────────────────────────────────┤
│      State Management (Pinia)           │
│  • appStore  • inventoryStore ...       │
└─────────────────────────────────────────┘
```

### Datenfluss

**Öffnen eines Moduls:**
```
Lua: SendNUIMessage({action: 'openInventory'})
  ↓
NUIBridge: Empfängt Event
  ↓
UIManager: Ruft registered Module
  ↓
FocusManager: SetNuiFocus(true)
  ↓
Store: State Update (isOpen = true)
  ↓
Vue Component: Wird gerendert
```

**NUI Callback zurück an Lua:**
```
Vue Component: User klickt Button
  ↓
useNUI Composable: send('useItem', data)
  ↓
NUIBridge: fetch('https://resource/useItem')
  ↓
Lua: RegisterNUICallback('useItem')
  ↓
Server Event: TriggerServerEvent(...)
```

---

## Tech-Stack

### Warum Vue 3?

✅ **Composition API**: Perfekt für wiederverwendbare Logik (Composables)  
✅ **Reaktivität**: Automatische UI-Updates bei State-Änderungen  
✅ **Component System**: Modulare, testbare Komponenten  
✅ **DevTools**: Besseres Debugging in der NUI-Umgebung  
✅ **FiveM Community**: Etabliert, viele Beispiele verfügbar  

### Libraries

- **Vue 3.3.4**: Frontend Framework
- **Pinia 2.1.6**: State Management
- **TailwindCSS**: Utility-First CSS
- **Vanilla JS**: NUI Bridge & Core Systems

---

## Projektstruktur

```
html/
├── index.html                  # Single Page Application Entry
├── app.js                      # Vue App Initialisierung
│
├── core/                       # Core Systems
│   ├── NUIBridge.js           # NUI ↔ Lua Communication
│   ├── UIManager.js           # Module Registry & Lifecycle
│   └── focusManager.js        # SetNuiFocus Verwaltung
│
├── shared/                     # Geteilte Utilities
│   ├── stores/
│   │   └── appStore.js        # Globaler App State
│   └── composables/
│       └── useNUI.js          # Wiederverwendbare NUI Logic
│
├── modules/                    # UI Module
│   ├── inventory/
│   │   ├── InventoryModule.js # Vue Component
│   │   └── InventoryStore.js  # Pinia Store
│   └── admin/
│       ├── AdminModule.js
│       └── AdminStore.js
│
└── styles/
    └── tailwind.css
```

---

## Core-Systeme

### 1. NUIBridge

**Verantwortlichkeiten:**
- Empfängt `SendNUIMessage` Events von Lua
- Sendet NUI Callbacks zurück an Lua
- Event-Bus für interne Kommunikation

**API:**

```javascript
// Listener registrieren
const unsubscribe = NUIBridge.on('openInventory', (data) => {
    console.log('Inventory opened', data);
});

// NUI Callback senden
await NUIBridge.send('useItem', { itemName: 'water', slot: 0 });

// Internes Event triggern
NUIBridge.trigger('closeAll');
```

---

### 2. UIManager

**Verantwortlichkeiten:**
- Module registrieren
- Module öffnen/schließen
- Lifecycle-Management
- Exklusivitäts-Handling

**Modul registrieren:**

```javascript
UIManager.register({
    name: 'inventory',              // Eindeutiger Name
    component: InventoryModule,     // Vue Component
    store: useInventoryStore,       // Pinia Store (optional)
    exclusive: false,               // Andere Module schließen?
    actions: ['openInventory'],     // NUI Actions die öffnen
    onOpen: (data) => {             // Open Callback
        const store = useInventoryStore();
        store.loadData(data);
    },
    onClose: () => {                // Close Callback
        const store = useInventoryStore();
        store.reset();
    }
});
```

**API:**

```javascript
// Modul öffnen
UIManager.open('inventory', { items: [...] });

// Modul schließen
UIManager.close('inventory');

// Alle schließen
UIManager.closeAll();

// Status prüfen
if (UIManager.isOpen('inventory')) { ... }
```

---

### 3. FocusManager

**Verantwortlichkeiten:**
- `SetNuiFocus` Management
- Verhindert Focus-Konflikte zwischen Modulen
- Automatisches Release wenn alle Module geschlossen

**API:**

```javascript
// Focus für Modul anfordern
FocusManager.request('inventory');

// Focus für Modul freigeben
FocusManager.release('inventory');

// Alle forciert schließen
FocusManager.releaseAll();
```

**Funktionsweise:**

```javascript
// Modul 1 öffnet
FocusManager.request('inventory');  // SetNuiFocus(true, true)
activeModules = ['inventory']

// Modul 2 öffnet (während Modul 1 offen)
FocusManager.request('admin');      // Kein erneuter SetNuiFocus
activeModules = ['inventory', 'admin']

// Modul 1 schließt
FocusManager.release('inventory');  // Kein SetNuiFocus(false), admin noch offen
activeModules = ['admin']

// Modul 2 schließt
FocusManager.release('admin');      // SetNuiFocus(false, false)
activeModules = []
```

---

### 4. useNUI Composable

**Wiederverwendbare NUI-Logik für Vue Components:**

```javascript
const { send, listen, useNUIState, onClose } = useNUI();

// NUI Callback senden
await send('useItem', { itemName: 'water' });

// Auf NUI Event lauschen (auto cleanup bei unmount)
listen('openInventory', (data) => {
    console.log('Inventory opened', data);
});

// Reaktiver State von NUI Updates
const health = useNUIState('updateHealth', 100, (data) => data.health);

// ESC Handler
onClose(() => {
    closeInventory();
});
```

---

## Module erstellen

### Schritt 1: Store erstellen

**`modules/shop/ShopStore.js`**

```javascript
const { defineStore } = Pinia;

const useShopStore = defineStore('shop', {
    state: () => ({
        isOpen: false,
        items: [],
        selectedItem: null
    }),

    getters: {
        availableItems: (state) => state.items.filter(i => i.stock > 0)
    },

    actions: {
        open() {
            this.isOpen = true;
        },
        
        close() {
            this.isOpen = false;
            this.selectedItem = null;
        },
        
        async loadItems() {
            const result = await window.NUIBridge.send('shop:getItems');
            this.items = result.items || [];
        },
        
        async buyItem(itemName, amount) {
            await window.NUIBridge.send('shop:buyItem', { 
                itemName, 
                amount 
            });
        }
    }
});
```

---

### Schritt 2: Vue Component erstellen

**`modules/shop/ShopModule.js`**

```javascript
const { computed } = Vue;

const ShopModule = {
    name: 'ShopModule',
    
    setup() {
        const shopStore = useShopStore();
        const { send, onClose } = useNUI();

        const isOpen = computed(() => shopStore.isOpen);
        const items = computed(() => shopStore.availableItems);

        const handleClose = () => {
            shopStore.close();
            send('closeShop');
        };

        const handleBuy = (item) => {
            shopStore.buyItem(item.name, 1);
        };

        onClose(handleClose);

        return {
            isOpen,
            items,
            handleClose,
            handleBuy
        };
    },

    template: `
        <Transition name="fade">
            <div v-if="isOpen" class="fixed inset-0 bg-black/60 flex items-center justify-center">
                <div class="bg-gray-900 rounded-2xl p-6 w-[600px]">
                    <h2 class="text-white text-2xl mb-4">Shop</h2>
                    
                    <div class="space-y-2">
                        <div 
                            v-for="item in items" 
                            :key="item.name"
                            class="bg-gray-800 p-4 rounded-lg flex justify-between items-center"
                        >
                            <div>
                                <div class="text-white font-semibold">{{ item.label }}</div>
                                <div class="text-gray-400 text-sm">\${{ item.price }}</div>
                            </div>
                            <button 
                                @click="handleBuy(item)"
                                class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
                            >
                                Kaufen
                            </button>
                        </div>
                    </div>
                    
                    <button 
                        @click="handleClose"
                        class="mt-4 w-full bg-gray-700 hover:bg-gray-600 py-2 rounded text-white"
                    >
                        Schließen
                    </button>
                </div>
            </div>
        </Transition>
    `
};
```

---

### Schritt 3: Modul registrieren

**In `app.js` hinzufügen:**

```javascript
// Import Store & Component
// (bereits geladen via <script> tags in index.html)

// Component registrieren
app.component('ShopModule', ShopModule);

// Modul registrieren
window.UIManager.register({
    name: 'shop',
    component: ShopModule,
    store: useShopStore,
    exclusive: true,
    actions: ['openShop'],
    onOpen: (data) => {
        const store = useShopStore();
        store.open();
        store.loadItems();
    },
    onClose: () => {
        const store = useShopStore();
        store.close();
    }
});
```

---

### Schritt 4: Lua Integration

**`client/shop.lua`**

```lua
function OpenShop()
    SendNUIMessage({
        action = 'openShop'
    })
    SetNuiFocus(true, true)
end

RegisterNUICallback('closeShop', function(data, cb)
    SetNuiFocus(false, false)
    cb('ok')
end)

RegisterNUICallback('shop:getItems', function(data, cb)
    FW.TriggerCallback('fw:shop:getItems', function(items)
        cb({ items = items })
    end)
end)

RegisterNUICallback('shop:buyItem', function(data, cb)
    TriggerServerEvent('fw:shop:buyItem', data.itemName, data.amount)
    cb('ok')
end)

RegisterCommand('shop', function()
    OpenShop()
end)
```

**Fertig!** Das Shop-Modul ist jetzt vollständig integriert.

---

## Best Practices

### 1. State Management

✅ **DO:** Ein Store pro Modul
```javascript
const useInventoryStore = defineStore('inventory', { ... });
const useAdminStore = defineStore('admin', { ... });
```

❌ **DON'T:** Alle Daten in einen Store
```javascript
const useAppStore = defineStore('app', {
    state: () => ({
        inventory: { ... },
        admin: { ... },
        shop: { ... }  // ❌ Besser eigener Store
    })
});
```

---

### 2. NUI Callbacks

✅ **DO:** Callbacks in Stores kapseln
```javascript
// Im Store
async useItem(item, slot) {
    const result = await window.NUIBridge.send('useItem', { ... });
    // Verarbeite Result
}

// In Component
shopStore.useItem(item, slot);
```

❌ **DON'T:** Direkt in Components
```javascript
// ❌ Schlecht
const handleUse = async () => {
    await window.NUIBridge.send('useItem', { ... });
};
```

---

### 3. Component Structure

✅ **DO:** Logik im setup(), Template sauber halten
```javascript
setup() {
    const store = useShopStore();
    const items = computed(() => store.items);
    
    const handleBuy = (item) => {
        store.buyItem(item.name, 1);
    };
    
    return { items, handleBuy };
}
```

❌ **DON'T:** Logik im Template
```html
<!-- ❌ Schlecht -->
<button @click="window.NUIBridge.send('buy', item)">
```

---

### 4. Error Handling

✅ **DO:** Try-Catch in Stores
```javascript
async loadData() {
    try {
        const result = await window.NUIBridge.send('getData');
        this.data = result.data;
    } catch (error) {
        console.error('Error loading data:', error);
        this.error = 'Laden fehlgeschlagen';
    }
}
```

---

### 5. Development Mode

**Testing ohne FiveM:**

```javascript
// In app.js bereits implementiert
if (!window.GetParentResourceName) {
    window.openInventory = () => {
        window.NUIBridge.trigger('openInventory', {
            inventory: { ... },
            health: 85,
            armor: 50
        });
    };
}
```

**Im Browser:**
```javascript
openInventory();  // Öffnet Inventory mit Test-Daten
openAdmin();      // Öffnet Admin Panel
closeAll();       // Schließt alles
```

---

## Beispiele

### Beispiel 1: Neues "Kleidungs-Menü" hinzufügen

**1. Store:** `modules/clothing/ClothingStore.js`
**2. Component:** `modules/clothing/ClothingModule.js`
**3. Registrierung in `app.js`**
**4. Lua Handler in `client/clothing.lua`**

Siehe "Modul erstellen" Sektion für vollständige Code-Beispiele.

---

### Beispiel 2: Daten vom Server laden

```javascript
// Im Store
async loadInventoryData() {
    try {
        const result = await window.NUIBridge.send('getInventory');
        
        if (result.success) {
            this.items = result.items;
            this.maxWeight = result.maxWeight;
        }
    } catch (error) {
        console.error('Failed to load inventory:', error);
    }
}
```

```lua
-- In Lua
RegisterNUICallback('getInventory', function(data, cb)
    FW.TriggerCallback('fw:inventory:getData', function(inventory)
        cb({
            success = true,
            items = inventory.items,
            maxWeight = inventory.maxWeight
        })
    end)
end)
```

---

## Performance-Tipps

1. **Lazy Loading:** Lade Daten erst beim Öffnen
2. **Computed Properties:** Nutze getters für berechnete Werte
3. **Event Cleanup:** useNUI Composable macht auto-cleanup
4. **Throttle Updates:** Nicht bei jedem Frame State updaten
5. **Virtual Scrolling:** Bei langen Listen (100+ Items)

---

## Troubleshooting

### Problem: "Module öffnet nicht"

**Lösung:**
1. Console checken: `F8` in FiveM
2. Browser Console: `F12` → Console
3. Prüfe ob Modul registriert: `UIManager.getModules()`
4. Prüfe NUIBridge logs: `[NUIBridge] Received NUI Message: ...`

---

### Problem: "Focus funktioniert nicht"

**Lösung:**
1. Prüfe FocusManager State: `FocusManager.activeModules`
2. Stelle sicher Module rufen `FocusManager.release()` beim Schließen
3. ESC-Key schließt: `closeAll()` registriert?

---

### Problem: "Callbacks erreichen Lua nicht"

**Lösung:**
1. Prüfe Resource Name: `GetParentResourceName()`
2. Callback registriert? `RegisterNUICallback('callbackName', ...)`
3. CORS? (nur in Dev-Mode relevant)

---

## Weitere Ressourcen

- **Vue 3 Docs:** https://vuejs.org/
- **Pinia Docs:** https://pinia.vuejs.org/
- **Tailwind Docs:** https://tailwindcss.com/
- **FiveM Docs:** https://docs.fivem.net/

---

**Happy Coding! 🚀**