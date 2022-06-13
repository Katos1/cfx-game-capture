exports('RecordScreen', function(msec)
  if msec > 0 then
    SendNUIMessage({START_RECORD = true, RECORD_TIME = msec})
  end
end)
