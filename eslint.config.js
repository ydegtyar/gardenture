/**
 * Architectural boundary rules enforcing strict isolation between the Menu renderer
 * (`src/menu/**`, `src/scene/**`) and the Game simulation/renderer (`src/game/**`, `src/sim/**`, `src/view/**`).
 */
export const MENU_FORBIDDEN_IMPORT_PATTERNS = [
  '**/game/**',
  '../game/**',
  '../../game/**',
  '**/sim/**',
  '../sim/**',
  '../../sim/**',
  '**/view/**',
  '../view/**',
  '../../view/**',
  '**/content/**',
  '../content/**',
  '../../content/**',
  '**/app/context/**',
  '../app/context/**',
  '../../app/context/**',
];

export const GAME_FORBIDDEN_IMPORT_PATTERNS = [
  '**/menu/**',
  '../menu/**',
  '../../menu/**',
  '**/scene/**',
  '../scene/**',
  '../../scene/**',
];

export default [
  {
    files: ['src/menu/**/*.{ts,tsx}', 'src/scene/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: MENU_FORBIDDEN_IMPORT_PATTERNS,
              message:
                'Isolation violation: menu/** and scene/** must not import from game/**, sim/**, view/**, content/**, or app/context/**. Pass data strictly via MenuHostProps.data.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/game/**/*.{ts,tsx}', 'src/sim/**/*.{ts,tsx}', 'src/view/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: GAME_FORBIDDEN_IMPORT_PATTERNS,
              message:
                'Isolation violation: game/**, sim/**, and view/** must not import from menu/** or scene/**.',
            },
          ],
        },
      ],
    },
  },
];
