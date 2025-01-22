import { ChatOpenAI } from "@langchain/openai";
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { GeneratedCode } from '../types/index';
import { logger } from '../utils/logger';

export class AIService {
  private static readonly baseConfig = {
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "AI Code Builder"
      }
    },
    modelName: "google/gemini-2.0-flash-thinking-exp-1219:free",
    openAIApiKey: process.env.OPENROUTER_API_KEY || '',
    temperature: 0.7,
    maxRetries: 3,
    maxTokens: 4000
  };

  private static readonly models = {
    master: new ChatOpenAI({
      ...AIService.baseConfig,
      modelName: "google/gemini-2.0-flash-thinking-exp-1219:free",
    }),
    frontend: new ChatOpenAI({
      ...AIService.baseConfig,
      modelName: "google/gemini-2.0-flash-thinking-exp-1219:free",
    }),
    backend: new ChatOpenAI({
      ...AIService.baseConfig,
      modelName: "google/gemini-2.0-flash-thinking-exp-1219:free",
    })
  };

  private static readonly prompts = {
    master: new PromptTemplate({
      template: `Return ONLY a JSON object with file structure and tasks, no other text:
      {{
        "structure": {{
          "frontend": ["src/components/", "src/styles/", "src/assets/"],
          "backend": ["src/routes/", "src/controllers/", "src/models/"]
        }},
        "tasks": {{
          "frontend": ["task1", "task2"],
          "backend": ["task1", "task2"]
        }}
      }}

      Requirements: {prompt}`,
      inputVariables: ["prompt"]
    }),
    frontend: new PromptTemplate({
      template: `Return ONLY a JSON array of files with code, no other text:
      {{
        "files": [
          {{
            "path": "frontend/src/components/Header.tsx",
            "content": "actual code content"
          }},
          {{
            "path": "frontend/src/styles/header.css",
            "content": "actual code content"
          }}
        ]
      }}

      Requirements: {prompt}
      Tasks: {masterInstructions}`,
      inputVariables: ["prompt", "masterInstructions"]
    }),
    backend: new PromptTemplate({
      template: `Return ONLY a JSON array of files with code, no other text:
      {{
        "files": [
          {{
            "path": "backend/src/routes/index.ts",
            "content": "actual code content"
          }},
          {{
            "path": "backend/src/controllers/index.ts",
            "content": "actual code content"
          }}
        ]
      }}

      Requirements: {prompt}
      Tasks: {masterInstructions}`,
      inputVariables: ["prompt", "masterInstructions"]
    })
  };

  private static readonly outputParser = new StringOutputParser();

  private static readonly chains = {
    master: new LLMChain({
      llm: AIService.models.master,
      prompt: AIService.prompts.master,
      outputParser: AIService.outputParser,
      verbose: true
    }),
    frontend: new LLMChain({
      llm: AIService.models.frontend,
      prompt: AIService.prompts.frontend,
      outputParser: AIService.outputParser,
      verbose: true
    }),
    backend: new LLMChain({
      llm: AIService.models.backend,
      prompt: AIService.prompts.backend,
      outputParser: AIService.outputParser,
      verbose: true
    })
  };

  private static cleanJsonString(str: string): string {
    if (!str) {
      throw new Error('Empty response from LLM');
    }

    try {
      // First try to parse as is (in case it's already clean JSON)
      JSON.parse(str);
      return str;
    } catch {
      // If that fails, try to extract JSON from the response
      
      // Try to find JSON between triple backticks
      const jsonMatch = str.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        return jsonMatch[1].trim();
      }

      // Try to find JSON between single backticks
      const singleTickMatch = str.match(/`\s*(\{[\s\S]*?\})\s*`/);
      if (singleTickMatch) {
        return singleTickMatch[1].trim();
      }

      // If no backticks, try to find the last occurrence of a JSON-like structure
      const jsonStart = str.lastIndexOf('{');
      const jsonEnd = str.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        return str.slice(jsonStart, jsonEnd + 1).trim();
      }

      throw new Error('No valid JSON found in response');
    }
  }

  private static safeJsonParse(str: string): any {
    try {
      const parsed = JSON.parse(str);
      
      // Validate the expected structure
      if (parsed.files && !Array.isArray(parsed.files)) {
        throw new Error('Files must be an array');
      }
      
      if (parsed.structure && typeof parsed.structure !== 'object') {
        throw new Error('Structure must be an object');
      }
      
      return parsed;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during JSON parsing';
      logger.error('JSON Parse Error:', {
        input: str,
        error: errorMessage
      });
      throw new Error(`Invalid JSON response from AI: ${errorMessage}`);
    }
  }

  private static async getChainResponse(chain: LLMChain, input: Record<string, any>): Promise<any> {
    try {
      const result = await chain.invoke(input);
      
      let content = '';
      
      if (typeof result === 'string') {
        content = result;
      } else if (result && typeof result === 'object') {
        if ('text' in result) {
          content = result.text;
        } else if ('response' in result) {
          content = result.response;
        } else if ('output' in result) {
          content = result.output;
        } else if ('generations' in result && Array.isArray(result.generations)) {
          const generations = result.generations;
          if (generations.length > 0) {
            const firstGen = generations[0];
            if (Array.isArray(firstGen) && firstGen.length > 0) {
              const message = firstGen[0];
              if (message && typeof message === 'object') {
                if ('text' in message) {
                  content = message.text;
                } else if ('content' in message) {
                  content = message.content;
                } else if ('message' in message) {
                  if (typeof message.message === 'string') {
                    content = message.message;
                  } else if (message.message && 'content' in message.message) {
                    content = message.message.content;
                  }
                }
              }
            }
          }
        }
      }

      if (!content) {
        logger.error('Empty or invalid response from chain:', { result });
        throw new Error('Empty or invalid response from LLM chain');
      }

      const cleanedContent = this.cleanJsonString(content);
      return this.safeJsonParse(cleanedContent);
      
    } catch (error: any) {
      logger.error('Chain Response Error:', {
        input,
        error: error.message,
        stack: error.stack,
        result: error.result
      });
      throw new Error(`Failed to get response from AI: ${error.message}`);
    }
  }

  static async generateCode(prompt: string): Promise<GeneratedCode> {
    try {
      // Step 1: Get project structure and tasks
      logger.info('Getting project structure...');
      const masterPlan = await this.getChainResponse(this.chains.master, { prompt });

      // Step 2: Generate frontend and backend code in parallel
      logger.info('Generating code...');
      const [frontendFiles, backendFiles] = await Promise.all([
        this.getChainResponse(this.chains.frontend, { 
          prompt, 
          masterInstructions: masterPlan.tasks.frontend
        }),
        this.getChainResponse(this.chains.backend, { 
          prompt, 
          masterInstructions: masterPlan.tasks.backend
        })
      ]);

      return {
        structure: masterPlan.structure,
        files: {
          frontend: frontendFiles.files,
          backend: backendFiles.files
        }
      };

    } catch (error: any) {
      logger.error('AI Service Error:', {
        message: error.message,
        stack: error.stack,
        details: error.error || error
      });
      
      throw new Error(`Failed to generate code: ${error.message}`);
    }
  }
}