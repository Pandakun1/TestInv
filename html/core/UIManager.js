/**
 * UIManager - Zentrales modulares UI-System
 * 
 * Verantwortlich für:
 * - Registrierung von UI-Modulen
 * - Öffnen/Schließen von Modulen
 * - Lifecycle-Management
 * - Kommunikation zwischen Modulen
 */

class UIManager {
    constructor() {
        this.modules = new Map();
        this.activeModule = null;
        this.debugMode = true;
        this.init();
    }

    init() {
        // Lausche auf globale Close-Events
        window.addEventListener('nui:closeAll', () => {
            this.closeAll();
        });

        this.log('UIManager initialized');
    }

    /**
     * Registriere ein neues UI-Modul
     * @param {object} config - Modul-Konfiguration
     * @param {string} config.name - Eindeutiger Modulname
     * @param {object} config.component - Vue Component
     * @param {object} config.store - Pinia Store (optional)
     * @param {boolean} config.exclusive - Andere Module schließen beim Öffnen?
     * @param {function} config.onOpen - Callback beim Öffnen
     * @param {function} config.onClose - Callback beim Schließen
     * @param {array} config.actions - NUI Actions die dieses Modul öffnen
     */
    register(config) {
        const {
            name,
            component,
            store = null,
            exclusive = true,
            onOpen = null,
            onClose = null,
            actions = []
        } = config;

        if (this.modules.has(name)) {
            console.warn(`Module ${name} is already registered!`);
            return;
        }

        const module = {
            name,
            component,
            store,
            exclusive,
            onOpen,
            onClose,
            isOpen: false,
            actions
        };

        this.modules.set(name, module);
        this.log(`Module registered: ${name}`, { actions, exclusive });

        // Registriere NUI Actions für dieses Modul
        actions.forEach(action => {
            window.NUIBridge.on(action, (data) => {
                this.open(name, data);
            });
        });

        // Lausche auf Close-Action für dieses Modul
        window.NUIBridge.on(`close${this.capitalize(name)}`, () => {
            this.close(name);
        });
    }

    /**
     * Öffne ein Modul
     * @param {string} name - Modulname
     * @param {object} data - Optionale Daten
     */
    open(name, data = {}) {
        const module = this.modules.get(name);
        
        if (!module) {
            console.error(`Module ${name} not found!`);
            return;
        }

        if (module.isOpen) {
            this.log(`Module ${name} is already open`);
            return;
        }

        // Wenn exklusiv, schließe andere Module
        if (module.exclusive) {
            this.closeOthers(name);
        }

        this.log(`Opening module: ${name}`, data);

        // Setze als aktives Modul
        this.activeModule = name;
        module.isOpen = true;

        // Request Focus
        window.FocusManager.request(name);

        // Trigger onOpen Callback
        if (module.onOpen) {
            module.onOpen(data);
        }

        // Trigger Event
        window.dispatchEvent(new CustomEvent('ui:moduleOpened', { 
            detail: { name, data } 
        }));
    }

    /**
     * Schließe ein Modul
     * @param {string} name - Modulname
     */
    close(name) {
        const module = this.modules.get(name);
        
        if (!module) {
            console.error(`Module ${name} not found!`);
            return;
        }

        if (!module.isOpen) {
            return;
        }

        this.log(`Closing module: ${name}`);

        module.isOpen = false;

        // Release Focus
        window.FocusManager.release(name);

        // Trigger onClose Callback
        if (module.onClose) {
            module.onClose();
        }

        // Update aktives Modul
        if (this.activeModule === name) {
            this.activeModule = null;
        }

        // Trigger Event
        window.dispatchEvent(new CustomEvent('ui:moduleClosed', { 
            detail: { name } 
        }));
    }

    /**
     * Schließe alle Module außer dem angegebenen
     * @param {string} exceptName
     */
    closeOthers(exceptName) {
        this.modules.forEach((module, name) => {
            if (name !== exceptName && module.isOpen) {
                this.close(name);
            }
        });
    }

    /**
     * Schließe alle Module
     */
    closeAll() {
        this.log('Closing all modules');
        this.modules.forEach((module, name) => {
            if (module.isOpen) {
                this.close(name);
            }
        });
        window.FocusManager.releaseAll();
    }

    /**
     * Prüfe ob ein Modul offen ist
     * @param {string} name
     * @returns {boolean}
     */
    isOpen(name) {
        const module = this.modules.get(name);
        return module ? module.isOpen : false;
    }

    /**
     * Get alle registrierten Module
     * @returns {Map}
     */
    getModules() {
        return this.modules;
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    log(message, data) {
        if (this.debugMode) {
            console.log(`[UIManager] ${message}`, data || '');
        }
    }
}

// Globale Instanz
window.UIManager = new UIManager();