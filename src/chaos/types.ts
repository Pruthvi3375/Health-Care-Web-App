export interface ChaosConfig {
  enabled: boolean;
  locatorChanges: boolean;
  labelChanges: boolean;
  domRestructure: boolean;
  missingTestIds: boolean;
  dynamicRender: boolean;
  locatorMap: Record<string, string>;
}

export const DEFAULT_CHAOS: ChaosConfig = {
  enabled: false,
  locatorChanges: false,
  labelChanges: false,
  domRestructure: false,
  missingTestIds: false,
  dynamicRender: false,
  locatorMap: {
    'auth-login-submit': 'auth-sign-in-btn',
    'patient-add-btn': 'patient-create-button',
    'patient-search': 'patient-filter-input',
    'nav-patients': 'nav-link-patients',
    'patient-form-submit': 'patient-save-button',
  },
};
