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
  };

  private static readonly models = {
    architect: new ChatOpenAI({
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
    }),
    reviewer: new ChatOpenAI({
      ...AIService.baseConfig,
      modelName: "google/gemini-2.0-flash-thinking-exp-1219:free",
    })
  };

  private static readonly prompts = {
    architect: new PromptTemplate({
      template: `You are the Software Architect. Your role is to:
      1. Analyze the requirements: {prompt}
      2. Plan the overall structure of the MERN stack application
      3. Define the key components and their interactions
      4. Delegate specific tasks to the frontend and backend teams
      
      Response must be valid JSON with this structure:
      {{
        "plan": {{
          "components": [],
          "dataFlow": [],
          "apis": []
        }},
        "tasks": {{
          "frontend": [],
          "backend": []
        }}
      }}`,
      inputVariables: ["prompt"]
    }),
    frontend: new PromptTemplate({
      template: `You are the Frontend Developer. Create React TypeScript components based on:
      Requirements: {prompt}
      Architecture Plan: {architectPlan}
      
      Response must be valid JSON array of files with this structure:
      {{
        "frontend": [
          {{
            "path": "string",
            "code": "string"
          }}
        ]
      }}`,
      inputVariables: ["prompt", "architectPlan"]
    }),
    backend: new PromptTemplate({
      template: `You are the Backend Developer. Create Express TypeScript backend based on:
      Requirements: {prompt}
      Architecture Plan: {architectPlan}
      
      Response must be valid JSON array of files with this structure:
      {{
        "backend": [
          {{
            "path": "string",
            "code": "string"
          }}
        ]
      }}`,
      inputVariables: ["prompt", "architectPlan"]
    }),
    reviewer: new PromptTemplate({
      template: `You are the Code Reviewer. Review and optimize the generated code:
      Requirements: {prompt}
      Frontend Code: {frontendCode}
      Backend Code: {backendCode}
      
      Response must be valid JSON with optimized code:
      {{
        "frontend": [{{ "path": "string", "code": "string" }}],
        "backend": [{{ "path": "string", "code": "string" }}],
        "adminPanel": [{{ "path": "string", "code": "string" }}]
      }}`,
      inputVariables: ["prompt", "frontendCode", "backendCode"]
    })
  };

  private static readonly outputParser = new StringOutputParser();

  private static readonly chains = {
    architect: new LLMChain({
      llm: AIService.models.architect,
      prompt: AIService.prompts.architect,
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
    }),
    reviewer: new LLMChain({
      llm: AIService.models.reviewer,
      prompt: AIService.prompts.reviewer,
      outputParser: AIService.outputParser,
      verbose: true
    })
  };

  private static cleanJsonString(str: string): string {
    // Remove markdown code blocks if present
    str = str.replace(/```(json|javascript|typescript)?\n/g, '');
    str = str.replace(/```\n?/g, '');
    
    // Remove any leading/trailing whitespace
    str = str.trim();
    
    // If the string starts with multiple newlines, remove them
    str = str.replace(/^\n+/, '');
    
    // If there are any trailing newlines before a closing brace, remove them
    str = str.replace(/\n+}/g, '}');
    
    return str;
  }

  private static safeJsonParse(str: string): any {
    try {
      return JSON.parse(str);
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
      
      if (typeof result === 'string') {
        const cleanedContent = this.cleanJsonString(result);
        return this.safeJsonParse(cleanedContent);
      }
      
      throw new Error('Unexpected response format from chain');
    } catch (error: any) {
      logger.error('Chain Response Error:', {
        input,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  static async generateCode(prompt: string): Promise<GeneratedCode> {
    try {
      // Step 1: Get architecture plan
      logger.info('Getting architecture plan...');
      const architectPlan = await this.getChainResponse(this.chains.architect, { prompt });

      // Step 2: Generate frontend and backend code in parallel
      logger.info('Generating frontend and backend code...');
      const [frontendCode, backendCode] = await Promise.all([
        this.getChainResponse(this.chains.frontend, { 
          prompt, 
          architectPlan: JSON.stringify(architectPlan, null, 2) 
        }),
        this.getChainResponse(this.chains.backend, { 
          prompt, 
          architectPlan: JSON.stringify(architectPlan, null, 2) 
        })
      ]);

      // Step 3: Review and optimize the code
      logger.info('Reviewing and optimizing code...');
      const finalCode = await this.getChainResponse(this.chains.reviewer, {
        prompt,
        frontendCode: JSON.stringify(frontendCode, null, 2),
        backendCode: JSON.stringify(backendCode, null, 2)
      });

      return finalCode;

    } catch (error: any) {
      logger.error('AI Service Error:', {
        message: error.message,
        stack: error.stack,
        details: error.error || error
      });
      
      throw new Error(error.message || 'Failed to generate code');
    }
  }
}