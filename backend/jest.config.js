export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    moduleNameMapper: {
        '^@/(.*)\\.js$': '<rootDir>/src/$1',
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@k-cloud/shared$': '<rootDir>/../shared/src/index.ts',
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        '^.+\\.ts$': ['ts-jest', { useESM: true }],
    },
    collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/config/sync-db.ts', '!src/server.ts'],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    globals: {
        'ts-jest': {
            tsconfig: {
                module: 'ESNext',
                moduleResolution: 'NodeNext',
            },
        },
    },
};
