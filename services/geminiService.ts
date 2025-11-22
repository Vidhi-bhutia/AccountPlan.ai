import { 
  GoogleGenAI, 
  Chat, 
  FunctionDeclaration, 
  Type, 
  Part,
  FunctionCall,
  GenerateContentResponse
} from "@google/genai";
import { AccountPlan } from "../types";

// Define the tool for updating the account plan
const updateAccountPlanTool: FunctionDeclaration = {
  name: 'updateAccountPlan',
  description: 'Create or update sections of the account plan. Use this when you have gathered enough information to structure a plan or when the user asks to modify specific parts.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      companyName: { 
        type: Type.STRING, 
        description: 'Name of the company being researched. If unknown, use "Target Company".' 
      },
      sections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: 'Unique ID for section (e.g., "exec_summary", "financials")' },
            title: { type: Type.STRING, description: 'Human readable title' },
            content: { type: Type.STRING, description: 'The Markdown content of the section.' }
          },
          required: ['id', 'title', 'content']
        },
        description: 'List of sections to add or update. If a section with the same ID exists, it will be overwritten.'
      }
    },
    required: ['sections']
  }
};

export class GeminiService {
  private ai: GoogleGenAI;
  public chatSession: Chat | null = null;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.API_KEY || '';
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  startChat() {
    this.chatSession = this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        tools: [
          { googleSearch: {} },
          { functionDeclarations: [updateAccountPlanTool] }
        ],
        systemInstruction: `You are an expert Strategic Account Planner and Research Assistant. 
        Your goal is to help users research companies and build comprehensive Account Plans.
        
        WORKFLOW:
        1. **Research**: When a user mentions a company, use 'googleSearch' to find latest news, financials, strategic goals, and challenges.
        2. **Synthesize**: Present your findings in the chat. Ask the user if they want to dig deeper into specific areas.
        3. **Plan Generation**: When the user is ready or asks for a plan, use the 'updateAccountPlan' tool to structure the data.
           A good account plan typically includes: 
           - Executive Summary
           - Company Overview (Size, Revenue, Industry)
           - Strategic Goals & Initiatives
           - Key Decision Makers
           - Pain Points/Challenges
           - Proposed Solution/Strategy
        4. **Refinement**: If the user wants to change a section, use 'updateAccountPlan' again with the updated content for that specific section ID.
        
        Tone: Professional, analytical, and proactive.
        Format: Use Markdown for chat responses.`
      }
    });
  }

  async sendMessage(
    message: string, 
    onPlanUpdate: (planData: Partial<AccountPlan>) => void
  ): Promise<{ text: string; sources?: { uri: string; title: string }[] }> {
    if (!this.chatSession) {
      this.startChat();
    }

    if (!this.chatSession) throw new Error("Chat session not initialized");

    try {
      // 1. Send the user's message
      let result = await this.chatSession.sendMessage({ message });
      
      let finalText = "";
      let aggregatedSources: { uri: string; title: string }[] = [];
      const MAX_LOOPS = 5; // Prevent infinite loops
      let loopCount = 0;

      // Helper to extract sources from a candidate
      const extractSources = (candidate: any) => {
        const chunks = candidate.groundingMetadata?.groundingChunks;
        if (chunks) {
          return chunks
            .map((chunk: any) => chunk.web?.uri ? { uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri } : null)
            .filter((s: any): s is { uri: string; title: string } => s !== null);
        }
        return [];
      };

      // 2. Process responses in a loop (Agentic loop)
      while (loopCount < MAX_LOOPS) {
        const candidates = result.candidates;
        
        if (!candidates || candidates.length === 0) {
          break;
        }

        const content = candidates[0].content;
        if (!content || !content.parts) {
          break;
        }

        // Collect text and sources from this turn
        const newSources = extractSources(candidates[0]);
        aggregatedSources = [...aggregatedSources, ...newSources];

        const parts = content.parts;
        const functionResponseParts: Part[] = [];
        let hasFunctionCall = false;

        for (const part of parts) {
          // Collect Text
          if (part.text) {
            finalText += part.text;
          }

          // Handle Function Calls
          if (part.functionCall) {
            hasFunctionCall = true;
            const call = part.functionCall;
            
            console.log(`[Agent] Calling tool: ${call.name}`);

            if (call.name === 'updateAccountPlan') {
              try {
                const args = call.args as unknown as Partial<AccountPlan>;
                // Execute the side effect (update UI)
                onPlanUpdate(args);

                // Construct the success response part
                const responsePart: Part = {
                  functionResponse: {
                    name: call.name,
                    response: { result: 'Account plan updated successfully.' },
                    // IMPORTANT: Pass back the ID if it exists to map the response to the call
                    ...(call.id ? { id: call.id } : {})
                  }
                };
                functionResponseParts.push(responsePart);

              } catch (e) {
                console.error("Error executing tool updateAccountPlan", e);
                const errorPart: Part = {
                    functionResponse: {
                        name: call.name,
                        response: { error: `Failed to update plan: ${e instanceof Error ? e.message : 'Unknown error'}` },
                        ...(call.id ? { id: call.id } : {})
                    }
                };
                functionResponseParts.push(errorPart);
              }
            } else {
               // Handle unknown function calls gracefully
               console.warn(`Unknown function called: ${call.name}`);
               functionResponseParts.push({
                   functionResponse: {
                       name: call.name,
                       response: { error: `Function ${call.name} not found.` },
                       ...(call.id ? { id: call.id } : {})
                   }
               });
            }
          }
        }

        // If there were function calls, send the results back to the model
        if (hasFunctionCall && functionResponseParts.length > 0) {
           // Continue the conversation with the function results
           result = await this.chatSession.sendMessage({
             message: functionResponseParts
           });
           loopCount++;
        } else {
          // No function calls, we are done with this turn
          break;
        }
      }

      return { text: finalText, sources: aggregatedSources };

    } catch (error) {
      console.error("Gemini API Error:", error);
      return { text: "I encountered an error while processing your request. Please try again." };
    }
  }
}
