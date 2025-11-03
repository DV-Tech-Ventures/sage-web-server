; Custom NSIS installer script for Sage ERP Webhook Server

; Show custom finish page
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_TEXT "Launch Sage ERP Webhook Server"
!define MUI_FINISHPAGE_RUN_FUNCTION "LaunchApp"

; Custom finish page content
!define MUI_FINISHPAGE_SHOWREADME
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Open Quick Start Guide"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION "OpenReadme"

Function LaunchApp
  Exec '"$INSTDIR\Sage ERP Webhook Server.exe"'
FunctionEnd

Function OpenReadme
  ExecShell "open" "https://github.com/DV-Tech-Ventures/sage-web-server#quick-start-2-minutes"
FunctionEnd

; Add to Windows startup (optional)
Section "Auto-start with Windows (Optional)" SecAutoStart
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "SageWebhookServer" '"$INSTDIR\Sage ERP Webhook Server.exe" --hidden'
SectionEnd

; Desktop shortcut
Section "Desktop Shortcut" SecDesktop
  CreateShortCut "$DESKTOP\Sage ERP Webhook Server.lnk" "$INSTDIR\Sage ERP Webhook Server.exe"
SectionEnd
