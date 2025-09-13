# Task: Settings Page UI and Components

## Task Header

- **ID**: 5.2.1
- **Title**: Settings Page UI and Components
- **Story ID**: US-5.2
- **Type**: frontend
- **Priority**: high
- **Effort Estimate**: 4-6 hours
- **Complexity**: moderate

## Objective

Create a comprehensive settings page with intuitive UI components that allow users to configure audio, control, display, and gameplay preferences with immediate visual feedback and validation.

## Description

Develop a professional settings interface with organized sections for different configuration categories. The page must provide clear, accessible controls that work well on both desktop and mobile devices, with proper form validation and user-friendly design patterns.

## Acceptance Criteria Covered

- GIVEN settings page WHEN accessed THEN audio volume controls are available for music and sound effects
- GIVEN settings page WHEN displayed THEN clear organization with labeled sections
- GIVEN setting controls WHEN used THEN provide immediate visual feedback of current values
- GIVEN mobile device WHEN accessing settings THEN controls are appropriately sized for touch

## Implementation Notes

### Settings Page Architecture

```typescript
// Main settings page component
interface SettingsPageProps {
  onSave: (settings: GameSettings) => void;
  onCancel: () => void;
  onReset: () => void;
  initialSettings: GameSettings;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onSave,
  onCancel,
  onReset,
  initialSettings
}) => {
  const [settings, setSettings] = useState<GameSettings>(initialSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const { screenSize } = useResponsiveLayout();

  const updateSettings = useCallback((updates: Partial<GameSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      setHasChanges(!isEqual(newSettings, initialSettings));

      // Validate changes
      const errors = validateSettings(newSettings);
      setValidationErrors(errors);

      return newSettings;
    });
  }, [initialSettings]);

  const handleSave = useCallback(() => {
    if (Object.keys(validationErrors).length === 0) {
      onSave(settings);
    }
  }, [settings, validationErrors, onSave]);

  return (
    <div className="settings-page">
      <SettingsHeader
        title="Game Settings"
        hasChanges={hasChanges}
        onCancel={onCancel}
      />

      <SettingsContainer>
        <AudioSettingsSection
          settings={settings.audio}
          onChange={(audio) => updateSettings({ audio })}
          errors={validationErrors.audio}
        />

        <ControlSettingsSection
          settings={settings.controls}
          onChange={(controls) => updateSettings({ controls })}
          errors={validationErrors.controls}
        />

        <DisplaySettingsSection
          settings={settings.display}
          onChange={(display) => updateSettings({ display })}
          errors={validationErrors.display}
        />

        <GameplaySettingsSection
          settings={settings.gameplay}
          onChange={(gameplay) => updateSettings({ gameplay })}
          errors={validationErrors.gameplay}
        />
      </SettingsContainer>

      <SettingsActions
        onSave={handleSave}
        onCancel={onCancel}
        onReset={onReset}
        hasChanges={hasChanges}
        isValid={Object.keys(validationErrors).length === 0}
      />
    </div>
  );
};
```

### Audio Settings Section Component

```typescript
interface AudioSettingsSectionProps {
  settings: AudioSettings;
  onChange: (settings: AudioSettings) => void;
  errors?: AudioSettingsErrors;
}

export const AudioSettingsSection: React.FC<AudioSettingsSectionProps> = ({
  settings,
  onChange,
  errors = {}
}) => {
  const handleVolumeChange = useCallback((type: 'master' | 'music' | 'effects', value: number) => {
    onChange({
      ...settings,
      [`${type}Volume`]: value
    });
  }, [settings, onChange]);

  const handleToggleChange = useCallback((key: keyof AudioSettings) => {
    onChange({
      ...settings,
      [key]: !settings[key]
    });
  }, [settings, onChange]);

  return (
    <SettingsSectionCard
      title="Audio Settings"
      icon="volume"
      description="Configure sound and music preferences"
    >
      <SettingsGrid>
        <VolumeSlider
          label="Master Volume"
          value={settings.masterVolume}
          onChange={(value) => handleVolumeChange('master', value)}
          disabled={settings.muted}
          error={errors.masterVolume}
          formatValue={(val) => `${Math.round(val * 100)}%`}
        />

        <VolumeSlider
          label="Music Volume"
          value={settings.musicVolume}
          onChange={(value) => handleVolumeChange('music', value)}
          disabled={settings.muted || !settings.musicEnabled}
          error={errors.musicVolume}
          formatValue={(val) => `${Math.round(val * 100)}%`}
        />

        <VolumeSlider
          label="Sound Effects Volume"
          value={settings.effectsVolume}
          onChange={(value) => handleVolumeChange('effects', value)}
          disabled={settings.muted || !settings.effectsEnabled}
          error={errors.effectsVolume}
          formatValue={(val) => `${Math.round(val * 100)}%`}
        />

        <ToggleSwitch
          label="Mute All Audio"
          checked={settings.muted}
          onChange={() => handleToggleChange('muted')}
          description="Disable all game audio"
        />

        <ToggleSwitch
          label="Enable Background Music"
          checked={settings.musicEnabled}
          onChange={() => handleToggleChange('musicEnabled')}
          disabled={settings.muted}
          description="Play background music during gameplay"
        />

        <ToggleSwitch
          label="Enable Sound Effects"
          checked={settings.effectsEnabled}
          onChange={() => handleToggleChange('effectsEnabled')}
          disabled={settings.muted}
          description="Play sound effects for game events"
        />
      </SettingsGrid>
    </SettingsSectionCard>
  );
};
```

### Control Settings Section Component

```typescript
interface ControlSettingsSectionProps {
  settings: ControlSettings;
  onChange: (settings: ControlSettings) => void;
  errors?: ControlSettingsErrors;
}

export const ControlSettingsSection: React.FC<ControlSettingsSectionProps> = ({
  settings,
  onChange,
  errors = {}
}) => {
  const { isMobile } = useDeviceDetection();

  return (
    <SettingsSectionCard
      title="Control Settings"
      icon="gamepad"
      description="Configure input and control preferences"
    >
      <SettingsGrid>
        {isMobile && (
          <>
            <RangeSlider
              label="Touch Sensitivity"
              value={settings.touchSensitivity}
              min={0.5}
              max={2.0}
              step={0.1}
              onChange={(value) => onChange({ ...settings, touchSensitivity: value })}
              error={errors.touchSensitivity}
              formatValue={(val) => `${val.toFixed(1)}x`}
              description="Adjust how responsive touch controls are"
            />

            <RangeSlider
              label="Swipe Threshold"
              value={settings.swipeThreshold}
              min={20}
              max={80}
              step={5}
              onChange={(value) => onChange({ ...settings, swipeThreshold: value })}
              error={errors.swipeThreshold}
              formatValue={(val) => `${val}px`}
              description="Minimum distance for swipe gesture recognition"
            />

            <ToggleSwitch
              label="Prevent Double-Tap"
              checked={settings.doubleTapPrevention}
              onChange={() => onChange({ ...settings, doubleTapPrevention: !settings.doubleTapPrevention })}
              description="Prevent accidental rapid direction changes"
            />

            <ToggleSwitch
              label="Enable Touch Controls"
              checked={settings.touchEnabled}
              onChange={() => onChange({ ...settings, touchEnabled: !settings.touchEnabled })}
              description="Use touch gestures for game control"
            />
          </>
        )}

        <ToggleSwitch
          label="Enable Keyboard Controls"
          checked={settings.keyboardEnabled}
          onChange={() => onChange({ ...settings, keyboardEnabled: !settings.keyboardEnabled })}
          description="Use arrow keys for game control"
        />
      </SettingsGrid>
    </SettingsSectionCard>
  );
};
```

### Reusable Settings Components

```typescript
// Volume slider component
interface VolumeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  error?: string;
  formatValue?: (value: number) => string;
}

export const VolumeSlider: React.FC<VolumeSliderProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  error,
  formatValue = (val) => val.toString()
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const handleChange = useCallback((newValue: number) => {
    setLocalValue(newValue);
    onChange(newValue);
  }, [onChange]);

  return (
    <div className={`volume-slider ${disabled ? 'disabled' : ''} ${error ? 'error' : ''}`}>
      <div className="slider-header">
        <label className="slider-label">{label}</label>
        <span className="slider-value">{formatValue(localValue)}</span>
      </div>

      <div className="slider-container">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={localValue}
          onChange={(e) => handleChange(parseFloat(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          disabled={disabled}
          className="slider-input"
          aria-label={label}
        />

        <div className="slider-track">
          <div
            className="slider-fill"
            style={{ width: `${localValue * 100}%` }}
          />
        </div>
      </div>

      {error && <span className="slider-error">{error}</span>}
    </div>
  );
};

// Toggle switch component
interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  description?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
  description
}) => {
  return (
    <div className={`toggle-switch ${disabled ? 'disabled' : ''}`}>
      <div className="toggle-content">
        <div className="toggle-text">
          <label className="toggle-label">{label}</label>
          {description && <span className="toggle-description">{description}</span>}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          className={`toggle-button ${checked ? 'checked' : ''}`}
          onClick={onChange}
          disabled={disabled}
        >
          <span className="toggle-slider">
            <span className="toggle-thumb" />
          </span>
        </button>
      </div>
    </div>
  );
};

// Settings section card wrapper
interface SettingsSectionCardProps {
  title: string;
  icon: string;
  description: string;
  children: React.ReactNode;
}

export const SettingsSectionCard: React.FC<SettingsSectionCardProps> = ({
  title,
  icon,
  description,
  children
}) => {
  return (
    <div className="settings-section-card">
      <div className="section-header">
        <div className="section-icon">
          <i className={`icon-${icon}`} aria-hidden="true" />
        </div>
        <div className="section-text">
          <h3 className="section-title">{title}</h3>
          <p className="section-description">{description}</p>
        </div>
      </div>

      <div className="section-content">
        {children}
      </div>
    </div>
  );
};
```

### Settings Validation System

```typescript
interface ValidationErrors {
  audio?: AudioSettingsErrors;
  controls?: ControlSettingsErrors;
  display?: DisplaySettingsErrors;
  gameplay?: GameplaySettingsErrors;
}

interface AudioSettingsErrors {
  masterVolume?: string;
  musicVolume?: string;
  effectsVolume?: string;
}

export const validateSettings = (settings: GameSettings): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate audio settings
  const audioErrors: AudioSettingsErrors = {};

  if (settings.audio.masterVolume < 0 || settings.audio.masterVolume > 1) {
    audioErrors.masterVolume = 'Master volume must be between 0 and 1';
  }

  if (settings.audio.musicVolume < 0 || settings.audio.musicVolume > 1) {
    audioErrors.musicVolume = 'Music volume must be between 0 and 1';
  }

  if (settings.audio.effectsVolume < 0 || settings.audio.effectsVolume > 1) {
    audioErrors.effectsVolume = 'Effects volume must be between 0 and 1';
  }

  if (Object.keys(audioErrors).length > 0) {
    errors.audio = audioErrors;
  }

  // Validate control settings
  const controlErrors: ControlSettingsErrors = {};

  if (
    settings.controls.touchSensitivity < 0.1 ||
    settings.controls.touchSensitivity > 2.0
  ) {
    controlErrors.touchSensitivity =
      'Touch sensitivity must be between 0.1 and 2.0';
  }

  if (
    settings.controls.swipeThreshold < 10 ||
    settings.controls.swipeThreshold > 100
  ) {
    controlErrors.swipeThreshold =
      'Swipe threshold must be between 10 and 100 pixels';
  }

  if (Object.keys(controlErrors).length > 0) {
    errors.controls = controlErrors;
  }

  return errors;
};
```

## Technical Specifications

### File Targets

#### New Files

- `src/pages/settings.tsx` - Main settings page
- `src/components/Settings/SettingsPage.tsx` - Settings page component
- `src/components/Settings/AudioSettingsSection.tsx` - Audio configuration section
- `src/components/Settings/ControlSettingsSection.tsx` - Control configuration section
- `src/components/Settings/DisplaySettingsSection.tsx` - Display configuration section
- `src/components/Settings/GameplaySettingsSection.tsx` - Gameplay configuration section
- `src/components/Settings/SettingsComponents/VolumeSlider.tsx` - Volume control component
- `src/components/Settings/SettingsComponents/ToggleSwitch.tsx` - Toggle switch component
- `src/components/Settings/SettingsComponents/RangeSlider.tsx` - Range slider component
- `src/components/Settings/SettingsComponents/SelectDropdown.tsx` - Select dropdown component
- `src/components/Settings/SettingsSectionCard.tsx` - Section wrapper component
- `src/lib/settings/settingsValidation.ts` - Settings validation logic
- `src/styles/settings.css` - Settings page styles

#### Modified Files

- `src/components/Navigation/MainMenu.tsx` - Add settings page navigation
- `src/components/Game/GamePage.tsx` - Add settings access button

### API Endpoints

N/A - Frontend-only UI components

### Database Changes

N/A - No database persistence in this task

### Component Specs

```typescript
// Settings data interfaces
interface GameSettings {
  audio: AudioSettings;
  controls: ControlSettings;
  display: DisplaySettings;
  gameplay: GameplaySettings;
  version: string;
  lastModified: number;
}

interface AudioSettings {
  masterVolume: number; // 0-1
  musicVolume: number; // 0-1
  effectsVolume: number; // 0-1
  muted: boolean;
  musicEnabled: boolean;
  effectsEnabled: boolean;
}

interface ControlSettings {
  touchSensitivity: number; // 0.5-2.0
  keyboardEnabled: boolean;
  touchEnabled: boolean;
  swipeThreshold: number; // 20-80 pixels
  doubleTapPrevention: boolean;
}

interface DisplaySettings {
  theme: 'default' | 'dark' | 'contrast';
  showGrid: boolean;
  animations: boolean;
  reducedMotion: boolean;
  showFPS: boolean;
}

interface GameplaySettings {
  difficulty: 'easy' | 'normal' | 'hard';
  pauseOnBlur: boolean;
  confirmReset: boolean;
  autoSave: boolean;
}

// Component prop interfaces
interface SettingControlProps<T> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  error?: string;
  description?: string;
}

type SliderProps = SettingControlProps<number> & {
  min: number;
  max: number;
  step: number;
  formatValue?: (value: number) => string;
};

type ToggleProps = SettingControlProps<boolean>;

type SelectProps<T> = SettingControlProps<T> & {
  options: Array<{ value: T; label: string; description?: string }>;
};
```

### DTO Definitions

```typescript
// Settings state data transfer objects
interface SettingsStateDTO {
  current: GameSettings;
  initial: GameSettings;
  hasChanges: boolean;
  validationErrors: ValidationErrors;
  isDirty: boolean;
}

interface SettingsUpdateDTO {
  section: 'audio' | 'controls' | 'display' | 'gameplay';
  updates: Partial<GameSettings>;
  timestamp: number;
}
```

### Configuration Changes

```css
/* Settings page CSS custom properties */
:root {
  /* Settings layout */
  --settings-max-width: 800px;
  --settings-section-gap: 24px;
  --settings-grid-columns: 1fr;

  /* Control sizing */
  --slider-height: 6px;
  --slider-thumb-size: 20px;
  --toggle-width: 48px;
  --toggle-height: 24px;

  /* Colors */
  --settings-background: #ffffff;
  --settings-border: #e0e0e0;
  --settings-text: #333333;
  --settings-accent: #007bff;
  --settings-error: #dc3545;

  /* Mobile overrides */
  @media (max-width: 768px) {
    --settings-section-gap: 16px;
    --slider-thumb-size: 24px;
    --toggle-width: 52px;
    --toggle-height: 28px;
  }
}
```

## Testing Requirements

### Unit Tests

- Settings page component rendering with various props
- Settings validation logic for all input ranges
- Volume slider component behavior and value formatting
- Toggle switch state management and accessibility
- Settings section card layout and organization

### Integration Tests

- Settings form validation and error display
- Real-time settings updates and visual feedback
- Navigation between settings sections
- Mobile responsive layout testing

### E2E Scenarios

- Complete settings configuration workflow
- Settings validation and error handling
- Mobile touch interaction with settings controls
- Accessibility testing with keyboard navigation

## Dependencies

### Prerequisite Tasks

- US-4.1 (Background Music System) - For audio settings integration
- US-4.2 (Game Sound Effects) - For effects settings integration

### Blocking Tasks

- None - UI can be developed independently

### External Dependencies

- React form handling patterns
- CSS Grid and Flexbox for layout
- Accessibility APIs for screen reader support

## Risks and Considerations

### Technical Risks

- **Form Validation Complexity**: Complex validation rules may introduce bugs
  - _Mitigation_: Comprehensive validation testing and clear error messages
- **Mobile Touch Usability**: Settings controls may be difficult to use on mobile
  - _Mitigation_: Large touch targets and mobile-specific testing
- **Accessibility Compliance**: Settings must work with screen readers and keyboard navigation
  - _Mitigation_: Proper ARIA labels and accessibility testing

### Implementation Challenges

- **Real-Time Feedback**: Providing immediate visual feedback without performance impact
  - _Mitigation_: Debounced updates and optimized rendering
- **Cross-Platform Consistency**: Settings appearance must be consistent across devices
  - _Mitigation_: Responsive design patterns and comprehensive testing
- **State Management**: Managing complex settings state without bugs
  - _Mitigation_: Immutable state updates and validation at each step

### Mitigation Strategies

- Follow established design patterns for settings interfaces
- Implement progressive enhancement for advanced features
- Provide clear visual feedback for all user interactions
- Test thoroughly on various devices and screen sizes
- Use semantic HTML and proper ARIA attributes for accessibility

## Definition of Done

- [ ] Settings page with organized sections for all configuration categories
- [ ] Volume sliders with real-time feedback and proper formatting
- [ ] Toggle switches with clear labels and descriptions
- [ ] Form validation with meaningful error messages
- [ ] Mobile-responsive design with appropriate touch targets
- [ ] Accessibility compliance with keyboard navigation and screen reader support
- [ ] Visual feedback for all user interactions
- [ ] Settings validation prevents invalid configurations
- [ ] Professional design matching game aesthetic
- [ ] Integration testing validates component interactions

## Implementation Strategy

1. **Phase 1**: Core settings page structure and navigation
2. **Phase 2**: Audio settings section with volume controls
3. **Phase 3**: Control settings section with mobile-specific options
4. **Phase 4**: Display and gameplay settings sections
5. **Phase 5**: Validation, accessibility, and mobile optimization

This settings UI provides users with comprehensive control over their gaming experience while maintaining usability across all device types and accessibility standards.
