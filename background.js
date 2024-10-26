chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.count) {
    chrome.action.setBadgeText({ text: message.count.toString(), tabId: sender.tab.id })
  }
})

chrome.action.onClicked.addListener(async () => {
  const disabled = await getStorageValue('disabled') || false

  chrome.storage.local.set({ disabled: !disabled })
  updateIcon(!disabled)
})

function updateIcon (disabled) {
  const sufix = disabled ? '-disabled' : ''
  chrome.action.setIcon({
    path: {
      128: `icons/128${sufix}.png`
    }
  })
}

async function getStorageValue (key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key])
    })
  })
}
