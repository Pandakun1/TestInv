-- ============================================
-- NUI Integration Client-Side
-- Zentrale Verwaltung aller NUI-Kommunikation
-- ============================================

local isAnyUIOpen = false
local openModules = {}

-- ============================================
-- Focus Management
-- ============================================

--- Setze NUI Focus
---@param hasFocus boolean
---@param hasCursor boolean
local function SetNUIFocus(hasFocus, hasCursor)
    SetNuiFocus(hasFocus, hasCursor)
    isAnyUIOpen = hasFocus
    
    if Config and Config.Debug then
        print(string.format('[FW Core NUI] Focus: %s | Cursor: %s', 
            hasFocus and 'true' or 'false',
            hasCursor and 'true' or 'false'
        ))
    end
end

-- NUI Callback: setFocus (vom Frontend angefordert)
RegisterNUICallback('setFocus', function(data, cb)
    SetNUIFocus(data.hasFocus, data.hasCursor)
    cb('ok')
end)

-- ============================================
-- Inventory Integration
-- ============================================

--- Öffne Inventar
function OpenInventory()
    if openModules['inventory'] then 
        print('[FW Core NUI] Inventory already open')
        return 
    end
    
    print('[FW Core NUI] Opening inventory...')
    openModules['inventory'] = true
    
    -- Hole Inventar-Daten vom Server
    FW.TriggerCallback('fw:inventory:getInventoryData', function(inventory)
        FW.TriggerCallback('fw:inventory:getGroundItems', function(groundItems)
            local playerPed = PlayerPedId()
            local health = (GetEntityHealth(playerPed) - 100) / (GetEntityMaxHealth(playerPed) - 100) * 100
            local armor = GetPedArmour(playerPed)
            
            -- Konvertiere groundItems zu Array
            local groundArray = {}
            for _, item in pairs(groundItems or {}) do
                table.insert(groundArray, item)
            end
            
            -- Sende openInventory Event an NUI
            SendNUIMessage({
                action = 'openInventory',
                inventory = {
                    wallet = {},
                    keys = {},
                    main = inventory or {},
                    hotbar = {}
                },
                maxWeight = 50,
                cash = 0,        -- TODO: Aus Framework holen
                bank = 0,        -- TODO: Aus Framework holen
                groundItems = groundArray,
                health = math.max(0, math.min(100, health)),
                armor = armor,
                hunger = 100,    -- TODO: Aus Framework holen
                thirst = 100     -- TODO: Aus Framework holen
            })
            
            SetNUIFocus(true, true)
        end)
    end)
end

--- Schließe Inventar
function CloseInventory()
    if not openModules['inventory'] then return end
    
    print('[FW Core NUI] Closing inventory...')
    openModules['inventory'] = nil
    
    SendNUIMessage({
        action = 'closeInventory'
    })
    
    -- Focus nur entfernen wenn keine anderen Module offen sind
    if not next(openModules) then
        SetNUIFocus(false, false)
    end
end

-- NUI Callbacks
RegisterNUICallback('closeInventory', function(data, cb)
    CloseInventory()
    cb('ok')
end)

RegisterNUICallback('useItem', function(data, cb)
    print('[FW Core NUI] Use item:', json.encode(data))
    TriggerServerEvent('fw:inventory:useItem', data)
    cb({ success = true })
end)

RegisterNUICallback('moveItem', function(data, cb)
    print('[FW Core NUI] Move item:', json.encode(data))
    TriggerServerEvent('fw:inventory:moveItem', data)
    cb('ok')
end)

RegisterNUICallback('dropItem', function(data, cb)
    print('[FW Core NUI] Drop item:', json.encode(data))
    TriggerServerEvent('fw:inventory:dropItem', data)
    cb('ok')
end)

RegisterNUICallback('giveItem', function(data, cb)
    print('[FW Core NUI] Give item:', json.encode(data))
    TriggerServerEvent('fw:inventory:giveItem', data)
    cb('ok')
end)

-- Server Event: Inventory Updated
RegisterNetEvent('fw:inventory:refresh', function(inventoryData)
    print('[FW Core NUI] Inventory refresh from server')
    SendNUIMessage({
        action = 'updateInventory',
        inventory = inventoryData
    })
end)

-- Commands
RegisterCommand('inventory', function()
    if openModules['inventory'] then
        CloseInventory()
    else
        OpenInventory()
    end
end, false)

RegisterKeyMapping('inventory', 'Inventar öffnen/schließen', 'keyboard', 'I')

-- ============================================
-- Admin Panel Integration
-- ============================================

--- Öffne Admin Panel
function OpenAdminPanel()
    if openModules['admin'] then 
        print('[FW Core NUI] Admin panel already open')
        return 
    end
    
    print('[FW Core NUI] Opening admin panel...')
    openModules['admin'] = true
    
    SendNUIMessage({
        action = 'openAdmin'
    })
    
    SetNUIFocus(true, true)
end

--- Schließe Admin Panel
function CloseAdminPanel()
    if not openModules['admin'] then return end
    
    print('[FW Core NUI] Closing admin panel...')
    openModules['admin'] = nil
    
    SendNUIMessage({
        action = 'closeAdmin'
    })
    
    if not next(openModules) then
        SetNUIFocus(false, false)
    end
end

-- NUI Callbacks für Admin
RegisterNUICallback('closeAdmin', function(data, cb)
    CloseAdminPanel()
    cb('ok')
end)

RegisterNUICallback('admin:getPlayers', function(data, cb)
    FW.TriggerCallback('fw:admin:getPlayers', function(players)
        cb({ players = players })
    end)
end)

RegisterNUICallback('admin:teleportToPlayer', function(data, cb)
    TriggerServerEvent('fw:admin:teleportToPlayer', data.playerId)
    cb('ok')
end)

RegisterNUICallback('admin:healPlayer', function(data, cb)
    TriggerServerEvent('fw:admin:healPlayer', data.playerId)
    cb('ok')
end)

RegisterNUICallback('admin:kickPlayer', function(data, cb)
    TriggerServerEvent('fw:admin:kickPlayer', data.playerId, data.reason)
    cb('ok')
end)

RegisterNUICallback('admin:spawnVehicle', function(data, cb)
    TriggerServerEvent('fw:admin:spawnVehicle', data.model)
    cb('ok')
end)

RegisterNUICallback('admin:toggleNoclip', function(data, cb)
    TriggerServerEvent('fw:admin:toggleNoclip', data.enabled)
    cb('ok')
end)

RegisterNUICallback('admin:toggleGodmode', function(data, cb)
    TriggerServerEvent('fw:admin:toggleGodmode', data.enabled)
    cb('ok')
end)

-- Admin Command
RegisterCommand('admin', function()
    if openModules['admin'] then
        CloseAdminPanel()
    else
        OpenAdminPanel()
    end
end, false)

-- ============================================
-- Global Close Handler
-- ============================================

RegisterNUICallback('closeAll', function(data, cb)
    print('[FW Core NUI] Closing all modules')
    
    for moduleName, _ in pairs(openModules) do
        SendNUIMessage({
            action = 'close' .. moduleName:gsub("^%l", string.upper)
        })
    end
    
    openModules = {}
    SetNUIFocus(false, false)
    
    cb('ok')
end)

-- ============================================
-- Exports (für andere Resources)
-- ============================================

exports('OpenInventory', OpenInventory)
exports('CloseInventory', CloseInventory)
exports('OpenAdminPanel', OpenAdminPanel)
exports('CloseAdminPanel', CloseAdminPanel)

exports('IsAnyUIOpen', function()
    return isAnyUIOpen
end)

print('[FW Core NUI] Client integration loaded')