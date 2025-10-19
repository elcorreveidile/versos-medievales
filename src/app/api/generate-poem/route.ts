import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

interface PoemRequest {
  character: string
  location: string
  event: string
  emotion: string
  language: 'english' | 'chinese' | 'spanish'
}

interface GeneratedPoem {
  title: string
  content: string
  language: 'english' | 'chinese' | 'spanish'
}

export async function POST(request: NextRequest) {
  try {
    const body: PoemRequest = await request.json()
    const { character, location, event, emotion, language } = body

    // Validate input
    if (!character || !location || !event || !emotion) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    // Create prompt based on language
    const prompt = language === 'chinese' 
      ? `请创作一首中世纪风格的中文古诗，基于以下元素：

角色：${character === 'hero' || character === 'héroe' ? '英雄' : character === 'noble' ? '贵族' : '平民'}
地点：${location === 'castle' || location === 'castillo' ? '城堡' : location === 'forest' || location === 'bosque' ? '森林' : '村庄'}
事件：${event === 'battle' || event === 'batalla' ? '战斗' : event === 'love' || event === 'amor' ? '爱情' : '背叛'}
情感：${emotion === 'joy' || emotion === 'alegría' ? '喜悦' : emotion === 'sorrow' || emotion === 'tristeza' ? '悲伤' : '愤怒'}

要求：
1. 使用古典中文诗歌风格（类似唐诗宋词）
2. 每节四行，采用交叉韵律
3. 使用古雅的词汇和表达
4. 体现中世纪的氛围和情感
5. 格式：先写标题，然后是诗歌内容
6. 诗歌长度：3-4节（12-16行）

请直接输出诗歌，不要包含其他解释文字。`
      : language === 'spanish'
      ? `Crea un poema medieval auténtico en español basado en estos elementos:

Personaje: ${character === 'hero' || character === 'héroe' ? 'Héroe' : character === 'noble' ? 'Noble' : 'Plebeyo'}
Lugar: ${location === 'castle' || location === 'castillo' ? 'Castillo' : location === 'forest' || location === 'bosque' ? 'Bosque' : 'Aldea'}
Evento: ${event === 'battle' || event === 'batalla' ? 'Batalla' : event === 'love' || event === 'amor' ? 'Amor' : 'Traición'}
Emoción: ${emotion === 'joy' || emotion === 'alegría' ? 'Alegría' : emotion === 'sorrow' || emotion === 'tristeza' ? 'Tristeza' : 'Rabia'}

Requisitos:
1. Usa el lenguaje poético español medieval y las convenciones de la época
2. Escribe en estrofas de 4 líneas con rima cruzada (patrón ABAB)
3. Incorpora imaginería y temas medievales españoles
4. Usa lenguaje elevado y formal apropiado para el período medieval
5. Formato: Primero el título, luego el contenido del poema
6. Longitud: 3-4 estrofas (12-16 líneas)
7. Evita términos modernos y anacrónicos
8. Puedes inspirarte en la tradición de los romanceros y la poesía del Siglo de Oro

Por favor, muestra solo el poema con título, sin comentarios adicionales.`
      : `Create an authentic medieval-style poem in English based on these elements:

Character: ${character === 'hero' || character === 'héroe' ? 'Hero' : character === 'noble' ? 'Noble' : 'Commoner'}
Location: ${location === 'castle' || location === 'castillo' ? 'Castle' : location === 'forest' || location === 'bosque' ? 'Forest' : 'Village'}
Event: ${event === 'battle' || event === 'batalla' ? 'Battle' : event === 'love' || event === 'amor' ? 'Love' : 'Treachery'}
Emotion: ${emotion === 'joy' || emotion === 'alegría' ? 'Joy' : emotion === 'sorrow' || emotion === 'tristeza' ? 'Sorrow' : 'Rage'}

Requirements:
1. Use archaic English diction and medieval poetic conventions
2. Write in 4-line stanzas with cross-rhyme (ABAB pattern)
3. Incorporate medieval imagery and themes
4. Use elevated, formal language suitable for the period
5. Format: Title first, then the poem content
6. Length: 3-4 stanzas (12-16 lines)
7. Avoid modernisms and anachronisms

Please output only the poem with title, no additional commentary.`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: language === 'chinese' 
            ? '你是一位精通中世纪文学的专业诗人，擅长创作具有古典韵味的中文古诗。'
            : language === 'spanish'
            ? 'Eres un poeta maestro especializado en literatura medieval española y composición versificada.'
            : 'You are a master poet specializing in medieval literature and verse composition.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content
    
    if (!response) {
      throw new Error('No response from AI')
    }

    // Parse the response to extract title and content
    const lines = response.trim().split('\n')
    let title = ''
    let content = ''

    if (lines.length > 0) {
      // First line is typically the title
      title = lines[0].trim()
      content = lines.slice(1).join('\n').trim()
    }

    const poem: GeneratedPoem = {
      title: title || 'Untitled Medieval Verse',
      content: content || response.trim(),
      language
    }

    return NextResponse.json(poem)

  } catch (error) {
    console.error('Error generating poem:', error)
    return NextResponse.json(
      { error: 'Failed to generate poem' },
      { status: 500 }
    )
  }
}