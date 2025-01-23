import { GeneratedCode, CodeFile } from '../types/index';

export class CodeParser {
  static sanitizeCode(rawCode: GeneratedCode): GeneratedCode {
    return {
      files: {
        frontend: this.processFiles(rawCode.files.frontend),
        backend: this.processFiles(rawCode.files.backend),
        admin: this.processFiles(rawCode.files.admin)
      }
    };
  }

  private static processFiles(files: CodeFile[]): CodeFile[] {
    return files.map(file => ({
      path: this.sanitizePath(file.path),
      content: this.cleanCode(file.content)
    }));
  }

  private static sanitizePath(path: string): string {
    return path.replace(/\.\.\//g, '').replace(/\/\/+/g, '/');
  }

  private static cleanCode(code: string): string {
    return code.replace(/process\.env\..*?/g, '')
               .replace(/API_KEYS\s*=\s*.*/g, '');
  }
}