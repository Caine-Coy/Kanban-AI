import { Router } from 'express';
import { getSettings, updateSetting } from '../database/settings.js';
import type { UpdateSettingsRequest } from 'shared';

export const settingsRouter = Router();

/**
 * GET /api/settings
 * Get all settings
 */
settingsRouter.get('/', (_req, res) => {
  try {
    const settings = getSettings();
    // Don't send API key to client (unless loaded from env)
    const safeSettings = { 
      ...settings, 
      openRouterKey: process.env.OPENROUTER_KEY ? 'env_loaded' : undefined 
    };
    res.json(safeSettings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * PUT /api/settings
 * Update settings
 */
settingsRouter.put('/', (req, res) => {
  try {
    const settings: UpdateSettingsRequest = req.body;

    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined) {
        if (typeof value === 'boolean') {
          updateSetting(key, value ? 'true' : 'false');
        } else {
          updateSetting(key, value);
        }
      }
    }

    res.json(getSettings());
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * GET /api/settings/test-lmstudio
 * Test LM Studio or OpenRouter connection
 */
settingsRouter.get('/test-lmstudio', async (req, res) => {
  try {
    const settings = getSettings();
    const { LMStudioService } = await import('../services/lmstudio.js');
    const lmStudio = new LMStudioService(
      settings.lmStudioUrl,
      settings.lmStudioModel,
      settings.openRouterUrl,
      settings.openRouterKey,
      settings.openRouterModel,
      settings.useOpenRouter
    );
    
    const result = await lmStudio.testConnection();
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      connected: false,
      service: 'Unknown',
      error: 'Failed to test connection',
    });
  }
});
