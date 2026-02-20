/**
 * Detects the user's operating system and browser from the user-agent string.
 * Returns { os, osVersion, browser, browserVersion } with human-friendly names.
 */

export function detectOS() {
  const ua = navigator.userAgent

  // Order matters — more specific patterns first
  if (/Windows NT 10/.test(ua)) {
    // Windows 11 reports as NT 10 but with build >= 22000
    // navigator.userAgentData can help, but fallback to "Windows 11 / 10"
    if (navigator.userAgentData?.platform === 'Windows') {
      // Check via high-entropy hints if available
      return { name: 'Windows', version: '11 / 10', icon: 'windows' }
    }
    return { name: 'Windows', version: '11 / 10', icon: 'windows' }
  }
  if (/Windows NT 6\.3/.test(ua)) return { name: 'Windows', version: '8.1', icon: 'windows' }
  if (/Windows NT 6\.2/.test(ua)) return { name: 'Windows', version: '8', icon: 'windows' }
  if (/Windows NT 6\.1/.test(ua)) return { name: 'Windows', version: '7', icon: 'windows' }
  if (/Windows/.test(ua)) return { name: 'Windows', version: '', icon: 'windows' }

  if (/Mac OS X/.test(ua)) {
    const ver = ua.match(/Mac OS X ([\d_]+)/)
    const version = ver ? ver[1].replace(/_/g, '.') : ''
    return { name: 'macOS', version, icon: 'macos' }
  }

  if (/Ubuntu/.test(ua)) return { name: 'Ubuntu', version: '', icon: 'linux' }
  if (/Fedora/.test(ua)) return { name: 'Fedora', version: '', icon: 'linux' }
  if (/Parrot/.test(ua)) return { name: 'Parrot Linux', version: '', icon: 'linux' }
  if (/Arch/.test(ua)) return { name: 'Arch Linux', version: '', icon: 'linux' }
  if (/Linux/.test(ua)) return { name: 'Linux', version: '', icon: 'linux' }

  if (/CrOS/.test(ua)) return { name: 'ChromeOS', version: '', icon: 'chromeos' }
  if (/Android/.test(ua)) {
    const ver = ua.match(/Android ([\d.]+)/)
    return { name: 'Android', version: ver ? ver[1] : '', icon: 'android' }
  }
  if (/iPhone|iPad|iPod/.test(ua)) {
    const ver = ua.match(/OS ([\d_]+)/)
    return { name: 'iOS', version: ver ? ver[1].replace(/_/g, '.') : '', icon: 'macos' }
  }

  return { name: 'Unknown OS', version: '', icon: 'unknown' }
}

export function detectBrowser() {
  const ua = navigator.userAgent

  // Order matters — more specific first (Edge before Chrome, etc.)
  if (/Edg\//.test(ua)) {
    const ver = ua.match(/Edg\/([\d.]+)/)
    return { name: 'Microsoft Edge', version: ver ? ver[1] : '', icon: 'edge' }
  }
  if (/OPR\/|Opera/.test(ua)) {
    const ver = ua.match(/OPR\/([\d.]+)/) || ua.match(/Opera\/([\d.]+)/)
    return { name: 'Opera', version: ver ? ver[1] : '', icon: 'opera' }
  }
  if (/Brave/.test(ua)) {
    return { name: 'Brave', version: '', icon: 'brave' }
  }
  if (/Vivaldi/.test(ua)) {
    const ver = ua.match(/Vivaldi\/([\d.]+)/)
    return { name: 'Vivaldi', version: ver ? ver[1] : '', icon: 'vivaldi' }
  }
  if (/Firefox\//.test(ua)) {
    const ver = ua.match(/Firefox\/([\d.]+)/)
    return { name: 'Firefox', version: ver ? ver[1] : '', icon: 'firefox' }
  }
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) {
    const ver = ua.match(/Chrome\/([\d.]+)/)
    return { name: 'Google Chrome', version: ver ? ver[1] : '', icon: 'chrome' }
  }
  if (/Chromium/.test(ua)) {
    const ver = ua.match(/Chromium\/([\d.]+)/)
    return { name: 'Chromium', version: ver ? ver[1] : '', icon: 'chrome' }
  }
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) {
    const ver = ua.match(/Version\/([\d.]+)/)
    return { name: 'Safari', version: ver ? ver[1] : '', icon: 'safari' }
  }

  return { name: 'Unknown Browser', version: '', icon: 'unknown' }
}

export function getDeviceInfo() {
  return {
    os: detectOS(),
    browser: detectBrowser(),
  }
}
