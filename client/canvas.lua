RegisterCommand("start_recording", function()
  SendNUIMessage({command = "START_RECORDING"})
end)

RegisterCommand("stop_recording", function()
  SendNUIMessage({command = "STOP_RECORDING"})
end)