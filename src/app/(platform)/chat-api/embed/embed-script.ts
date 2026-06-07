import { buildEmbedScriptBootstrap } from './embed-script-bootstrap'
import { buildEmbedPopoverBehaviorScript } from './embed-script-popover-behavior'
import { buildEmbedPopoverSetupScript } from './embed-script-popover-setup'

interface BuildEmbedScriptArgs {
  chatbot: any
  chatbotId: string
  closeIconSvg: string
  iconSvg: string
  serverOrigin: string
  type: string
}

export function buildEmbedScript(args: BuildEmbedScriptArgs) {
  return [
    buildEmbedScriptBootstrap(args),
    buildEmbedPopoverSetupScript(),
    buildEmbedPopoverBehaviorScript(),
    '})();'
  ].join('')
}
