const ELEMENTS = ['div', 'section', 'iframe', 'aside', 'article']
const BUTTONS = ['button', 'a', '[role=button]', '[onclick]']
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
  'epb',
  'nosnippet',
  'adblock',
  'dialog',
  'ved',
  'gdpr',
  'gtm',
  'fixed',
  'sticky',
  'absolute',
  'div',
  'section'
]
const KEYWORDS_GROUPS = [
  ['cookie', 'acepta'],
  ['cookie', 'accept'],
  ['cookie', 'política'],
  ['publicidad', 'continua', 'socio', 'subs'],
  ['cookie', 'policy']
]
const BUTTON_REJECT = [
  'rechazar',
  'rechazar todo',
  'no acepta',
  'continuar sin aceptar',
  'reject',
  'reject all',
  'reject all cookies',
  'deny',
  'deny all',
  'non accept',
  'accept selected',
  'necessary cookies only',
  'rechazar cookies no necesarias'
]
const BUTTON_ACCEPT = [
  'aceptar',
  'accept',
  'aceptar todo',
  'aceptar todas',
  'aceptar y cerrar',
  'aceptar y continuar',
  'aceptar cookies',
  'aceptar todo y cerrar',
  'aceptar y seguir'
]

async function rejectCookieModal () {
  const disabled = await getStorageValue('disabled') || false
  if (disabled) return

  let count = 0
  const elements = Array.from(document.body.querySelectorAll(ELEMENTS.join(',')))
  elements.forEach(el => {
    const content = el.textContent.toLowerCase().trim()
    const hasGroupKeywordsOnContent = KEYWORDS_GROUPS.some(group => group.every(keyword => content.includes(keyword)))

    if (hasElementKeywords(el, KEYWORDS) && hasGroupKeywordsOnContent) {
      el.querySelectorAll(BUTTONS).forEach(button => {
        const content = button.textContent.toLowerCase().trim()
        const hasReject = BUTTON_REJECT.some(keyword => content === keyword)
        if (hasReject) {
          button.click()
          count++
          return
        }
        const hasAccept = BUTTON_ACCEPT.some(keyword => content === keyword)
        if (hasAccept) {
          button.click()
          count++
        }
      })
    }
  })
  chrome.runtime.sendMessage({ count })
}

function hasElementKeywords (el, keywords) {
  return containsKeyword(keywords, el.tagName) ||
    Array.from(el.classList).some(value => containsKeyword(keywords, value)) ||
    Array.from(el.attributes).some(attr => containsKeyword(keywords, attr.value)) ||
    Array.from(el.attributes).some(attr => containsKeyword(keywords, attr.name))
}

function containsKeyword (array, str) {
  return array.some(value => str.toLowerCase().trim().includes(value))
}

const observer = new globalThis.MutationObserver(() => rejectCookieModal())
observer.observe(document.body, { childList: true, subtree: true })

setTimeout(() => {
  rejectCookieModal()
}, 300)

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

  document.removeEventListener('scroll', disconnectObservers)
  document.removeEventListener('click', disconnectObservers)
}
