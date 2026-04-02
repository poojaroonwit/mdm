import packageInfo from '../../package.json'

// Version information from package.json
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || packageInfo.version

