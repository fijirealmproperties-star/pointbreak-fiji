Set ws = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
rootDir = fso.GetParentFolderName(scriptDir)

ws.CurrentDirectory = rootDir

ws.Run "cmd /c node server/index.js", 0, False
WScript.Sleep 3000
ws.Run "http://localhost:3001"

Do While True
    WScript.Sleep 1000
Loop
