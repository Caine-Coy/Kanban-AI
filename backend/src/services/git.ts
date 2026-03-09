import simpleGit, { SimpleGit } from 'simple-git';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getSettings } from '../database/settings.js';

const execAsync = promisify(exec);

export interface TestResult {
  passed: boolean;
  output: string;
  duration: number;
}

export class GitService {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath?: string) {
    this.repoPath = repoPath || process.cwd();
    this.git = simpleGit(this.repoPath);
  }

  /**
   * Create a new branch from main/master
   */
  async createBranch(branchName: string): Promise<void> {
    const status = await this.git.status();
    
    // Ensure we're on main/master branch
    const mainBranch = await this.getMainBranch();
    if (status.current !== mainBranch) {
      await this.git.checkout(mainBranch);
    }

    // Pull latest changes
    const settings = getSettings();
    await this.git.pull(settings.gitRemote || 'origin', mainBranch);

    // Create and checkout new branch
    await this.git.checkout(['-b', branchName]);
  }

  /**
   * Get the main branch name (main or master)
   */
  private async getMainBranch(): Promise<string> {
    const branches = await this.git.branchLocal();
    if (branches.all.includes('main')) {
      return 'main';
    }
    if (branches.all.includes('master')) {
      return 'master';
    }
    return branches.current || 'main';
  }

  /**
   * Write a file to the repository
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const fullPath = path.join(this.repoPath, filePath);
    const dir = path.dirname(fullPath);

    // Create directory if it doesn't exist
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  /**
   * Commit all staged changes
   */
  async commitChanges(message: string): Promise<void> {
    await this.git.add('.');
    const status = await this.git.status();
    
    if (status.files.length > 0) {
      await this.git.commit(message);
    }
  }

  /**
   * Push the current branch to remote
   */
  async pushBranch(branchName?: string): Promise<void> {
    const settings = getSettings();
    const remote = settings.gitRemote || 'origin';
    
    const status = await this.git.status();
    const branch = branchName || status.current;

    if (!branch) {
      throw new Error('No current branch');
    }

    await this.git.push(remote, branch, ['--set-upstream']);
  }

  /**
   * Run tests in the repository
   */
  async runTests(command: string, timeout: number = 60000): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.repoPath,
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      const duration = Date.now() - startTime;
      const output = stderr ? `${stdout}\n${stderr}` : stdout;

      return {
        passed: true,
        output,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const output = error.stdout || error.stderr || error.message;

      return {
        passed: false,
        output,
        duration,
      };
    }
  }

  /**
   * Get repository structure (list of files)
   */
  async getRepoStructure(): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const structure: string[] = [];

    async function scanDir(dir: string, prefix = ''): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      // Filter out common ignored directories
      const filtered = entries.filter(
        (e) => !['node_modules', '.git', 'dist', 'build', 'coverage', '.qwen'].includes(e.name)
      );

      for (let i = 0; i < filtered.length; i++) {
        const entry = filtered[i];
        const isLast = i === filtered.length - 1;
        const connector = isLast ? '└── ' : '├── ';

        if (entry.isDirectory()) {
          structure.push(`${prefix}${connector}${entry.name}/`);
          await scanDir(
            path.join(dir, entry.name),
            prefix + (isLast ? '    ' : '│   ')
          );
        } else {
          structure.push(`${prefix}${connector}${entry.name}`);
        }
      }
    }

    await scanDir(this.repoPath);
    return structure.join('\n');
  }

  /**
   * Create a pull request via GitHub API
   */
  async createPullRequest(
    branch: string,
    base: string,
    title: string,
    body: string
  ): Promise<string> {
    const settings = getSettings();

    if (!settings.githubToken || !settings.githubOwner || !settings.githubRepo) {
      throw new Error('GitHub settings not configured');
    }

    const response = await fetch(
      `https://api.github.com/repos/${settings.githubOwner}/${settings.githubRepo}/pulls`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${settings.githubToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          title,
          body,
          head: branch,
          base,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create PR: ${response.status} ${error}`);
    }

    const data = await response.json() as any;
    return data.html_url;
  }

  /**
   * Checkout a branch
   */
  async checkoutBranch(branchName: string): Promise<void> {
    await this.git.checkout(branchName);
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string> {
    const status = await this.git.status();
    return status.current || 'unknown';
  }
}
