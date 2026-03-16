/**
 * Detects the user's operating system and browser from the user-agent string.
 * Returns { os, osVersion, browser, browserVersion } with human-friendly names.
 */

export function detectOS(userAgent) {
  const ua = userAgent || navigator.userAgent

  // Order matters — more specific patterns first
  if (/Windows 11/.test(ua)) return { name: 'Windows', version: '11', icon: 'windows' }
  if (/Windows NT 10/.test(ua)) {
    // Chromium client hints can distinguish Windows 11 vs 10.
    // `platformVersion` major >= 13 typically maps to Windows 11.
    if (!userAgent && navigator.userAgentData?.platform === 'Windows') {
      const platformVersion = navigator.userAgentData.platformVersion || ''
      const major = Number.parseInt(String(platformVersion).split('.')[0] || '', 10)
      if (Number.isFinite(major)) {
        return { name: 'Windows', version: major >= 13 ? '11' : '10', icon: 'windows' }
      }
    }

    // UA string alone cannot reliably distinguish 11 from 10.
    return { name: 'Windows', version: '10', icon: 'windows' }
  }
  if (/Windows NT 6\.3/.test(ua)) return { name: 'Windows', version: '8.1', icon: 'windows' }
  if (/Windows NT 6\.2/.test(ua)) return { name: 'Windows', version: '8', icon: 'windows' }
  if (/Windows NT 6\.1/.test(ua)) return { name: 'Windows', version: '7', icon: 'windows' }
  if (/Windows/.test(ua)) return { name: 'Windows', version: '', icon: 'windows' }

  // iPadOS 13+ can advertise itself as Macintosh while still being a touch mobile device.
  if (/\(Macintosh;.*Mac OS X.*\) AppleWebKit.*Version\/.*Mobile\/.*Safari\//.test(ua)) {
    const ver = ua.match(/Version\/([\d.]+)/)
    return { name: 'iPadOS', version: ver ? ver[1] : '', icon: 'ios' }
  }

  if (/iPhone|iPad|iPod/.test(ua)) {
    const ver = ua.match(/OS ([\d_]+)/)
    return { name: /iPad/.test(ua) ? 'iPadOS' : 'iOS', version: ver ? ver[1].replace(/_/g, '.') : '', icon: 'ios' }
  }

  if (/Mac OS X/.test(ua)) {
    const ver = ua.match(/Mac OS X ([\d_]+)/)
    const version = ver ? ver[1].replace(/_/g, '.') : ''
    return { name: 'macOS', version, icon: 'macos' }
  }

  if (/Android/.test(ua)) {
    const ver = ua.match(/Android ([\d.]+)/)
    return { name: 'Android', version: ver ? ver[1] : '', icon: 'android' }
  }
  if (/CrOS/.test(ua)) return { name: 'ChromeOS', version: '', icon: 'chromeos' }

  if (/Ubuntu/.test(ua)) return { name: 'Ubuntu', version: '', icon: 'linux' }
  if (/Fedora/.test(ua)) return { name: 'Fedora', version: '', icon: 'linux' }
  if (/Parrot/.test(ua)) return { name: 'Parrot Linux', version: '', icon: 'linux' }
  if (/Arch/.test(ua)) return { name: 'Arch Linux', version: '', icon: 'linux' }
  if (/Linux/.test(ua)) return { name: 'Linux', version: '', icon: 'linux' }

  return { name: 'Unknown OS', version: '', icon: 'unknown' }
}

export function detectBrowser(userAgent) {
  const ua = userAgent || navigator.userAgent

  // Order matters — more specific first (Edge before Chrome, etc.)
  if (/EdgiOS\//.test(ua)) {
    const ver = ua.match(/EdgiOS\/([\d.]+)/)
    return { name: 'Microsoft Edge', version: ver ? ver[1] : '', icon: 'edge' }
  }
  if (/FxiOS\//.test(ua)) {
    const ver = ua.match(/FxiOS\/([\d.]+)/)
    return { name: 'Firefox', version: ver ? ver[1] : '', icon: 'firefox' }
  }
  if (/CriOS\//.test(ua)) {
    const ver = ua.match(/CriOS\/([\d.]+)/)
    return { name: 'Google Chrome', version: ver ? ver[1] : '', icon: 'chrome' }
  }
  if (/OPiOS\//.test(ua)) {
    const ver = ua.match(/OPiOS\/([\d.]+)/)
    return { name: 'Opera', version: ver ? ver[1] : '', icon: 'opera' }
  }
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

export function getDeviceInfo(userAgent) {
  return {
    os: detectOS(userAgent),
    browser: detectBrowser(userAgent),
  }
}

export async function getHighEntropyOSInfo() {
  const uaData = navigator.userAgentData
  if (!uaData || !uaData.getHighEntropyValues) {
    return null
  }

  try {
    const values = await uaData.getHighEntropyValues(['platformVersion'])
    const platform = uaData.platform || ''
    const platformVersion = String(values.platformVersion || '')
    const major = Number.parseInt(platformVersion.split('.')[0] || '', 10)

    if (platform === 'Windows') {
      if (!Number.isFinite(major)) return { name: 'Windows', version: '', icon: 'windows' }
      return { name: 'Windows', version: major >= 13 ? '11' : '10', icon: 'windows' }
    }

    if (platform === 'macOS') {
      return {
        name: 'macOS',
        version: Number.isFinite(major) ? String(major) : '',
        icon: 'macos',
      }
    }

    if (platform === 'Android') {
      return {
        name: 'Android',
        version: platformVersion || '',
        icon: 'android',
      }
    }

    if (platform === 'iOS') {
      return {
        name: 'iOS',
        version: platformVersion || '',
        icon: 'ios',
      }
    }

    if (platform === 'Chrome OS') {
      return {
        name: 'ChromeOS',
        version: platformVersion || '',
        icon: 'chromeos',
      }
    }

    if (platform === 'Linux') {
      return { name: 'Linux', version: '', icon: 'linux' }
    }

    return null
  } catch {
    return null
  }
}
