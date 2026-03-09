import { useState, useEffect } from 'react';
import type { Settings } from 'shared';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (settings: Partial<Settings>) => Promise<void>;
}

export function SettingsModal({ isOpen, onClose, settings, onUpdateSettings }: SettingsModalProps) {
  const [formData, setFormData] = useState<Partial<Settings>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ connected: boolean; service: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(settings || {});
      setTestResult(null);
    }
  }, [isOpen, settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings(formData);
    onClose();
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/settings/test-lmstudio');
      const data = await res.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ connected: false, service: 'Unknown' });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  const useOpenRouter = formData.useOpenRouter ?? true;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Settings</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* AI Provider Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">AI Provider</h3>
            
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="provider"
                  checked={useOpenRouter}
                  onChange={() => setFormData({ ...formData, useOpenRouter: true })}
                  className="w-4 h-4"
                />
                <span className="text-white">OpenRouter (Recommended)</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="provider"
                  checked={!useOpenRouter}
                  onChange={() => setFormData({ ...formData, useOpenRouter: false })}
                  className="w-4 h-4"
                />
                <span className="text-white">LM Studio (Local)</span>
              </label>
            </div>
          </div>

          {/* OpenRouter Settings */}
          {useOpenRouter && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">OpenRouter Configuration</h3>
              
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300">
                  🆓 Using <strong>Google Gemma 3 1B Free Trial</strong> model. 
                  Get your API key at <a href="https://openrouter.ai" target="_blank" className="underline">openrouter.ai</a>
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  OpenRouter API Key
                </label>
                <input
                  type="password"
                  value={formData.openRouterKey || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, openRouterKey: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="sk-or-..."
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={formData.openRouterModel || 'google/gemma-3-1b-itb-freetrial:free'}
                  onChange={(e) =>
                    setFormData({ ...formData, openRouterModel: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* LM Studio Settings */}
          {!useOpenRouter && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">LM Studio Configuration</h3>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  LM Studio URL
                </label>
                <input
                  type="url"
                  value={formData.lmStudioUrl || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, lmStudioUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="http://localhost:1234"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Model Name
                </label>
                <input
                  type="text"
                  value={formData.lmStudioModel || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, lmStudioModel: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="default"
                />
              </div>
            </div>
          )}

          {/* Test Connection Button */}
          <div>
            <button
              type="button"
              onClick={testConnection}
              disabled={isTesting}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>

            {testResult && (
              <div
                className={`mt-2 px-3 py-2 rounded-lg ${
                  testResult.connected
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {testResult.connected
                  ? `✅ Connected to ${testResult.service}`
                  : `❌ Failed to connect to ${testResult.service}`}
              </div>
            )}
          </div>

          {/* GitHub Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">GitHub Integration (Optional)</h3>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                GitHub Token
              </label>
              <input
                type="password"
                value={formData.githubToken || ''}
                onChange={(e) =>
                  setFormData({ ...formData, githubToken: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ghp_..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Owner/Organization
                </label>
                <input
                  type="text"
                  value={formData.githubOwner || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, githubOwner: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="username"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Repository
                </label>
                <input
                  type="text"
                  value={formData.githubRepo || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, githubRepo: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="repo-name"
                />
              </div>
            </div>
          </div>

          {/* Test Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Test Configuration</h3>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Test Command
              </label>
              <input
                type="text"
                value={formData.testCommand || ''}
                onChange={(e) =>
                  setFormData({ ...formData, testCommand: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="npm test"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Test Timeout (ms)
              </label>
              <input
                type="number"
                value={formData.testTimeout || 60000}
                onChange={(e) =>
                  setFormData({ ...formData, testTimeout: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Git Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Git Configuration</h3>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Remote Name
              </label>
              <input
                type="text"
                value={formData.gitRemote || ''}
                onChange={(e) =>
                  setFormData({ ...formData, gitRemote: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="origin"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
