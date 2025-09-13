# Task: Settings Integration and Persistence

## Task Header
- **ID**: 5.2.2
- **Title**: Settings Integration and Persistence
- **Story ID**: US-5.2
- **Type**: frontend
- **Priority**: high
- **Effort Estimate**: 4-6 hours
- **Complexity**: moderate

## Objective
Implement comprehensive settings persistence using localStorage and integrate settings changes with existing game systems (audio, controls, display) to provide seamless configuration management.

## Description
Create a robust settings management system that persists user preferences across browser sessions, validates settings data integrity, and applies configuration changes immediately to the game systems. This includes integration with the AudioManager, touch controls, and game rendering systems.

## Acceptance Criteria Covered
- GIVEN audio settings WHEN changed THEN new settings apply immediately to current audio
- GIVEN settings WHEN modified THEN changes persist across browser sessions
- GIVEN control settings WHEN adjusted THEN new preferences apply to current game
- GIVEN reset option WHEN used THEN all settings return to default values

## Implementation Notes

### Settings Manager Core System
```typescript
class SettingsManager {
  private static readonly STORAGE_KEY = 'snake-game-settings';
  private static readonly VERSION = '1.0.0';
  private static readonly MIGRATION_HANDLERS: Record<string, (data: any) => GameSettings> = {
    '0.9.0': SettingsManager.migrateFromV090,
    '1.0.0': SettingsManager.migrateFromV100
  };

  private static defaultSettings: GameSettings = {
    audio: {
      masterVolume: 0.7,
      musicVolume: 0.6,
      effectsVolume: 0.8,
      muted: false,
      musicEnabled: true,
      effectsEnabled: true
    },
    controls: {
      touchSensitivity: 1.0,
      keyboardEnabled: true,
      touchEnabled: true,
      swipeThreshold: 50,
      doubleTapPrevention: true
    },
    display: {
      theme: 'default',
      showGrid: false,
      animations: true,
      reducedMotion: false,
      showFPS: false
    },
    gameplay: {
      difficulty: 'normal',
      pauseOnBlur: true,
      confirmReset: true,
      autoSave: true
    },
    version: SettingsManager.VERSION,
    lastModified: Date.now()
  };

  static loadSettings(): GameSettings {
    try {
      const stored = localStorage.getItem(SettingsManager.STORAGE_KEY);
      if (!stored) {
        return { ...SettingsManager.defaultSettings };
      }

      const parsed = JSON.parse(stored);
      
      // Validate and migrate if necessary
      const validated = SettingsManager.validateAndMigrate(parsed);
      return validated;
    } catch (error) {
      console.warn('Failed to load settings, using defaults:', error);
      return { ...SettingsManager.defaultSettings };
    }
  }

  static saveSettings(settings: GameSettings): void {
    try {
      const settingsToSave = {
        ...settings,
        version: SettingsManager.VERSION,
        lastModified: Date.now()
      };

      const serialized = JSON.stringify(settingsToSave, null, 2);
      localStorage.setItem(SettingsManager.STORAGE_KEY, serialized);
      
      // Emit settings change event
      SettingsManager.emitSettingsChange(settingsToSave);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw new Error('Unable to save settings. Local storage may be full.');
    }
  }

  static resetToDefaults(): GameSettings {
    const defaults = { ...SettingsManager.defaultSettings };
    SettingsManager.saveSettings(defaults);
    return defaults;
  }

  static exportSettings(): string {
    const settings = SettingsManager.loadSettings();
    return JSON.stringify(settings, null, 2);
  }

  static importSettings(settingsJson: string): GameSettings {
    try {
      const parsed = JSON.parse(settingsJson);
      const validated = SettingsManager.validateAndMigrate(parsed);
      SettingsManager.saveSettings(validated);
      return validated;
    } catch (error) {
      throw new Error('Invalid settings format. Please check the imported data.');
    }
  }

  private static validateAndMigrate(data: any): GameSettings {
    // Check if migration is needed
    if (!data.version || data.version !== SettingsManager.VERSION) {
      data = SettingsManager.migrateSettings(data);
    }

    // Validate structure
    const validated = SettingsManager.validateSettings(data);
    return validated;
  }

  private static validateSettings(data: any): GameSettings {
    const settings = { ...SettingsManager.defaultSettings };

    // Validate audio settings
    if (data.audio && typeof data.audio === 'object') {
      settings.audio = {
        masterVolume: SettingsManager.clamp(data.audio.masterVolume ?? settings.audio.masterVolume, 0, 1),
        musicVolume: SettingsManager.clamp(data.audio.musicVolume ?? settings.audio.musicVolume, 0, 1),
        effectsVolume: SettingsManager.clamp(data.audio.effectsVolume ?? settings.audio.effectsVolume, 0, 1),
        muted: Boolean(data.audio.muted ?? settings.audio.muted),
        musicEnabled: Boolean(data.audio.musicEnabled ?? settings.audio.musicEnabled),
        effectsEnabled: Boolean(data.audio.effectsEnabled ?? settings.audio.effectsEnabled)
      };
    }

    // Validate control settings
    if (data.controls && typeof data.controls === 'object') {
      settings.controls = {
        touchSensitivity: SettingsManager.clamp(data.controls.touchSensitivity ?? settings.controls.touchSensitivity, 0.1, 2.0),
        keyboardEnabled: Boolean(data.controls.keyboardEnabled ?? settings.controls.keyboardEnabled),
        touchEnabled: Boolean(data.controls.touchEnabled ?? settings.controls.touchEnabled),
        swipeThreshold: SettingsManager.clamp(data.controls.swipeThreshold ?? settings.controls.swipeThreshold, 20, 80),
        doubleTapPrevention: Boolean(data.controls.doubleTapPrevention ?? settings.controls.doubleTapPrevention)
      };
    }

    // Validate display settings
    if (data.display && typeof data.display === 'object') {
      settings.display = {
        theme: ['default', 'dark', 'contrast'].includes(data.display.theme) ? data.display.theme : settings.display.theme,
        showGrid: Boolean(data.display.showGrid ?? settings.display.showGrid),
        animations: Boolean(data.display.animations ?? settings.display.animations),
        reducedMotion: Boolean(data.display.reducedMotion ?? settings.display.reducedMotion),
        showFPS: Boolean(data.display.showFPS ?? settings.display.showFPS)
      };
    }

    // Validate gameplay settings
    if (data.gameplay && typeof data.gameplay === 'object') {
      settings.gameplay = {
        difficulty: ['easy', 'normal', 'hard'].includes(data.gameplay.difficulty) ? data.gameplay.difficulty : settings.gameplay.difficulty,
        pauseOnBlur: Boolean(data.gameplay.pauseOnBlur ?? settings.gameplay.pauseOnBlur),
        confirmReset: Boolean(data.gameplay.confirmReset ?? settings.gameplay.confirmReset),
        autoSave: Boolean(data.gameplay.autoSave ?? settings.gameplay.autoSave)
      };
    }

    return settings;
  }

  private static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private static emitSettingsChange(settings: GameSettings): void {
    const event = new CustomEvent('settings-changed', { detail: settings });
    window.dispatchEvent(event);
  }
}
```

### Settings Integration System
```typescript
class SettingsIntegrator {
  private audioManager: AudioManager;
  private touchControlManager: TouchControlManager;
  private gameRenderer: GameRenderer;
  private gameControlHandler: GameControlHandler;

  constructor(
    audioManager: AudioManager,
    touchControlManager: TouchControlManager,
    gameRenderer: GameRenderer,
    gameControlHandler: GameControlHandler
  ) {
    this.audioManager = audioManager;
    this.touchControlManager = touchControlManager;
    this.gameRenderer = gameRenderer;
    this.gameControlHandler = gameControlHandler;

    this.setupSettingsListener();
  }

  private setupSettingsListener(): void {
    window.addEventListener('settings-changed', (event: CustomEvent<GameSettings>) => {
      this.applySettings(event.detail);
    });
  }

  applySettings(settings: GameSettings): void {
    // Apply audio settings
    this.applyAudioSettings(settings.audio);
    
    // Apply control settings
    this.applyControlSettings(settings.controls);
    
    // Apply display settings
    this.applyDisplaySettings(settings.display);
    
    // Apply gameplay settings
    this.applyGameplaySettings(settings.gameplay);
  }

  private applyAudioSettings(audioSettings: AudioSettings): void {
    if (!this.audioManager) return;

    try {
      // Apply volume settings
      this.audioManager.setMasterVolume(audioSettings.masterVolume);
      this.audioManager.setMusicVolume(audioSettings.musicVolume);
      this.audioManager.setEffectsVolume(audioSettings.effectsVolume);

      // Apply mute state
      if (audioSettings.muted) {
        this.audioManager.muteAll();
      } else {
        this.audioManager.unmuteAll();
      }

      // Apply enable/disable states
      this.audioManager.setMusicEnabled(audioSettings.musicEnabled && !audioSettings.muted);
      this.audioManager.setEffectsEnabled(audioSettings.effectsEnabled && !audioSettings.muted);

      console.log('Audio settings applied successfully');
    } catch (error) {
      console.error('Failed to apply audio settings:', error);
    }
  }

  private applyControlSettings(controlSettings: ControlSettings): void {
    try {
      // Apply touch control settings
      if (this.touchControlManager) {
        this.touchControlManager.updateConfiguration({
          sensitivity: controlSettings.touchSensitivity,
          enabled: controlSettings.touchEnabled,
          swipeThreshold: controlSettings.swipeThreshold,
          doubleTapPrevention: controlSettings.doubleTapPrevention
        });
      }

      // Apply keyboard control settings
      if (this.gameControlHandler) {
        this.gameControlHandler.setKeyboardEnabled(controlSettings.keyboardEnabled);
      }

      console.log('Control settings applied successfully');
    } catch (error) {
      console.error('Failed to apply control settings:', error);
    }
  }

  private applyDisplaySettings(displaySettings: DisplaySettings): void {
    try {
      // Apply theme
      document.documentElement.setAttribute('data-theme', displaySettings.theme);

      // Apply animations setting
      document.documentElement.setAttribute('data-animations', displaySettings.animations.toString());

      // Apply reduced motion
      if (displaySettings.reducedMotion) {
        document.documentElement.style.setProperty('--animation-duration', '0ms');
      } else {
        document.documentElement.style.removeProperty('--animation-duration');
      }

      // Apply renderer settings
      if (this.gameRenderer) {
        this.gameRenderer.setShowGrid(displaySettings.showGrid);
        this.gameRenderer.setShowFPS(displaySettings.showFPS);
      }

      console.log('Display settings applied successfully');
    } catch (error) {
      console.error('Failed to apply display settings:', error);
    }
  }

  private applyGameplaySettings(gameplaySettings: GameplaySettings): void {
    try {
      // Apply difficulty settings (this might affect game speed, scoring, etc.)
      if (this.gameControlHandler) {
        this.gameControlHandler.setDifficulty(gameplaySettings.difficulty);
        this.gameControlHandler.setPauseOnBlur(gameplaySettings.pauseOnBlur);
        this.gameControlHandler.setConfirmReset(gameplaySettings.confirmReset);
      }

      console.log('Gameplay settings applied successfully');
    } catch (error) {
      console.error('Failed to apply gameplay settings:', error);
    }
  }
}
```

### React Settings Context
```typescript
interface SettingsContextValue {
  settings: GameSettings;
  updateSettings: (updates: Partial<GameSettings>) => Promise<void>;
  resetSettings: () => Promise<GameSettings>;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => Promise<GameSettings>;
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

interface SettingsProviderProps {
  children: React.ReactNode;
  integrator: SettingsIntegrator;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ 
  children, 
  integrator 
}) => {
  const [settings, setSettings] = useState<GameSettings>(() => 
    SettingsManager.loadSettings()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialSettings] = useState<GameSettings>(settings);

  // Apply settings on mount
  useEffect(() => {
    integrator.applySettings(settings);
  }, [integrator]);

  const updateSettings = useCallback(async (updates: Partial<GameSettings>): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const newSettings = { ...settings, ...updates };
      
      // Save to localStorage
      SettingsManager.saveSettings(newSettings);
      
      // Apply to game systems
      integrator.applySettings(newSettings);
      
      // Update state
      setSettings(newSettings);
      setHasUnsavedChanges(!isEqual(newSettings, initialSettings));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [settings, integrator, initialSettings]);

  const resetSettings = useCallback(async (): Promise<GameSettings> => {
    setIsLoading(true);
    setError(null);

    try {
      const defaultSettings = SettingsManager.resetToDefaults();
      
      // Apply to game systems
      integrator.applySettings(defaultSettings);
      
      // Update state
      setSettings(defaultSettings);
      setHasUnsavedChanges(false);
      
      return defaultSettings;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [integrator]);

  const exportSettings = useCallback((): string => {
    return SettingsManager.exportSettings();
  }, []);

  const importSettings = useCallback(async (settingsJson: string): Promise<GameSettings> => {
    setIsLoading(true);
    setError(null);

    try {
      const importedSettings = SettingsManager.importSettings(settingsJson);
      
      // Apply to game systems
      integrator.applySettings(importedSettings);
      
      // Update state
      setSettings(importedSettings);
      setHasUnsavedChanges(false);
      
      return importedSettings;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [integrator]);

  const value: SettingsContextValue = {
    settings,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    isLoading,
    error,
    hasUnsavedChanges
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
```

### Settings Migration System
```typescript
class SettingsMigration {
  private static migrations: Record<string, (data: any) => any> = {
    '0.9.0': SettingsMigration.migrateFrom090,
    '1.0.0': SettingsMigration.migrateFrom100
  };

  static migrateSettings(data: any): GameSettings {
    const version = data.version || '0.9.0';
    
    let migrated = data;
    const migrationKeys = Object.keys(SettingsMigration.migrations).sort();
    
    for (const migrationVersion of migrationKeys) {
      if (this.isVersionGreater(migrationVersion, version)) {
        migrated = SettingsMigration.migrations[migrationVersion](migrated);
        migrated.version = migrationVersion;
      }
    }

    return migrated;
  }

  private static migrateFrom090(data: any): any {
    // Migration from version 0.9.0 to 1.0.0
    return {
      ...data,
      controls: {
        ...data.controls,
        doubleTapPrevention: true, // New field in 1.0.0
        swipeThreshold: data.controls?.swipeThreshold || 50
      },
      display: {
        ...data.display,
        showFPS: false // New field in 1.0.0
      }
    };
  }

  private static migrateFrom100(data: any): any {
    // No migration needed - already at current version
    return data;
  }

  private static isVersionGreater(version1: string, version2: string): boolean {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return true;
      if (v1Part < v2Part) return false;
    }
    
    return false;
  }
}
```

## Technical Specifications

### File Targets

#### New Files
- `src/lib/settings/SettingsManager.ts` - Core settings persistence and validation
- `src/lib/settings/SettingsIntegrator.ts` - Integration with game systems
- `src/lib/settings/SettingsMigration.ts` - Settings version migration
- `src/contexts/SettingsContext.tsx` - React context for settings state
- `src/hooks/useSettings.ts` - Settings hook for components
- `src/lib/settings/types.ts` - Settings-related TypeScript interfaces
- `src/lib/utils/settingsUtils.ts` - Settings utility functions

#### Modified Files
- `src/components/Settings/SettingsPage.tsx` - Integrate with settings context
- `src/lib/audio/AudioManager.ts` - Add settings integration methods
- `src/lib/touch/TouchControlManager.ts` - Add configuration update methods
- `src/lib/game/GameRenderer.ts` - Add display settings support
- `src/pages/_app.tsx` - Add SettingsProvider to app root

### API Endpoints
N/A - Frontend-only persistence using localStorage

### Database Changes
N/A - Uses browser localStorage for persistence

### Component Specs
```typescript
// Settings persistence interfaces
interface SettingsStorageFormat {
  settings: GameSettings;
  version: string;
  timestamp: number;
  checksum?: string;
}

interface SettingsMigrationHandler {
  (data: any): GameSettings;
}

interface SettingsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  correctedSettings?: GameSettings;
}

// Integration interfaces
interface SystemIntegrator {
  applyAudioSettings(settings: AudioSettings): void;
  applyControlSettings(settings: ControlSettings): void;
  applyDisplaySettings(settings: DisplaySettings): void;
  applyGameplaySettings(settings: GameplaySettings): void;
}

interface SettingsEventDetail {
  settings: GameSettings;
  previousSettings: GameSettings;
  changes: Partial<GameSettings>;
}

// React context interfaces
interface SettingsContextState {
  settings: GameSettings;
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  lastSaved: number;
}

interface SettingsActions {
  updateSettings: (updates: Partial<GameSettings>) => Promise<void>;
  resetSettings: () => Promise<GameSettings>;
  exportSettings: () => string;
  importSettings: (json: string) => Promise<GameSettings>;
  validateSettings: (settings: GameSettings) => SettingsValidationResult;
}
```

### DTO Definitions
```typescript
// Settings operation data transfer objects
interface SettingsUpdateRequest {
  updates: Partial<GameSettings>;
  validateOnly?: boolean;
  skipIntegration?: boolean;
}

interface SettingsUpdateResponse {
  success: boolean;
  settings?: GameSettings;
  errors?: string[];
  warnings?: string[];
}

interface SettingsExportData {
  settings: GameSettings;
  metadata: {
    exportDate: string;
    version: string;
    gameVersion: string;
  };
}

interface SettingsImportRequest {
  data: string;
  format: 'json' | 'legacy';
  validateOnly?: boolean;
}
```

### Configuration Changes
```typescript
// Settings configuration constants
export const SETTINGS_CONFIG = {
  STORAGE_KEY: 'snake-game-settings',
  VERSION: '1.0.0',
  BACKUP_VERSIONS: 3,
  AUTO_SAVE_DELAY: 1000, // ms
  VALIDATION_STRICT: true,
  
  DEFAULTS: {
    AUDIO: {
      MASTER_VOLUME: 0.7,
      MUSIC_VOLUME: 0.6,
      EFFECTS_VOLUME: 0.8
    },
    CONTROLS: {
      TOUCH_SENSITIVITY: 1.0,
      SWIPE_THRESHOLD: 50
    },
    DISPLAY: {
      THEME: 'default',
      ANIMATIONS: true
    },
    GAMEPLAY: {
      DIFFICULTY: 'normal',
      PAUSE_ON_BLUR: true
    }
  },
  
  VALIDATION: {
    VOLUME_RANGE: [0, 1],
    SENSITIVITY_RANGE: [0.1, 2.0],
    SWIPE_THRESHOLD_RANGE: [20, 80]
  }
} as const;
```

## Testing Requirements

### Unit Tests
- SettingsManager load, save, and validation functions
- Settings migration logic for version upgrades
- SettingsIntegrator system integration methods
- Settings context state management and actions
- Settings validation edge cases and error handling

### Integration Tests
- Settings persistence across browser sessions
- Real-time integration with audio and control systems
- Settings context provider and consumer components
- Settings migration from older versions
- Error handling for corrupted localStorage data

### E2E Scenarios
- Complete settings workflow from UI to persistence
- Settings changes applying immediately to game systems
- Settings reset functionality and system integration
- Import/export functionality with data validation
- Settings persistence across page refreshes

## Dependencies

### Prerequisite Tasks
- US-5.2.1 (Settings Page UI and Components) - For settings UI integration
- US-4.1 (Background Music System) - For audio settings integration
- US-4.2 (Game Sound Effects) - For effects settings integration
- US-5.1.1 (Touch Event System) - For control settings integration

### Blocking Tasks
- None - Integration task depends on previous implementations

### External Dependencies
- localStorage browser API
- CustomEvent API for settings change notifications
- JSON serialization for settings persistence

## Risks and Considerations

### Technical Risks
- **localStorage Limitations**: Storage quota limits and availability across browsers
  - *Mitigation*: Error handling for storage failures and graceful degradation
  
- **Settings Migration Complexity**: Complex migration logic may introduce bugs
  - *Mitigation*: Comprehensive testing of migration scenarios and validation
  
- **Integration Coupling**: Tight coupling between settings and game systems
  - *Mitigation*: Event-driven integration and clear interface contracts

### Implementation Challenges
- **Concurrent Settings Updates**: Multiple components updating settings simultaneously
  - *Mitigation*: Atomic settings updates and proper state management
  
- **Performance Impact**: Real-time settings application may affect game performance
  - *Mitigation*: Debounced updates and optimized integration methods
  
- **Data Corruption**: Invalid settings data corrupting game state
  - *Mitigation*: Robust validation and fallback to default settings

### Mitigation Strategies
- Implement comprehensive settings validation at all entry points
- Provide clear error messages and recovery options
- Use versioned settings format for future migration needs
- Test thoroughly with various settings combinations
- Monitor settings system performance impact

## Definition of Done
- [ ] Settings persist correctly across browser sessions using localStorage
- [ ] Settings changes apply immediately to audio, controls, and display systems
- [ ] Settings validation prevents invalid configurations
- [ ] Settings migration handles version upgrades seamlessly
- [ ] Reset to defaults functionality works correctly
- [ ] Settings context provides reliable state management
- [ ] Error handling for localStorage failures and data corruption
- [ ] Settings integration maintains game performance
- [ ] Import/export functionality works with data validation
- [ ] Integration testing validates complete settings workflow

## Implementation Strategy
1. **Phase 1**: Core SettingsManager with localStorage persistence
2. **Phase 2**: SettingsIntegrator for game system integration
3. **Phase 3**: React context and hooks for UI integration
4. **Phase 4**: Settings migration and validation systems
5. **Phase 5**: Error handling, testing, and performance optimization

This settings integration provides a robust, persistent configuration system that seamlessly connects user preferences with game functionality while maintaining data integrity and performance.