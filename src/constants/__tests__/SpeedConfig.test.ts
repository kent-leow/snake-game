/**
 * Unit tests for Speed configuration constants and utilities
 */

import {
  DEFAULT_SPEED_CONFIG,
  SPEED_PRESETS,
  calculateSpeedCurve,
  calculateSpeedLevel,
  validateSpeedConfig,
  getSpeedPreset,
  getSpeedPresetNames,
  SPEED_MILESTONES,
  getSpeedMilestone,
  getSpeedProgress,
} from '../SpeedConfig';
import type { SpeedConfig } from '../../types/Speed';

describe('SpeedConfig Constants', () => {
  describe('DEFAULT_SPEED_CONFIG', () => {
    it('should have valid default configuration', () => {
      expect(DEFAULT_SPEED_CONFIG.baseSpeed).toBe(150);
      expect(DEFAULT_SPEED_CONFIG.speedIncrement).toBe(15);
      expect(DEFAULT_SPEED_CONFIG.maxSpeed).toBe(60);
      expect(DEFAULT_SPEED_CONFIG.minSpeed).toBe(300);
      expect(DEFAULT_SPEED_CONFIG.transitionDuration).toBe(500);
    });

    it('should pass validation', () => {
      const validation = validateSpeedConfig(DEFAULT_SPEED_CONFIG);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('SPEED_PRESETS', () => {
    it('should contain all expected presets', () => {
      expect(SPEED_PRESETS).toHaveProperty('beginner');
      expect(SPEED_PRESETS).toHaveProperty('normal');
      expect(SPEED_PRESETS).toHaveProperty('expert');
      expect(SPEED_PRESETS).toHaveProperty('insane');
    });

    it('should have normal preset equal to default config', () => {
      expect(SPEED_PRESETS.normal.config).toEqual(DEFAULT_SPEED_CONFIG);
    });

    it('should have all presets with valid configurations', () => {
      Object.values(SPEED_PRESETS).forEach(preset => {
        const validation = validateSpeedConfig(preset.config);
        expect(validation.isValid).toBe(true);
        expect(preset.name).toBeTruthy();
        expect(preset.description).toBeTruthy();
      });
    });

    it('should have beginner preset slower than normal', () => {
      const beginner = SPEED_PRESETS.beginner.config;
      const normal = SPEED_PRESETS.normal.config;
      
      expect(beginner.baseSpeed).toBeGreaterThan(normal.baseSpeed);
      expect(beginner.speedIncrement).toBeLessThan(normal.speedIncrement);
      expect(beginner.maxSpeed).toBeGreaterThan(normal.maxSpeed);
    });

    it('should have expert preset faster than normal', () => {
      const expert = SPEED_PRESETS.expert.config;
      const normal = SPEED_PRESETS.normal.config;
      
      expect(expert.baseSpeed).toBeLessThan(normal.baseSpeed);
      expect(expert.speedIncrement).toBeGreaterThan(normal.speedIncrement);
      expect(expert.maxSpeed).toBeLessThan(normal.maxSpeed);
    });
  });
});

describe('Speed Calculation Functions', () => {
  describe('calculateSpeedCurve', () => {
    it('should calculate correct speed for different combo levels', () => {
      const config = DEFAULT_SPEED_CONFIG;
      
      expect(calculateSpeedCurve(0, config)).toBe(150);
      expect(calculateSpeedCurve(1, config)).toBe(135);
      expect(calculateSpeedCurve(2, config)).toBe(120);
      expect(calculateSpeedCurve(5, config)).toBe(75);
    });

    it('should respect maximum speed limit', () => {
      const config = DEFAULT_SPEED_CONFIG;
      const highLevel = 100;
      
      expect(calculateSpeedCurve(highLevel, config)).toBe(config.maxSpeed);
    });

    it('should work with custom configuration', () => {
      const customConfig: SpeedConfig = {
        baseSpeed: 200,
        speedIncrement: 20,
        maxSpeed: 80,
        minSpeed: 400,
        transitionDuration: 500,
      };

      expect(calculateSpeedCurve(0, customConfig)).toBe(200);
      expect(calculateSpeedCurve(1, customConfig)).toBe(180);
      expect(calculateSpeedCurve(2, customConfig)).toBe(160);
      expect(calculateSpeedCurve(10, customConfig)).toBe(80); // Should hit max
    });
  });

  describe('calculateSpeedLevel', () => {
    it('should calculate correct level for base speed', () => {
      const config = DEFAULT_SPEED_CONFIG;
      expect(calculateSpeedLevel(config.baseSpeed, config)).toBe(0);
    });

    it('should calculate correct level for decreased speeds', () => {
      const config = DEFAULT_SPEED_CONFIG;
      
      expect(calculateSpeedLevel(135, config)).toBe(1); // 150 - 15
      expect(calculateSpeedLevel(120, config)).toBe(2); // 150 - 30
      expect(calculateSpeedLevel(75, config)).toBe(5);  // 150 - 75
    });

    it('should handle maximum speed correctly', () => {
      const config = DEFAULT_SPEED_CONFIG;
      const maxLevel = Math.floor((config.baseSpeed - config.maxSpeed) / config.speedIncrement);
      
      expect(calculateSpeedLevel(config.maxSpeed, config)).toBe(maxLevel);
      expect(calculateSpeedLevel(config.maxSpeed - 10, config)).toBe(maxLevel); // Below max should still be max level
    });

    it('should handle speeds above base speed', () => {
      const config = DEFAULT_SPEED_CONFIG;
      expect(calculateSpeedLevel(config.baseSpeed + 50, config)).toBe(0);
    });
  });
});

describe('Speed Validation', () => {
  describe('validateSpeedConfig', () => {
    it('should validate correct configuration', () => {
      const validation = validateSpeedConfig(DEFAULT_SPEED_CONFIG);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject negative or zero values', () => {
      const invalidConfigs = [
        { ...DEFAULT_SPEED_CONFIG, baseSpeed: 0 },
        { ...DEFAULT_SPEED_CONFIG, baseSpeed: -100 },
        { ...DEFAULT_SPEED_CONFIG, speedIncrement: 0 },
        { ...DEFAULT_SPEED_CONFIG, speedIncrement: -10 },
        { ...DEFAULT_SPEED_CONFIG, maxSpeed: 0 },
        { ...DEFAULT_SPEED_CONFIG, maxSpeed: -50 },
        { ...DEFAULT_SPEED_CONFIG, minSpeed: 0 },
        { ...DEFAULT_SPEED_CONFIG, minSpeed: -200 },
        { ...DEFAULT_SPEED_CONFIG, transitionDuration: -100 },
      ];

      invalidConfigs.forEach(config => {
        const validation = validateSpeedConfig(config);
        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
      });
    });

    it('should reject invalid speed relationships', () => {
      const invalidConfigs = [
        { ...DEFAULT_SPEED_CONFIG, maxSpeed: 200 }, // maxSpeed >= baseSpeed
        { ...DEFAULT_SPEED_CONFIG, baseSpeed: 400 }, // baseSpeed >= minSpeed
        { ...DEFAULT_SPEED_CONFIG, maxSpeed: 350 }, // maxSpeed >= minSpeed
      ];

      invalidConfigs.forEach(config => {
        const validation = validateSpeedConfig(config);
        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
      });
    });

    it('should provide descriptive error messages', () => {
      const config = {
        ...DEFAULT_SPEED_CONFIG,
        baseSpeed: -100,
        maxSpeed: 200,
      };

      const validation = validateSpeedConfig(config);
      expect(validation.errors).toContain('baseSpeed must be greater than 0');
      expect(validation.errors).toContain('maxSpeed must be less than baseSpeed');
    });
  });
});

describe('Speed Preset Management', () => {
  describe('getSpeedPreset', () => {
    it('should return correct preset for valid name', () => {
      const preset = getSpeedPreset('expert');
      expect(preset.name).toBe('Expert');
      expect(preset.config.baseSpeed).toBe(120);
    });

    it('should return normal preset for invalid name', () => {
      const preset = getSpeedPreset('nonexistent');
      expect(preset.name).toBe('Normal');
      expect(preset.config).toEqual(DEFAULT_SPEED_CONFIG);
    });

    it('should return normal preset for empty string', () => {
      const preset = getSpeedPreset('');
      expect(preset.name).toBe('Normal');
    });
  });

  describe('getSpeedPresetNames', () => {
    it('should return all preset names', () => {
      const names = getSpeedPresetNames();
      expect(names).toContain('beginner');
      expect(names).toContain('normal');
      expect(names).toContain('expert');
      expect(names).toContain('insane');
      expect(names).toHaveLength(4);
    });
  });
});

describe('Speed Milestones', () => {
  describe('SPEED_MILESTONES', () => {
    it('should have correct milestone structure', () => {
      expect(SPEED_MILESTONES).toHaveLength(6);
      
      SPEED_MILESTONES.forEach(milestone => {
        expect(milestone).toHaveProperty('level');
        expect(milestone).toHaveProperty('description');
        expect(milestone).toHaveProperty('emoji');
        expect(typeof milestone.level).toBe('number');
        expect(typeof milestone.description).toBe('string');
        expect(typeof milestone.emoji).toBe('string');
      });
    });

    it('should have milestones in ascending order', () => {
      for (let i = 1; i < SPEED_MILESTONES.length; i++) {
        expect(SPEED_MILESTONES[i].level).toBeGreaterThan(SPEED_MILESTONES[i - 1].level);
      }
    });
  });

  describe('getSpeedMilestone', () => {
    it('should return correct milestone for speed level 0', () => {
      const milestone = getSpeedMilestone(0);
      expect(milestone.level).toBe(0);
      expect(milestone.description).toBe('Starting Speed');
      expect(milestone.emoji).toBe('🐌');
    });

    it('should return correct milestone for intermediate levels', () => {
      const milestone = getSpeedMilestone(5);
      expect(milestone.level).toBe(5);
      expect(milestone.description).toBe('Speeding Up');
    });

    it('should return highest applicable milestone', () => {
      const milestone = getSpeedMilestone(10);
      expect(milestone.level).toBe(8);
      expect(milestone.description).toBe('Very Fast');
    });

    it('should return maximum milestone for very high levels', () => {
      const milestone = getSpeedMilestone(100);
      expect(milestone.level).toBe(15);
      expect(milestone.description).toBe('Maximum Speed!');
      expect(milestone.emoji).toBe('💨');
    });

    it('should handle negative levels gracefully', () => {
      const milestone = getSpeedMilestone(-5);
      expect(milestone.level).toBe(0);
      expect(milestone.description).toBe('Starting Speed');
    });
  });
});

describe('Speed Progress Calculation', () => {
  describe('getSpeedProgress', () => {
    it('should return 0 for base speed', () => {
      const config = DEFAULT_SPEED_CONFIG;
      const progress = getSpeedProgress(config.baseSpeed, config);
      expect(progress).toBe(0);
    });

    it('should return 1 for maximum speed', () => {
      const config = DEFAULT_SPEED_CONFIG;
      const progress = getSpeedProgress(config.maxSpeed, config);
      expect(progress).toBe(1);
    });

    it('should return correct progress for intermediate speeds', () => {
      const config = DEFAULT_SPEED_CONFIG;
      const midSpeed = (config.baseSpeed + config.maxSpeed) / 2;
      const progress = getSpeedProgress(midSpeed, config);
      
      expect(progress).toBeCloseTo(0.5, 2);
    });

    it('should clamp progress between 0 and 1', () => {
      const config = DEFAULT_SPEED_CONFIG;
      
      // Speed above base should be 0
      const slowProgress = getSpeedProgress(config.baseSpeed + 100, config);
      expect(slowProgress).toBe(0);
      
      // Speed below max should be 1
      const fastProgress = getSpeedProgress(config.maxSpeed - 50, config);
      expect(fastProgress).toBe(1);
    });

    it('should work with custom configuration', () => {
      const config: SpeedConfig = {
        baseSpeed: 200,
        speedIncrement: 20,
        maxSpeed: 100,
        minSpeed: 400,
        transitionDuration: 500,
      };

      expect(getSpeedProgress(200, config)).toBe(0);
      expect(getSpeedProgress(150, config)).toBe(0.5);
      expect(getSpeedProgress(100, config)).toBe(1);
    });
  });
});