import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const getCompletion = async (
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options: { model?: string; temperature?: number } = {}
) => {
  const { model = 'gpt-4', temperature = 0.7 } = options

  const completion = await openai.chat.completions.create({
    model,
    messages,
    temperature,
  })

  return completion.choices[0].message.content
} 