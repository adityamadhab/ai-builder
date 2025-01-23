import { ChatOpenAI } from "@langchain/openai";
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { GeneratedCode } from '../types/index';
import { logger } from '../utils/logger';

export class AIService {
  private static readonly baseConfig = {
    configuration: {
      baseURL: "https://api.groq.com/openai/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "AI Code Builder"
      }
    },
    modelName: "llama-3.3-70b-versatile",
    openAIApiKey: process.env.OPENROUTER_API_KEY || '',
    temperature: 0.7,
    maxRetries: 3,
    maxTokens: 4000
  };

  private static readonly models = {
    master: new ChatOpenAI({
      ...AIService.baseConfig,
      modelName: "llama-3.3-70b-versatile",
    }),
    frontend: new ChatOpenAI({
      ...AIService.baseConfig,
      modelName: "llama-3.3-70b-versatile",
    }),
    backend: new ChatOpenAI({
      ...AIService.baseConfig,
      modelName: "llama-3.3-70b-versatile",
    }),
    admin: new ChatOpenAI({
      ...AIService.baseConfig,
      modelName: "llama-3.3-70b-versatile",
    })
  };

  private static readonly prompts = {
    master: new PromptTemplate({
      template: `Return ONLY a JSON object with tasks, no other text. Use exactly these folder names: frontend, backend, admin. Follow modern industry standards:
      {{
        "tasks": {{
          "frontend": ["setup_vite_react", "implement_features", "setup_routing", "implement_state_management", "add_api_integration"],
          "backend": ["setup_express", "implement_api", "setup_database", "add_authentication", "add_validation"],
          "admin": ["setup_vite_react", "implement_dashboard", "setup_routing", "add_data_management", "add_authentication"]
        }}
      }}

      Requirements: {prompt}`,
      inputVariables: ["prompt"]
    }),
    frontend: new PromptTemplate({
      template: `Return ONLY a JSON array of files with JavaScript/JSX code (not TypeScript), no other text. Use Vite + React with modern best practices:
      - Use 'frontend' as root folder
      - Include package.json with all dependencies
      - Use React Router for routing
      - Use modern hooks and patterns
      - Include proper ESLint and Prettier config
      - Use proper folder structure (components, pages, hooks, utils, etc.)
      - Include proper .gitignore
      - Include README.md with setup instructions
      - IMPORTANT: All file content must be a string, even for JSON files like package.json (use JSON.stringify)
      {{
        "files": [
          {{
            "path": "frontend/package.json",
            "content": "{{\\"name\\":\\"frontend\\",\\"version\\":\\"1.0.0\\"}}"
          }},
          {{
            "path": "frontend/vite.config.js",
            "content": "import {{ defineConfig }} from 'vite';"
          }}
        ]
      }}

      Requirements: {prompt}
      Tasks: {masterInstructions}`,
      inputVariables: ["prompt", "masterInstructions"]
    }),
    backend: new PromptTemplate({
      template: `Return ONLY a JSON array of files with JavaScript code (not TypeScript), no other text. Use modern Node.js best practices:
      - Use 'backend' as root folder
      - Include package.json with all dependencies
      - Use Express with proper middleware setup
      - Include proper error handling
      - Use environment variables
      - Include input validation
      - Use proper security headers
      - Include rate limiting
      - Use proper logging
      - Include proper ESLint and Prettier config
      - Use proper folder structure (routes, controllers, models, middleware, etc.)
      - Include proper .gitignore
      - Include README.md with setup instructions
      - IMPORTANT: All file content must be a string, even for JSON files like package.json (use JSON.stringify)
      {{
        "files": [
          {{
            "path": "backend/package.json",
            "content": "{{\\"name\\":\\"backend\\",\\"version\\":\\"1.0.0\\"}}"
          }},
          {{
            "path": "backend/src/app.js",
            "content": "const express = require('express');"
          }}
        ]
      }}

      Requirements: {prompt}
      Tasks: {masterInstructions}`,
      inputVariables: ["prompt", "masterInstructions"]
    }),
    admin: new PromptTemplate({
      template: `Return ONLY a JSON array of files with JavaScript/JSX code (not TypeScript), no other text. Use Vite + React with modern best practices:
      - Use 'admin' as root folder
      - Include package.json with all dependencies
      - Use React Router for routing
      - Use modern hooks and patterns
      - Include proper ESLint and Prettier config
      - Use proper folder structure (components, pages, hooks, utils, etc.)
      - Include proper .gitignore
      - Include README.md with setup instructions
      - Include proper dashboard layout
      - Include data tables and charts
      - IMPORTANT: All file content must be a string, even for JSON files like package.json (use JSON.stringify)
      {{
        "files": [
          {{
            "path": "admin/package.json",
            "content": "{{\\"name\\":\\"admin\\",\\"version\\":\\"1.0.0\\"}}"
          }},
          {{
            "path": "admin/vite.config.js",
            "content": "import {{ defineConfig }} from 'vite';"
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
    }),
    admin: new LLMChain({
      llm: AIService.models.admin,
      prompt: AIService.prompts.admin,
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
      // If that fails, try to extract and clean JSON from the response
      
      // Remove markdown code blocks if present
      let cleanedStr = str.replace(/```json\s*|\s*```/g, '');
      
      // Find the first { or [ and last } or ]
      const firstBrace = cleanedStr.indexOf('{');
      const lastBrace = cleanedStr.lastIndexOf('}');
      const firstBracket = cleanedStr.indexOf('[');
      const lastBracket = cleanedStr.lastIndexOf(']');
      
      let start = -1;
      let end = -1;
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        start = firstBrace;
        end = lastBrace + 1;
      }
      
      if (firstBracket !== -1 && lastBracket !== -1) {
        if (start === -1 || firstBracket < start) {
          start = firstBracket;
          end = lastBracket + 1;
        }
      }
      
      if (start !== -1 && end !== -1) {
        cleanedStr = cleanedStr.slice(start, end);
        
        // Clean control characters and normalize whitespace
        cleanedStr = cleanedStr
          .replace(/[\n\r\t]/g, '')  // Remove newlines, carriage returns, and tabs
          .replace(/\s+/g, ' ')      // Normalize spaces
          .replace(/"\s+(\{|\[)/g, '"$1')  // Remove spaces after quotes before objects/arrays
          .replace(/(\}|\])\s+"/g, '$1"')  // Remove spaces before quotes after objects/arrays
          .trim();
        
        // Validate the cleaned content is valid JSON
        JSON.parse(cleanedStr);
        return cleanedStr;
      }

      throw new Error('No valid JSON found in response');
    }
  }

  private static safeJsonParse(str: string): any {
    try {
      const cleanedJson = this.cleanJsonString(str);
      const parsed = JSON.parse(cleanedJson);
      
      // Validate the expected structure - could be either tasks or files
      if (parsed.tasks) {
        // Validate tasks structure
        if (typeof parsed.tasks !== 'object') {
          throw new Error('Tasks must be an object');
        }
        if (!parsed.tasks.frontend || !Array.isArray(parsed.tasks.frontend)) {
          throw new Error('Frontend tasks must be an array');
        }
        if (!parsed.tasks.backend || !Array.isArray(parsed.tasks.backend)) {
          throw new Error('Backend tasks must be an array');
        }
        if (!parsed.tasks.admin || !Array.isArray(parsed.tasks.admin)) {
          throw new Error('Admin tasks must be an array');
        }
      } else if (parsed.files) {
        // Validate files structure
        if (!Array.isArray(parsed.files)) {
          throw new Error('Files must be an array');
        }
        // Validate each file has path and content
        for (const file of parsed.files) {
          if (!file.path || typeof file.path !== 'string') {
            throw new Error('Each file must have a valid path string');
          }
          if (!file.content || typeof file.content !== 'string') {
            throw new Error('Each file must have valid content string');
          }
        }
      } else {
        throw new Error('Response must contain either tasks or files');
      }
      
      return parsed;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during JSON parsing';
      logger.error('JSON Parse Error:', {
        input: str.substring(0, 1000), // Log only first 1000 chars to avoid huge logs
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
      // Step 1: Get project tasks
      logger.info('Getting project tasks...');
      const masterPlan = await this.getChainResponse(this.chains.master, { prompt });

      // Step 2: Generate frontend, backend, and admin code in parallel
      logger.info('Generating code...');
      const [frontendResponse, backendResponse, adminResponse] = await Promise.all([
        this.getChainResponse(this.chains.frontend, { 
          prompt, 
          masterInstructions: masterPlan.tasks.frontend
        }),
        this.getChainResponse(this.chains.backend, { 
          prompt, 
          masterInstructions: masterPlan.tasks.backend
        }),
        this.getChainResponse(this.chains.admin, { 
          prompt, 
          masterInstructions: masterPlan.tasks.admin
        })
      ]);

      // Step 3: Format the response according to GeneratedCode interface
      const generatedCode: GeneratedCode = {
        files: {
          frontend: Array.isArray(frontendResponse.files) ? frontendResponse.files : [],
          backend: Array.isArray(backendResponse.files) ? backendResponse.files : [],
          admin: Array.isArray(adminResponse.files) ? adminResponse.files : []
        }
      };

      return generatedCode;

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