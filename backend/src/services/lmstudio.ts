import type { Ticket } from 'shared';

interface CodeChange {
  path: string;
  content: string;
  action: 'create' | 'modify' | 'delete';
}

interface GenerationResult {
  changes: CodeChange[];
  commitMessage?: string;
  explanation?: string;
}

export class LMStudioService {
  private baseUrl: string;
  private model: string;
  private openRouterUrl: string;
  private openRouterKey?: string;
  private openRouterModel: string;
  private useOpenRouter: boolean;

  constructor(
    baseUrl: string,
    model: string,
    openRouterUrl?: string,
    openRouterKey?: string,
    openRouterModel?: string,
    useOpenRouter?: boolean
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
    this.openRouterUrl = openRouterUrl || 'https://openrouter.ai/api/v1';
    this.openRouterKey = openRouterKey;
    this.openRouterModel = openRouterModel || 'google/gemma-3-1b-itb-freetrial:free';
    this.useOpenRouter = useOpenRouter || false;
  }

  async generateCode(ticket: Ticket, context: string): Promise<GenerationResult> {
    if (this.useOpenRouter && this.openRouterKey) {
      return this.generateCodeOpenRouter(ticket, context);
    }
    return this.generateCodeLMStudio(ticket, context);
  }

  private async generateCodeOpenRouter(ticket: Ticket, context: string): Promise<GenerationResult> {
    const systemPrompt = `You are an expert software developer AI agent. Your task is to implement features based on ticket requirements.

Guidelines:
- Write clean, well-structured, and maintainable code
- Follow best practices and design patterns
- Include appropriate error handling
- Write unit tests for new functionality
- Follow existing code conventions
- Make minimal, focused changes to address the ticket
- Always include tests when adding new functionality

When you make changes, format your response as JSON with this structure:
{
  "changes": [
    {
      "path": "relative/path/to/file.ts",
      "content": "full file content here",
      "action": "create"
    }
  ],
  "commitMessage": "A concise conventional commit message",
  "explanation": "Brief explanation of what was implemented"
}

If you need to modify existing files, provide the COMPLETE new content.`;

    const userPrompt = `${context}

## Your Task:
Implement the feature described in the ticket.

**Title:** ${ticket.title}
**Description:** ${ticket.description}
${ticket.requirements ? `**Requirements:** ${ticket.requirements}` : ''}

Provide your implementation as JSON with file changes.`;

    try {
      const response = await fetch(`${this.openRouterUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openRouterKey}`,
          'HTTP-Referer': 'https://github.com/kanban-ai',
          'X-Title': 'Kanban-AI',
        },
        body: JSON.stringify({
          model: this.openRouterModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 8192,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
      }

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in response');
      }

      const result = JSON.parse(content) as GenerationResult;

      if (!result.changes || !Array.isArray(result.changes)) {
        throw new Error('Invalid response format: missing changes array');
      }

      return result;
    } catch (error) {
      console.error('OpenRouter generation failed:', error);
      throw error;
    }
  }

  private async generateCodeLMStudio(ticket: Ticket, context: string): Promise<GenerationResult> {
    const systemPrompt = `You are an expert software developer AI agent. Implement features based on ticket requirements.

Guidelines:
- Write clean, well-structured code
- Follow best practices
- Include error handling
- Write unit tests
- Always include tests when adding functionality

Format response as JSON:
{
  "changes": [{"path": "file.ts", "content": "full content", "action": "create"}],
  "commitMessage": "commit message",
  "explanation": "explanation"
}`;

    const userPrompt = `${context}

**Title:** ${ticket.title}
**Description:** ${ticket.description}
${ticket.requirements ? `**Requirements:** ${ticket.requirements}` : ''}

Provide implementation as JSON.`;

    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 8192,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LM Studio API error: ${response.status} ${errorText}`);
      }

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content;

      if (!content) throw new Error('No content in response');

      const result = JSON.parse(content) as GenerationResult;

      if (!result.changes || !Array.isArray(result.changes)) {
        throw new Error('Invalid response format');
      }

      return result;
    } catch (error) {
      console.error('LM Studio generation failed:', error);
      throw error;
    }
  }

  async testConnection(): Promise<{ connected: boolean; service: string }> {
    if (this.useOpenRouter && this.openRouterKey) {
      try {
        const response = await fetch(`${this.openRouterUrl}/models`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${this.openRouterKey}` },
        });
        return { connected: response.ok, service: 'OpenRouter' };
      } catch {
        return { connected: false, service: 'OpenRouter' };
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, { method: 'GET' });
      return { connected: response.ok, service: 'LM Studio' };
    } catch {
      return { connected: false, service: 'LM Studio' };
    }
  }
}
