const KEYWORDS = ['cookie', 'advise', 'alert', 'popup', 'popover', 'consent', 'modal', 'cmp', 'nosnippet', 'adblock', 'dialog', 'ved']
const ELEMENTS_NOT_TO_REMOVE = ['style', 'script', 'header', 'main', 'footer', 'img']

function isRemovableElement (el) {
  const tagContainsKeyword = KEYWORDS.some(keyword => el.tagName.toLowerCase().includes(keyword))
  const classContainsKeyword = Array.from(el.classList).some(className => KEYWORDS.some(keyword => className.toLowerCase().includes(keyword)))
  const attributeContainsKeyword = Array.from(el.attributes).some(attribute => KEYWORDS.some(keyword => attribute.value.toLowerCase().includes(keyword)))

  const content = el.textContent.toLowerCase()

  const hasKeywordsOnContent =
        ['cookie'].some(keyword => content.includes(keyword)) ||
        ['publicidad', 'continuar', 'socio', 'subscribir'].every(keyword => content.includes(keyword))

  const isOverlay = content.trim().length === 0 && hasTransparentBackground(el)

  const hasFixedOrAbs = hasPositionFixedOrAbsolute(el)
  const hasFixedOrAbsChild = Array.from(el.children).some(child => hasPositionFixedOrAbsolute(child))

  return (tagContainsKeyword || classContainsKeyword || attributeContainsKeyword) &&
        (hasKeywordsOnContent || isOverlay) && (hasFixedOrAbs || hasFixedOrAbsChild)
}

function hasPositionFixedOrAbsolute (el) {
  const position = window.getComputedStyle(el).getPropertyValue('position')
  return ['fixed', 'absolute'].includes(position)
}

function hasTransparentBackground (el) {
  const bgColor = window.getComputedStyle(el).backgroundColor
  const rgba = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d*))?\)/)
  if (rgba) {
    const alpha = rgba[4] ? parseFloat(rgba[4]) : 1
    return alpha < 1
  }
  return false
}

function hasOverflowHidden (el) {
  const overflow = window.getComputedStyle(el).getPropertyValue('overflow')
  return overflow === 'hidden'
}

async function getStorageValue (key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key])
    })
  })
}

async function removeCookieModal () {
  const disabled = await getStorageValue('disabled') || false
  if (disabled) return

  const elements = Array.from(document.body.querySelectorAll('*'))
  let count = 0

  elements.forEach(el => {
    if (isRemovableElement(el)) {
      const target = el
      if (ELEMENTS_NOT_TO_REMOVE.includes(target.tagName.toLowerCase())) {
        return
      }
      target.remove()
      console.log('Removed', target)
      count++
    }
  })

  if (hasOverflowHidden(document.body)) {
    document.body.style.overflow = 'auto'
  }

  chrome.runtime.sendMessage({ count })
}

const observer = new globalThis.MutationObserver(() => removeCookieModal())
observer.observe(document.body, { childList: true, subtree: true })

setTimeout(() => {
  observer.disconnect()
}, 10000)

removeCookieModal()

function checkBody () {
  if (hasOverflowHidden(document.body)) {
    document.body.style.overflow = 'auto'
  }

  const bodyClasses = document.body.classList
  const bodyClassesToRemove = Array.from(bodyClasses).filter(className => KEYWORDS.some(keyword => className.toLowerCase().includes(keyword)))
  bodyClassesToRemove.forEach(className => document.body.classList.remove(className))
}

const bodyObserver = new globalThis.MutationObserver(() => checkBody())
bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] })

setTimeout(() => {
  bodyObserver.disconnect()
}, 10000)

checkBody()
