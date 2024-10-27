const EXCLUDE_TAGS = [
  'style',
  'script',
  'header',
  'main',
  'footer',
  'img',
  'ytd-popup-container' // Youtube
]
const KEYWORDS = [
  'cookie',
  'advise',
  'alert',
  'popup',
  'popover',
  'overlay',
  'consent',
  'modal',
  'cmp',
  'nosnippet',
  'adblock',
  'dialog',
  'ved'
]
const KEYWORDS_GROUPS = [
  ['cookie', 'acepta'],
  ['cookie', 'accept'],
  ['publicidad', 'continua', 'socio', 'subscri']
]

function isRemovableElement (el) {
  const tagContains = KEYWORDS.some(keyword => el.tagName.toLowerCase().includes(keyword))
  const classesContains = Array.from(el.classList).some(className => KEYWORDS.some(keyword => className.toLowerCase().includes(keyword)))
  const attributesContains = Array.from(el.attributes).some(attribute => KEYWORDS.some(keyword => attribute.value.toLowerCase().includes(keyword)))
  const elementContainsKeyword = tagContains || classesContains || attributesContains

  const content = el.textContent.toLowerCase().trim()
  const hasKeywordsOnContent = KEYWORDS_GROUPS.some(group => group.every(keyword => content.includes(keyword)))
  const isOverlay = content.length === 0 && el.children.length === 0 && hasTransparentBackground(el)

  const hasFixedOrAbsChild = Array.from(el.children).some(child => hasPositionFixedOrAbsolute(child))
  const isFloating = hasPositionFixedOrAbsolute(el) || hasFixedOrAbsChild

  return elementContainsKeyword && (hasKeywordsOnContent || isOverlay) && isFloating
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

async function removeCookieModal () {
  const disabled = await getStorageValue('disabled') || false
  // if (disabled) return

  const elements = Array.from(document.body.querySelectorAll('*'))
  let count = 0

  elements.forEach(el => {
    if (isRemovableElement(el)) {
      if (EXCLUDE_TAGS.includes(el.tagName.toLowerCase())) {
        return
      }
      if (!disabled) {
        el.remove()
        count++
      }
      console.log('Removed', el)
    }
  })

  chrome.runtime.sendMessage({ count })
}

const observer = new globalThis.MutationObserver(() => removeCookieModal())
observer.observe(document.body, { childList: true, subtree: true })

setTimeout(() => {
  observer.disconnect()
}, 2000)

removeCookieModal()

async function checkBody () {
  const disabled = await getStorageValue('disabled') || false
  if (disabled) return

  if (hasOverflowHidden(document.body)) {
    document.body.style.overflow = 'auto'
  }

  const bodyClassesToRemove = Array.from(document.body.classList).filter(className => KEYWORDS.some(keyword => className.toLowerCase().includes(keyword)))
  bodyClassesToRemove.forEach(className => document.body.classList.remove(className))
}

const bodyObserver = new globalThis.MutationObserver(() => checkBody())
bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] })

setTimeout(() => {
  bodyObserver.disconnect()
}, 2000)

checkBody()

async function getStorageValue (key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key])
    })
  })
}
