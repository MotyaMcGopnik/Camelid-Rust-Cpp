import { compatibilityHintCopy, compatibilityHintLabel, findCompatibilityHint, isCompatibilitySupportedForModel, isGuardedLlamaEvaluationModel } from './capabilities.js'
import { isRunnableInCurrentRuntime } from './modelState.js'

export function getChatGateState(capabilities, model, runtime) {
  const runtimeReady = isRunnableInCurrentRuntime(model, runtime)
  const hint = findCompatibilityHint(capabilities, model)
  const contractSupported = isCompatibilitySupportedForModel(capabilities, model)
  const guardedLlamaEvaluation = Boolean(runtimeReady && !contractSupported && isGuardedLlamaEvaluationModel(capabilities, model))
  const chatUnlocked = Boolean(runtimeReady && (contractSupported || guardedLlamaEvaluation))
  const runtimeLoaded = Boolean(runtime?.loaded_now && runtime?.active_model_id === model?.id)
  const runtimeGenerationReady = Boolean(runtime?.generation_ready && runtime?.active_model_id === model?.id)
  const chatMode = contractSupported ? 'supported' : guardedLlamaEvaluation ? 'guarded_llama_evaluation' : 'blocked'

  return {
    hint,
    runtimeReady,
    runtimeLoaded,
    runtimeGenerationReady,
    contractSupported,
    guardedLlamaEvaluation,
    chatUnlocked,
    chatMode,
    label: compatibilityHintLabel(hint, 'No matching COMPATIBILITY.md row'),
    copy: compatibilityHintCopy(hint),
  }
}
