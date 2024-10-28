const EXCLUDE_TAGS = [
  'style',
  'script',
  'header',
  'main',
  'footer',
  'img',
  'input',
  'button',
  'svg',
  'path',
  'a',
  'video',
  'i'
]
const EXCLUDE_KEYWORDS = [
  'ytd', // Youtube
  'ytp', // Youtube
  'avatar'
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
  'ved',
  'gdpr',
  'gtm',
  'fixed',
  'sticky',
  'absolute'
]
const KEYWORDS_GROUPS = [
  ['cookie', 'acepta'],
  ['cookie', 'policy'],
  ['publicidad', 'continua', 'socio', 'subs']
]

function isRemovableElement (el) {
  if (EXCLUDE_TAGS.includes(el.tagName.toLowerCase()) ||
      containsKeyword(EXCLUDE_KEYWORDS, el.tagName) ||
      Array.from(el.classList).some(value => containsKeyword(EXCLUDE_KEYWORDS, value)) ||
      Array.from(el.attributes).some(attr => containsKeyword(EXCLUDE_KEYWORDS, attr.value))) {
    return false
  }

  const tagContains = containsKeyword(KEYWORDS, el.tagName)
  const classesContains = Array.from(el.classList).some(value => containsKeyword(KEYWORDS, value))
  const attributesContains = Array.from(el.attributes).some(attr => containsKeyword(KEYWORDS, attr.value))

  const content = el.textContent.toLowerCase().trim()
  const hasKeywordsOnContent = KEYWORDS_GROUPS.some(group => group.every(keyword => content.includes(keyword)))
  const isOverlay = content.length === 0 && el.children.length === 0 && hasTransparentBackground(el)

  const hasFloatingChild = Array.from(el.children).some(child => hasPositionFixedOrAbsolute(child))
  const isFloating = hasPositionFixedOrAbsolute(el) || hasFloatingChild

  return (tagContains || classesContains || attributesContains) && (hasKeywordsOnContent || isOverlay) && isFloating
}

function containsKeyword (array, str) {
  return array.some(value => str.toLowerCase().trim().includes(value))
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

checkBody()

async function getStorageValue (key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key])
    })
  })
}

document.addEventListener('scroll', disconnectObservers)
document.addEventListener('click', disconnectObservers)

function disconnectObservers () {
  observer.disconnect()
  bodyObserver.disconnect()

  document.removeEventListener('scroll', disconnectObservers)
  document.removeEventListener('click', disconnectObservers)
}
