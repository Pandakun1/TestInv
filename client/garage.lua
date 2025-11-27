-- Öffne Garage
function OpenGarage()
    SendNUIMessage({
        action = 'openGarage'
    })
    SetNuiFocus(true, true)
end

--- Schließe Garage
function CloseGarage()
    SetNuiFocus(false, false)
end

-- NUI Callbacks
RegisterNUICallback('closeGarage', function(data, cb)
    CloseGarage()
    cb('ok')
end)

RegisterNUICallback('garage:getVehicles', function(data, cb)
    FW.TriggerCallback('fw:garage:getVehicles', function(vehicles)
        cb({ vehicles = vehicles })
    end)
end)

RegisterNUICallback('garage:spawnVehicle', function(data, cb)
    TriggerServerEvent('fw:garage:spawnVehicle', data.plate)
    CloseGarage()
    cb('ok')
end)

RegisterNUICallback('garage:storeVehicle', function(data, cb)
    TriggerServerEvent('fw:garage:storeVehicle', data.plate)
    cb('ok')
end)

-- Command
RegisterCommand('garage', function()
    OpenGarage()
end)

-- Export
exports('OpenGarage', OpenGarage)
