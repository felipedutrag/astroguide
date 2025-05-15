import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content, BlockReason } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { person1, person2, result1, result2, userQuestion, chatHistory: previousChatHistory } = await req.json();

    if ((!previousChatHistory || previousChatHistory.length === 0) && (!person1 || !person2 || !result1 || !result2)) {
      return NextResponse.json({ error: 'Dados de sinastria completos são necessários para iniciar uma nova conversa.' }, { status: 400 });
    }
    
    if (previousChatHistory && previousChatHistory.length > 0 && !userQuestion) {
        return NextResponse.json({ error: 'A pergunta do usuário é obrigatória para mensagens de acompanhamento.' }, { status: 400 });
    }

    function formatPlanets(name: string, result: any) {
      if (!result?.output) return '';
      return (result.output as any[]).map((item: any) =>
        `Planeta: ${item.planet?.en}, Signo: ${item.zodiac_sign?.name?.en}, Grau: ${item.normDegree?.toFixed(2)}, Retrógrado: ${String(item.isRetro).toLowerCase() === 'true' ? 'Sim' : 'Não'}`
      ).join('\n');
    }

    let currentContents: Content[];

    if (!previousChatHistory || previousChatHistory.length === 0) {
      const initialSystemContext = `Você é um astrólogo profissional. Sua tarefa é realizar uma análise astrológica comparativa (sinastria) entre duas pessoas. A análise deve ser baseada *exclusivamente* nas posições dos planetas em seus respectivos signos zodiacais, conforme os dados do mapa natal fornecidos para cada indivíduo. Concentre-se em como as energias planetárias, expressas através dos signos, interagem entre as duas pessoas.`;
      
      const sinastriaDetails = `Dados para Análise de Sinastria (foco: Planetas nos Signos):\n\nPessoa 1: Nome: ${person1.name}, Data de Nascimento: ${person1.birthDate}, Hora: ${person1.birthTime}, Cidade: ${person1.birthPlace}.\nPlanetas no Mapa Natal de ${person1.name}:\n${formatPlanets(person1.name, result1)}\n\nPessoa 2: Nome: ${person2.name}, Data de Nascimento: ${person2.birthDate}, Hora: ${person2.birthTime}, Cidade: ${person2.birthPlace}.\nPlanetas no Mapa Natal de ${person2.name}:\n${formatPlanets(person2.name, result2)}\n\nCom base *apenas* nestas informações de planetas e signos, responda à pergunta do usuário ou realize a análise solicitada. Descreva as dinâmicas de compatibilidade e os possíveis desafios que surgem da interação dessas configurações planetárias e zodiacais. Seja detalhado e didático em sua explicação.`;

      const firstUserQuestion = userQuestion || 'Faça uma análise geral e detalhada da sinastria entre estas duas pessoas, focando na interação dos planetas em seus signos.';
      
      currentContents = [
        { 
          role: "user", 
          parts: [{ text: `${initialSystemContext}\n\n${sinastriaDetails}\n\nPergunta do usuário: ${firstUserQuestion}` }]
        }
      ];
    } else {
      currentContents = [
        ...previousChatHistory,
        { role: "user", parts: [{ text: userQuestion }] }
      ];
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key for Gemini not configured. Please set GEMINI_API_KEY environment variable.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    const result = await model.generateContent({
      contents: currentContents,
      generationConfig,
      safetySettings,
    });

    const geminiApiResponse = result.response;

    if (!geminiApiResponse || !geminiApiResponse.candidates || geminiApiResponse.candidates.length === 0 || 
        !geminiApiResponse.candidates[0].content || !geminiApiResponse.candidates[0].content.parts || 
        geminiApiResponse.candidates[0].content.parts.length === 0) {
        
        let blockReasonResponse: BlockReason | undefined = geminiApiResponse?.promptFeedback?.blockReason;
        let safetyRatingsMessage = "Nenhuma classificação de segurança detalhada disponível.";

        if (geminiApiResponse?.candidates?.[0]?.finishReason === "SAFETY") {
            blockReasonResponse = BlockReason.SAFETY; // Assign enum member
            if (geminiApiResponse.candidates[0].safetyRatings) {
                safetyRatingsMessage = geminiApiResponse.candidates[0].safetyRatings.map(r => `${r.category}: ${r.probability}`).join(', ');
            }
        } else if (geminiApiResponse?.promptFeedback?.safetyRatings) {
            safetyRatingsMessage = geminiApiResponse.promptFeedback.safetyRatings.map(r => `${r.category}: ${r.probability}`).join(', ');
        }

        console.error("Gemini response blocked or empty. Reason:", blockReasonResponse, "Detailed Safety Ratings:", safetyRatingsMessage);
        return NextResponse.json({ 
            error: 'A resposta da IA foi bloqueada ou está vazia.', 
            details: `Motivo do bloqueio: ${blockReasonResponse || 'Não especificado'}. Classificações de segurança: ${safetyRatingsMessage}` 
        }, { status: 500 });
    }
    
    const responseText = geminiApiResponse.text();
    const newHistoryForClient = [...currentContents, { role: "model", parts: [{ text: responseText }] }];

    return NextResponse.json({ response: responseText, chatHistory: newHistoryForClient, geminiRaw: geminiApiResponse });

  } catch (err: any) {
    console.error("Error in Gemini API route:", err); 
    let errorMessage = 'Erro interno do servidor.';
    let errorDetails = err?.message || String(err);

    if (err.message && err.message.includes('API key not valid')) {
        errorMessage = 'Chave da API Gemini inválida.';
        errorDetails = 'Verifique se a chave da API GEMINI_API_KEY está configurada corretamente no ambiente.';
    } else if (err.message && (err.message.includes('fetch_error') || err.message.includes('ENOTFOUND') || err.message.includes('EAI_AGAIN'))) {
        errorMessage = 'Erro de conexão com a API Gemini.';
        errorDetails = 'Não foi possível conectar ao serviço Gemini. Verifique sua conexão com a internet ou o status do serviço.';
    } else if (err.message && err.message.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = 'Cota da API Gemini excedida.';
        errorDetails = 'Você atingiu o limite de requisições. Tente novamente mais tarde.';
    } else if (err.message && err.message.includes('Permission denied')) {
        errorMessage = 'Permissão negada pela API Gemini.';
        errorDetails = 'A chave da API pode não ter as permissões necessárias ou o modelo solicitado não está acessível.';
    }


    return NextResponse.json({ error: errorMessage, details: errorDetails }, { status: 503 });
  }
}
