// MiMic Extension - Options Page Script

// Default approved channels
const DEFAULT_CHANNELS = [
  '/@halfbrewed',
  '/@nexpo',
  '/@soupysoupx',
  '/@bazamalam',
  '/@emortalmarcus',
  '/@sodagirl',
  '/@muldered',
  '/@dissemiotic',
  '/@wowmanzz',
  '/@seedbutter',
  '/@4plus419',
  '/@nightmind',
  '/@antthonygallego',
  '/@minaxa',
  '/@wendigoon',
  '/@catman_vhs',
  '/@crowmudgeon',
  '/@tmetal2854',
  '/@mythonics',
  '/@reapestrella',
  '/@danielprofeta',
  '/@sunflower41xd',
  '/@bdstudios8700',
  '/@johnxwoodcat',
  '/@codexcurse',
  '/@thenightarchives4148',
  '/@thathorrordude101',
  '/@thatguyzanyt',
  '/@m3owyt',
  '/@tedorate',
  '/@abashortfilms',
  '/@gearisko',
  '/@jaybird160',
  '/@nightmaremasterclass',
  '/@gr33nmansam',
  '/@drippyghost',
  '/@gear2nd'
];

// DOM elements
const automateToggle = document.getElementById('automateToggle');
const channelsList = document.getElementById('channelsList');
const saveButton = document.getElementById('saveButton');
const resetButton = document.getElementById('resetButton');
const validationMessage = document.getElementById('validationMessage');
const statusMessage = document.getElementById('statusMessage');

// Load saved settings on page load
document.addEventListener('DOMContentLoaded', () => {
  loadChannels();
  loadAutomation();
});

// Event listeners
saveButton.addEventListener('click', saveChannels);
resetButton.addEventListener('click', resetToDefaults);
channelsList.addEventListener('input', validateInput);

// Load automation toggle from storage
function loadAutomation() {
  chrome.storage.sync.get(['automateOpens'], (result) => {
    automateToggle.checked = result.automateOpens === true;
  });
}

automateToggle.addEventListener('change', () => {
  chrome.storage.sync.set({ automateOpens: automateToggle.checked });
});

// Load channels from storage
function loadChannels() {
  chrome.storage.sync.get(['approvedChannels'], (result) => {
    const channels = result.approvedChannels || DEFAULT_CHANNELS;
    channelsList.value = channels.join('\n');
    validateInput();
  });
}

// Validate input as user types
function validateInput() {
  const input = channelsList.value;
  const lines = input.split('\n');
  
  // Clear previous validation messages
  validationMessage.className = 'validation-message';
  validationMessage.textContent = '';
  
  // Filter out empty lines
  const nonEmptyLines = lines.filter(line => line.trim() !== '');
  
  if (nonEmptyLines.length === 0) {
    validationMessage.className = 'validation-message warning';
    validationMessage.textContent = 'Warning: No channels entered. At least one channel is recommended.';
    saveButton.disabled = false;
    return { valid: true, channels: [] };
  }
  
  const errors = [];
  const validChannels = [];
  
  nonEmptyLines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Check if line starts with /@
    if (!trimmed.startsWith('/@')) {
      errors.push(`Line ${index + 1}: Must start with "/@" (found: "${trimmed}")`);
      return;
    }
    
    // Count occurrences of /@
    const matches = trimmed.match(/\/@/g);
    if (matches && matches.length > 1) {
      errors.push(`Line ${index + 1}: Contains multiple "/@" instances (found: "${trimmed}")`);
      return;
    }
    
    // Check for invalid characters (basic validation)
    // YouTube handles can contain letters, numbers, underscores, and periods
    const handlePart = trimmed.substring(2); // Remove /@
    if (handlePart.length === 0) {
      errors.push(`Line ${index + 1}: Handle cannot be empty (found: "${trimmed}")`);
      return;
    }
    
    // Check for whitespace in handle
    if (/\s/.test(handlePart)) {
      errors.push(`Line ${index + 1}: Handle cannot contain spaces (found: "${trimmed}")`);
      return;
    }
    
    // Valid channel
    validChannels.push(trimmed.toLowerCase());
  });
  
  // Display validation errors
  if (errors.length > 0) {
    validationMessage.className = 'validation-message error';
    validationMessage.innerHTML = errors.slice(0, 5).join('<br>');
    if (errors.length > 5) {
      validationMessage.innerHTML += `<br>... and ${errors.length - 5} more errors`;
    }
    saveButton.disabled = true;
    return { valid: false, channels: [] };
  }
  
  // Check for duplicates
  const uniqueChannels = [...new Set(validChannels)];
  if (uniqueChannels.length < validChannels.length) {
    validationMessage.className = 'validation-message warning';
    validationMessage.textContent = 'Warning: Duplicate channels detected. They will be removed when saved.';
  }
  
  saveButton.disabled = false;
  return { valid: true, channels: uniqueChannels };
}

// Save channels to storage
function saveChannels() {
  const validation = validateInput();
  
  if (!validation.valid) {
    showStatus('Please fix validation errors before saving.', 'error');
    return;
  }
  
  const channels = validation.channels;
  
  // Save to Chrome storage
  chrome.storage.sync.set({ approvedChannels: channels }, () => {
    if (chrome.runtime.lastError) {
      showStatus('Error saving channels: ' + chrome.runtime.lastError.message, 'error');
      return;
    }
    
    // Update the textarea to show cleaned/deduplicated list
    channelsList.value = channels.join('\n');
    
    showStatus(`Successfully saved ${channels.length} channel${channels.length !== 1 ? 's' : ''}!`, 'success');
    
    // Clear validation message
    validationMessage.className = 'validation-message';
    validationMessage.textContent = '';
    
    // Notify content scripts to reload their channel list
    notifyContentScripts();
  });
}

// Reset to default channels
function resetToDefaults() {
  if (confirm('Are you sure you want to reset to the default channel list? This will overwrite your current settings.')) {
    chrome.storage.sync.set({ approvedChannels: DEFAULT_CHANNELS }, () => {
      if (chrome.runtime.lastError) {
        showStatus('Error resetting channels: ' + chrome.runtime.lastError.message, 'error');
        return;
      }
      
      channelsList.value = DEFAULT_CHANNELS.join('\n');
      validateInput();
      showStatus('Channels reset to defaults!', 'success');
      
      // Notify content scripts
      notifyContentScripts();
    });
  }
}

// Notify all open YouTube watch tabs to reload their channel list
function notifyContentScripts() {
  chrome.tabs.query({ url: 'https://www.youtube.com/watch*' }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { action: 'reloadChannels' }, () => {
        if (chrome.runtime.lastError) {
          console.log('Could not notify tab:', chrome.runtime.lastError.message);
        }
      });
    });
  });
}

let statusTimeout = null;

// Show status message
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  
  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => {
      statusMessage.className = 'status-message';
      statusMessage.textContent = '';
    }, 3000);
  }
}
