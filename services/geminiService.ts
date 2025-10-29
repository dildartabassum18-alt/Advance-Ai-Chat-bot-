import { GoogleGenAI, GenerateContentResponse, Modality, Content } from "@google/genai";
import { ChatMessage, MessageSender, ChatSettings, UploadedFile, SpeechRate, KnowledgeFile } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const textModel = 'gemini-2.5-flash';
const multimodalModel = 'gemini-2.5-flash';
const ttsModel = 'gemini-2.5-flash-preview-tts';
const MAX_KNOWLEDGE_LENGTH = 150000; // Set a safe character limit for the context

const speechRateMapping: { [key in SpeechRate]: number } = {
    slow: 0.8,
    medium: 1.0,
    fast: 1.2,
};

export async function generateResponse(
    history: ChatMessage[], 
    prompt: string, 
    settings: ChatSettings,
    attachments?: UploadedFile[],
    knowledgeFiles?: KnowledgeFile[]
): Promise<string> {
    try {
        let systemInstruction = `You are an AI assistant named ${settings.name}. Your personality is: ${settings.personality}. You are chatting with a user who might speak English or Urdu. Respond in the language of the user's last message.`;
        
        let wasContextTruncated = false;

        if (knowledgeFiles && knowledgeFiles.length > 0) {
            let knowledgeContext = knowledgeFiles.map(kf => `--- Document: ${kf.name} ---\n${kf.content}`).join('\n\n');
            
            if (knowledgeContext.length > MAX_KNOWLEDGE_LENGTH) {
                knowledgeContext = knowledgeContext.substring(0, MAX_KNOWLEDGE_LENGTH);
                wasContextTruncated = true;
                console.warn(`Knowledge base context was truncated to ${MAX_KNOWLEDGE_LENGTH} characters to fit within token limits.`);
            }
            
            // Append knowledge-based instructions and context to the system instruction for better separation of concerns.
            systemInstruction += `\n\nCRITICAL INSTRUCTIONS:\nYou will answer the user's question based *only* on the provided context from the documents below. When you use information from a document, you MUST cite the source document's name (e.g., "[Source: contract.pdf]"). If the information is not in the documents, you MUST state that you cannot answer from the given context. Do not use any external knowledge.\n\n### CONTEXT FROM DOCUMENTS ###\n${knowledgeContext}`;
        }
        
        const contents: Content[] = history.map(msg => ({
            role: msg.sender === MessageSender.USER ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const userParts: ({ text: string } | { inlineData: { data: string, mimeType: string } })[] = [{ text: prompt }];
        if (attachments && attachments.length > 0) {
            const attachmentParts = attachments.map(attachment => ({
                inlineData: {
                    data: attachment.base64,
                    mimeType: attachment.type,
                }
            }));
            userParts.unshift(...attachmentParts);
        }
        contents.push({ role: 'user', parts: userParts });

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: (attachments && attachments.length > 0) ? multimodalModel : textModel,
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        
        let responseText = response.text;

        if (wasContextTruncated) {
            responseText += "\n\n*(Note: The provided documents were too long and had to be partially used. The answer is based on the beginning of the content.)*";
        }
        
        return responseText;
    } catch (error) {
        console.error("Error generating response:", error);
        return "Sorry, I encountered an error while generating a response. Please check the console for details.";
    }
}


export async function generateSpeech(text: string, voice: 'Zephyr' | 'Kore', speechRate: SpeechRate): Promise<string | null> {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: ttsModel,
            contents: [{ parts: [{ text: text }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                  speechRate: speechRateMapping[speechRate],
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice },
                  },
              },
            },
          });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
// FIX: Added curly braces to the catch block to fix a syntax error.
        console.error("Error generating speech:", error);
        return null;
    }
}