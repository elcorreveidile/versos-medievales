'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Feather, Scroll } from 'lucide-react'

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

export default function MedievalPoetryGenerator() {
  const [request, setRequest] = useState<PoemRequest>({
    character: '',
    location: '',
    event: '',
    emotion: '',
    language: 'spanish'
  })
  const [poem, setPoem] = useState<GeneratedPoem | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)

  const generatePoem = async () => {
    if (!request.character || !request.location || !request.event || !request.emotion) {
      return
    }

    setIsGenerating(true)
    setPoem(null)
    
    try {
      const response = await fetch('/api/generate-poem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error('Failed to generate poem')
      }

      const data = await response.json()
      setPoem(data)
      
      // Trigger reveal animation
      setTimeout(() => setIsRevealing(true), 100)
    } catch (error) {
      console.error('Error generating poem:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const resetPoem = () => {
    setPoem(null)
    setIsRevealing(false)
  }

  return (
    <div className="min-h-screen parchment-texture relative overflow-hidden">
      {/* Parchment texture overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZmlsdGVyIGlkPSJub2lzZSIgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSI+CiAgICA8ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC45IiBudW1PY3RhdmVzPSI0IiBzZWVkPSI1Ii8+CiAgICA8ZmVDb2xvck1hdHJpeCB2YWx1ZXM9IjAgMCAwIDAgMC44MjMgMCAwIDAgMCAwLjY4NiAwIDAgMCAwIDAuNDEyIDAgMCAwIDAuMDUiLz4KICA8L2ZpbHRlcj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIi8+Cjwvc3ZnPg==')] bg-repeat"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Scroll className="w-8 h-8 text-amber-800" />
            <h1 className="text-5xl md:text-6xl font-serif text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>
              Generador de poesía medieval
            </h1>
            <Feather className="w-8 h-8 text-amber-800" />
          </div>
          <p className="text-xl text-amber-700 font-serif">
            Crea versos medievales auténticos con la sabiduría de los siglos
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card className="border-2 border-amber-200 bg-amber-50/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="border-b border-amber-200">
              <CardTitle className="text-2xl font-serif text-amber-900">
                Compón tu poema
              </CardTitle>
              <CardDescription className="text-amber-700">
                Elige los elementos de tu historia medieval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Language Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-amber-800">Idioma</label>
                <Select value={request.language} onValueChange={(value: 'english' | 'chinese' | 'spanish') => 
                  setRequest(prev => ({ ...prev, language: value }))
                }>
                  <SelectTrigger className="border-amber-300 bg-white/90">
                    <SelectValue placeholder="Elige tu idioma..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spanish">Español</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="chinese">中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Character Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-amber-800">Personaje</label>
                <Select value={request.character} onValueChange={(value) => 
                  setRequest(prev => ({ ...prev, character: value }))
                }>
                  <SelectTrigger className="border-amber-300 bg-white/90">
                    <SelectValue placeholder="Elige tu personaje..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="héroe">Héroe</SelectItem>
                    <SelectItem value="noble">Noble</SelectItem>
                    <SelectItem value="plebeyo">Plebeyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-amber-800">Lugar</label>
                <Select value={request.location} onValueChange={(value) => 
                  setRequest(prev => ({ ...prev, location: value }))
                }>
                  <SelectTrigger className="border-amber-300 bg-white/90">
                    <SelectValue placeholder="Elige tu escenario..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="castillo">Castillo</SelectItem>
                    <SelectItem value="bosque">Bosque</SelectItem>
                    <SelectItem value="aldea">Aldea</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Event Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-amber-800">Evento</label>
                <Select value={request.event} onValueChange={(value) => 
                  setRequest(prev => ({ ...prev, event: value }))
                }>
                  <SelectTrigger className="border-amber-300 bg-white/90">
                    <SelectValue placeholder="Elige tu evento..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="batalla">Batalla</SelectItem>
                    <SelectItem value="amor">Amor</SelectItem>
                    <SelectItem value="traición">Traición</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Emotion Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-amber-800">Emoción</label>
                <Select value={request.emotion} onValueChange={(value) => 
                  setRequest(prev => ({ ...prev, emotion: value }))
                }>
                  <SelectTrigger className="border-amber-300 bg-white/90">
                    <SelectValue placeholder="Elige tu emoción..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alegría">Alegría</SelectItem>
                    <SelectItem value="tristeza">Tristeza</SelectItem>
                    <SelectItem value="rabia">Rabia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={generatePoem}
                disabled={isGenerating || !request.character || !request.location || !request.event || !request.emotion}
                className="w-full bg-amber-800 hover:bg-amber-900 text-white font-serif text-lg py-3 transition-all duration-300"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando Verso...
                  </>
                ) : (
                  <>
                    <Feather className="mr-2 h-4 w-4 quill-animate" />
                    Generar Poema
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Poem Display */}
          <Card className="border-2 border-amber-200 bg-amber-50/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="border-b border-amber-200">
              <CardTitle className="text-2xl font-serif text-amber-900">
                Manuscrito iluminado
              </CardTitle>
              <CardDescription className="text-amber-700">
                Tu obra maestra medieval
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {poem ? (
                <div className={`space-y-6 transition-all duration-1000 ${isRevealing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  {/* Poem Title */}
                  <h2 className="text-3xl font-serif text-amber-900 text-center font-bold illuminated-glow" style={{ fontFamily: 'Georgia, serif' }}>
                    {poem.title}
                  </h2>
                  
                  {/* Poem Content with Illuminated Drop Cap */}
                  <div className={`bg-white/60 p-8 rounded-lg border border-amber-200 shadow-inner ${isRevealing ? 'scroll-unfold ink-bleed' : ''}`}>
                    <div 
                      className={`text-amber-900 leading-relaxed space-y-4 font-serif medieval-scrollbar ${poem.language === 'spanish' ? 'spanish-text' : ''}`}
                      style={{ 
                        fontFamily: 'Georgia, serif',
                        fontSize: poem.language === 'chinese' ? '1.25rem' : poem.language === 'spanish' ? '1.15rem' : '1.1rem',
                        lineHeight: poem.language === 'chinese' ? '2' : poem.language === 'spanish' ? '1.7' : '1.8',
                        maxHeight: '400px',
                        overflowY: 'auto'
                      }}
                    >
                      {poem.content.split('\n').map((line, index) => {
                        if (index === 0 && line.length > 0) {
                          // Create illuminated drop capital for first line
                          const firstLetter = line[0]
                          const restOfLine = line.slice(1)
                          
                          return (
                            <p key={index} className="flex items-start">
                              <span 
                                className="inline-block mr-2 text-6xl font-bold text-amber-800 leading-none illuminated-glow"
                                style={{
                                  fontFamily: 'Georgia, serif',
                                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                                  background: 'linear-gradient(135deg, #92400e, #78350f)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  backgroundClip: 'text'
                                }}
                              >
                                {firstLetter}
                              </span>
                              <span className="flex-1 pt-2">{restOfLine}</span>
                            </p>
                          )
                        }
                        return <p key={index}>{line}</p>
                      })}
                    </div>
                  </div>

                  {/* Reset Button */}
                  <Button 
                    onClick={resetPoem}
                    variant="outline"
                    className="w-full border-amber-300 text-amber-800 hover:bg-amber-100"
                  >
                    Componer Nuevo Verso
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-amber-600">
                  <Scroll className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-center font-serif text-lg">
                    Tu poema medieval aparecerá aquí<br />
                    una vez que elijas los elementos de tu relato
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Decorative vine elements */}
      <div className="absolute top-0 left-0 w-32 h-32 opacity-20 vine-decoration">
        <svg viewBox="0 0 100 100" className="w-full h-full text-amber-700">
          <path d="M10,50 Q30,30 50,50 T90,50" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="20" cy="45" r="3" fill="currentColor"/>
          <circle cx="50" cy="50" r="3" fill="currentColor"/>
          <circle cx="80" cy="45" r="3" fill="currentColor"/>
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32 opacity-20 rotate-180 vine-decoration">
        <svg viewBox="0 0 100 100" className="w-full h-full text-amber-700">
          <path d="M10,50 Q30,30 50,50 T90,50" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="20" cy="45" r="3" fill="currentColor"/>
          <circle cx="50" cy="50" r="3" fill="currentColor"/>
          <circle cx="80" cy="45" r="3" fill="currentColor"/>
        </svg>
      </div>
    </div>
  )
}