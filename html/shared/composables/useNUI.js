/**
 * useNUI Composable - Wiederverwendbare NUI-Kommunikations-Logic
 * 
 * Vereinfacht NUI Callbacks und Event-Handling in Vue Components
 */

function useNUI() {
    const { ref, onMounted, onUnmounted } = Vue;

    /**
     * Sende einen NUI Callback an Lua
     * @param {string} callback
     * @param {object} data
     * @returns {Promise}
     */
    const send = async (callback, data = {}) => {
        try {
            return await window.NUIBridge.send(callback, data);
        } catch (error) {
            console.error(`[useNUI] Error sending ${callback}:`, error);
            throw error;
        }
    };

    /**
     * Lausche auf eine NUI Action
     * @param {string} action
     * @param {function} handler
     */
    const listen = (action, handler) => {
        let unsubscribe;

        onMounted(() => {
            unsubscribe = window.NUIBridge.on(action, handler);
        });

        onUnmounted(() => {
            if (unsubscribe) {
                unsubscribe();
            }
        });
    };

    /**
     * Erstelle einen reaktiven State der von NUI Updates empfängt
     * @param {string} action - NUI Action
     * @param {any} initialValue - Initial Value
     * @param {function} transformer - Optional data transformer
     * @returns {Ref}
     */
    const useNUIState = (action, initialValue, transformer = (data) => data) => {
        const state = ref(initialValue);

        listen(action, (data) => {
            state.value = transformer(data);
        });

        return state;
    };

    /**
     * Close-Handler (ESC oder Close-Button)
     * @param {function} callback
     */
    const onClose = (callback) => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                callback();
            }
        };

        onMounted(() => {
            window.addEventListener('keydown', handleKeyDown);
        });

        onUnmounted(() => {
            window.removeEventListener('keydown', handleKeyDown);
        });
    };

    return {
        send,
        listen,
        useNUIState,
        onClose
    };
}

// Globale Composable-Funktion
window.useNUI = useNUI;