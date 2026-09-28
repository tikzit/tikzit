/**
 * Pure TypeScript Lexer for TikZiT PGF/TikZ Subset
 * 
 * Tokenizes \begin{tikzpicture}, \node, \draw, \path, \tikzstyle,
 * coordinates (x, y), node refs (name.anchor), properties [...],
 * and balanced braced strings {...}.
 */

import type { Point2D, GraphElementProperty } from '../domain/types';

export interface TokenLocation {
  line: number;
  column: number;
}

export type TokenType =
  | 'BEGIN_TIKZPICTURE' // \\begin{tikzpicture}
  | 'END_TIKZPICTURE'   // \\end{tikzpicture}
  | 'TIKZSTYLE'         // \\tikzstyle
  | 'BEGIN_PGFONLAYER'  // \\begin{pgfonlayer}
  | 'END_PGFONLAYER'    // \\end{pgfonlayer}
  | 'NODE_CMD'          // \\node
  | 'DRAW_CMD'          // \\draw
  | 'PATH_CMD'          // \\path
  | 'RECTANGLE'         // rectangle
  | 'NODE_KEYWORD'      // node (inline edge label keyword)
  | 'AT'                // at
  | 'TO'                // to
  | 'CYCLE'             // cycle
  | 'COORD'             // (x, y) -> Point2D
  | 'REF'               // (name) or (name.anchor) -> { name: string; anchor?: string }
  | 'EMPTY_PARENS'      // ()
  | 'BRACKETS'          // [...] -> GraphElementProperty[]
  | 'BRACED_STRING'     // {...} -> inner string
  | 'EQUALS'            // =
  | 'SEMICOLON'         // ;
  | 'EOF';

export interface Token {
  type: TokenType;
  value: any;
  raw: string;
  loc: TokenLocation;
}

export class LexerError extends Error {
  public line: number;
  public column: number;

  constructor(message: string, line: number, column: number) {
    super(`[Lexer error at line ${line}, col ${column}]: ${message}`);
    this.name = 'LexerError';
    this.line = line;
    this.column = column;
  }
}

export class TikzLexer {
  private input: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(input: string) {
    this.input = input;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];
    while (!this.isEOF()) {
      this.skipWhitespaceAndComments();
      if (this.isEOF()) break;

      const loc = { line: this.line, column: this.column };
      const ch = this.peek();

      // Semicolon
      if (ch === ';') {
        this.advance();
        tokens.push({ type: 'SEMICOLON', value: ';', raw: ';', loc });
        continue;
      }

      // Equals sign
      if (ch === '=') {
        this.advance();
        tokens.push({ type: 'EQUALS', value: '=', raw: '=', loc });
        continue;
      }

      // Braced string {...}
      if (ch === '{') {
        const str = this.readBracedString();
        tokens.push({ type: 'BRACED_STRING', value: str, raw: `{${str}}`, loc });
        continue;
      }

      // Bracketed properties [...]
      if (ch === '[') {
        const props = this.readBracketedProperties();
        tokens.push({ type: 'BRACKETS', value: props, raw: '[]', loc });
        continue;
      }

      // Parentheses: Coordinate (x, y), Node Reference (node.anchor), or Empty Parens ()
      if (ch === '(') {
        const token = this.readParenthesized();
        tokens.push(token);
        continue;
      }

      // Backslash commands
      if (ch === '\\') {
        const cmdLoc = { ...loc };
        const cmd = this.readBackslashCommand();

        if (cmd === '\\begin{tikzpicture}') {
          tokens.push({ type: 'BEGIN_TIKZPICTURE', value: cmd, raw: cmd, loc: cmdLoc });
        } else if (cmd === '\\end{tikzpicture}') {
          tokens.push({ type: 'END_TIKZPICTURE', value: cmd, raw: cmd, loc: cmdLoc });
        } else if (cmd === '\\begin{pgfonlayer}') {
          tokens.push({ type: 'BEGIN_PGFONLAYER', value: cmd, raw: cmd, loc: cmdLoc });
        } else if (cmd === '\\end{pgfonlayer}') {
          tokens.push({ type: 'END_PGFONLAYER', value: cmd, raw: cmd, loc: cmdLoc });
        } else if (cmd === '\\tikzstyle') {
          tokens.push({ type: 'TIKZSTYLE', value: cmd, raw: cmd, loc: cmdLoc });
        } else if (cmd === '\\node') {
          tokens.push({ type: 'NODE_CMD', value: cmd, raw: cmd, loc: cmdLoc });
        } else if (cmd === '\\draw') {
          tokens.push({ type: 'DRAW_CMD', value: cmd, raw: cmd, loc: cmdLoc });
        } else if (cmd === '\\path') {
          tokens.push({ type: 'PATH_CMD', value: cmd, raw: cmd, loc: cmdLoc });
        } else {
          throw new LexerError(`Unsupported command "${cmd}"`, cmdLoc.line, cmdLoc.column);
        }
        continue;
      }

      // Word / Keywords (at, to, node, rectangle, cycle)
      if (/[a-zA-Z]/.test(ch)) {
        const word = this.readWord();
        if (word === 'at') {
          tokens.push({ type: 'AT', value: 'at', raw: 'at', loc });
        } else if (word === 'to') {
          tokens.push({ type: 'TO', value: 'to', raw: 'to', loc });
        } else if (word === 'node') {
          tokens.push({ type: 'NODE_KEYWORD', value: 'node', raw: 'node', loc });
        } else if (word === 'rectangle') {
          tokens.push({ type: 'RECTANGLE', value: 'rectangle', raw: 'rectangle', loc });
        } else if (word === 'cycle') {
          tokens.push({ type: 'CYCLE', value: 'cycle', raw: 'cycle', loc });
        } else {
          throw new LexerError(`Unexpected keyword or identifier "${word}"`, loc.line, loc.column);
        }
        continue;
      }

      // Unexpected character
      throw new LexerError(`Unexpected character '${ch}'`, loc.line, loc.column);
    }

    tokens.push({
      type: 'EOF',
      value: null,
      raw: '',
      loc: { line: this.line, column: this.column },
    });

    return tokens;
  }

  private isEOF(): boolean {
    return this.pos >= this.input.length;
  }

  private peek(): string {
    return this.input[this.pos];
  }

  private advance(): string {
    const ch = this.input[this.pos++];
    if (ch === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return ch;
  }

  private skipWhitespaceAndComments(): void {
    while (!this.isEOF()) {
      const ch = this.peek();
      if (/\s/.test(ch)) {
        this.advance();
      } else if (ch === '%') {
        // Line comment: skip until newline
        while (!this.isEOF() && this.peek() !== '\n') {
          this.advance();
        }
      } else {
        break;
      }
    }
  }

  private readWord(): string {
    let word = '';
    while (!this.isEOF() && /[a-zA-Z0-9_-]/.test(this.peek())) {
      word += this.advance();
    }
    return word;
  }

  private readBackslashCommand(): string {
    let cmd = this.advance(); // consume '\\'
    while (!this.isEOF() && /[a-zA-Z]/.test(this.peek())) {
      cmd += this.advance();
    }

    // Check for optional immediately attached {argument} only for \\begin and \\end commands
    if (cmd === '\\begin' || cmd === '\\end') {
      this.skipWhitespaceAndComments();
      if (!this.isEOF() && this.peek() === '{') {
        const arg = this.readBracedString();
        return `${cmd}{${arg}}`;
      }
    }

    return cmd;
  }

  private readBracedString(): string {
    const startLoc = { line: this.line, column: this.column };
    this.advance(); // consume '{'
    let content = '';
    let depth = 1;
    let escape = false;

    while (!this.isEOF()) {
      const ch = this.advance();
      if (escape) {
        content += ch;
        escape = false;
        continue;
      }

      if (ch === '\\') {
        escape = true;
        content += ch;
      } else if (ch === '{') {
        depth++;
        content += ch;
      } else if (ch === '}') {
        depth--;
        if (depth === 0) {
          return content;
        }
        content += ch;
      } else {
        content += ch;
      }
    }

    throw new LexerError('Unclosed delimited brace string {...}', startLoc.line, startLoc.column);
  }

  private readBracketedProperties(): GraphElementProperty[] {
    const startLoc = { line: this.line, column: this.column };
    this.advance(); // consume '['
    const properties: GraphElementProperty[] = [];
    let currentKey = '';
    let currentValue = '';
    let hasEquals = false;
    let insideBraces = 0;
    let escape = false;

    const commitProperty = () => {
      let trimmedKey = currentKey.trim();
      if (trimmedKey.length > 0) {
        if (trimmedKey.startsWith('{') && trimmedKey.endsWith('}') && trimmedKey.length >= 2) {
          trimmedKey = trimmedKey.slice(1, -1);
        }
        if (hasEquals) {
          let trimmedVal = currentValue.trim();
          // If value is wrapped in redundant outer braces, unwrap once: {val} -> val
          if (trimmedVal.startsWith('{') && trimmedVal.endsWith('}') && trimmedVal.length >= 2) {
            trimmedVal = trimmedVal.slice(1, -1);
          }
          properties.push({ key: trimmedKey, value: trimmedVal });
        } else {
          properties.push({ key: trimmedKey });
        }
      }
      currentKey = '';
      currentValue = '';
      hasEquals = false;
    };

    while (!this.isEOF()) {
      const ch = this.peek();

      // Comment inside brackets
      if (ch === '%' && insideBraces === 0) {
        while (!this.isEOF() && this.peek() !== '\n') {
          this.advance();
        }
        continue;
      }

      if (escape) {
        if (hasEquals) currentValue += ch;
        else currentKey += ch;
        this.advance();
        escape = false;
        continue;
      }

      if (ch === '\\') {
        escape = true;
        if (hasEquals) currentValue += ch;
        else currentKey += ch;
        this.advance();
        continue;
      }

      if (ch === '{') {
        insideBraces++;
        if (hasEquals) currentValue += ch;
        else currentKey += ch;
        this.advance();
        continue;
      }

      if (ch === '}') {
        if (insideBraces > 0) insideBraces--;
        if (hasEquals) currentValue += ch;
        else currentKey += ch;
        this.advance();
        continue;
      }

      if (insideBraces === 0) {
        if (ch === ']') {
          this.advance();
          commitProperty();
          return properties;
        }

        if (ch === ',') {
          this.advance();
          commitProperty();
          continue;
        }

        if (ch === '=' && !hasEquals) {
          this.advance();
          hasEquals = true;
          continue;
        }
      }

      if (hasEquals) {
        currentValue += this.advance();
      } else {
        currentKey += this.advance();
      }
    }

    throw new LexerError('Unclosed property bracket [...]', startLoc.line, startLoc.column);
  }

  private readParenthesized(): Token {
    const loc = { line: this.line, column: this.column };
    this.advance(); // consume '('
    let inner = '';

    while (!this.isEOF() && this.peek() !== ')') {
      inner += this.advance();
    }

    if (this.isEOF()) {
      throw new LexerError('Unclosed parenthesis (...)', loc.line, loc.column);
    }
    this.advance(); // consume ')'

    const trimmed = inner.trim();

    // 1. Empty parens () -> self loop
    if (trimmed.length === 0) {
      return { type: 'EMPTY_PARENS', value: null, raw: '()', loc };
    }

    // 2. Coordinate (x, y)
    // Matches floating point numbers: 0, 1.5, -2.75, +3, 1e-4
    const coordMatch = trimmed.match(
      /^([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)$/
    );

    if (coordMatch) {
      const x = parseFloat(coordMatch[1]);
      const y = parseFloat(coordMatch[2]);
      return {
        type: 'COORD',
        value: { x, y } as Point2D,
        raw: `(${x}, ${y})`,
        loc,
      };
    }

    // 3. Node reference with optional anchor: (name) or (name.anchor)
    const dotIdx = trimmed.indexOf('.');
    if (dotIdx !== -1) {
      const name = trimmed.substring(0, dotIdx).trim();
      const anchor = trimmed.substring(dotIdx + 1).trim();
      return {
        type: 'REF',
        value: { name, anchor },
        raw: `(${name}.${anchor})`,
        loc,
      };
    }

    return {
      type: 'REF',
      value: { name: trimmed },
      raw: `(${trimmed})`,
      loc,
    };
  }
}

export function tokenizeTikz(input: string): Token[] {
  const lexer = new TikzLexer(input);
  return lexer.tokenize();
}
