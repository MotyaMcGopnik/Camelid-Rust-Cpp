import { compatibilityHintCopy, compatibilityHintLabel, findCompatibilityHint, isCompatibilitySupportedForModel } from './capabilities.js'
import { isRunnableInCurrentRuntime } from './modelState.js'

export function getChatGateState(capabilities, model, runtime) {
  const runtimeReady = isRunnableInCurrentRuntime(model, runtime)
  const hint = findCompatibilityHint(capabilities, model)
  const contractSupported = isCompatibilitySupportedForModel(capabilities, model)
  const chatUnlocked = Boolean(runtimeReady && contractSupported)
  const runtimeLoaded = Boolean(runtime?.loaded_now && runtime?.active_model_id === model?.id)
  const runtimeGenerationReady = Boolean(runtime?.generation_ready && runtime?.active_model_id === model?.id)

  return {
    hint,
    runtimeReady,
    runtimeLoaded,
    runtimeGenerationReady,
    contractSupported,
    chatUnlocked,
    label: compatibilityHintLabel(hint, 'No matching COMPATIBILITY.md row'),
    copy: compatibilityHintCopy(hint),
  }
}
