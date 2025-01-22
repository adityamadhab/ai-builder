import { GeneratedCode, CodeFile } from '../types/index';

export class CodeParser {
  static sanitizeCode(rawCode: GeneratedCode): GeneratedCode {
    return {
      frontend: this.processFiles(rawCode.frontend),
      backend: this.processFiles(rawCode.backend),
      adminPanel: this.processFiles(rawCode.adminPanel)
    };
  }

  private static processFiles(files: CodeFile[]): CodeFile[] {
    return files.map(file => ({
      path: this.sanitizePath(file.path),
      code: this.cleanCode(file.code)
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