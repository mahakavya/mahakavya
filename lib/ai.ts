export async function generateText(opts: { model: any; system?: string; prompt?: string }) {
  // simple stub: return the prompt back in a 'text' field
  return { text: opts.prompt || JSON.stringify({ result: 'stub' }) }
}

export default { generateText }
