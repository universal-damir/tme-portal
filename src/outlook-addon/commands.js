// Commands.js - Required for Outlook Add-in ribbon buttons
// This file handles ribbon button commands

// Initialize Office
Office.onReady(() => {
  console.log('TME Portal Commands loaded');
});

// This file is referenced in the manifest but doesn't need to do anything
// The actual functionality is in taskpane.js
// This is required by Office Add-ins architecture for ribbon buttons