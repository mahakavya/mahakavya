export function openai(modelName: string) {
  return modelName || 'gpt-stub'
}

export default { openai }
