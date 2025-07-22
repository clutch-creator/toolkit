# Clutch Toolkit

[![npm version](https://badge.fury.io/js/@clutch-creator%2Ftoolkit.svg)](https://badge.fury.io/js/@clutch-creator%2Ftoolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black.svg)](https://nextjs.org/)
[![Build Status](https://github.com/clutch-creator/toolkit/workflows/Checks/badge.svg)](https://github.com/clutch-creator/toolkit/actions)

A comprehensive toolkit providing React components, utilities, and state management solutions for Next.js applications built with the Clutch framework.

## Installation

```bash
npm install @clutch-creator/toolkit
# or
yarn add @clutch-creator/toolkit
# or
bun add @clutch-creator/toolkit
```

## Overview

The Clutch Toolkit is designed to provide developers with a set of reusable components and utilities that integrate seamlessly with Next.js applications. It includes state management, SEO optimization, image handling, and various utility functions.

## State Management Hooks

```typescript
import {
  useRegisterAction,
  useRegisterSelect,
  useRegisterState,
} from '@clutch-creator/toolkit';
```

- **`useRegisterAction(options)`**: Registers actions for components that can be triggered by events
- **`useRegisterSelect(setVisibility, activeTrail)`**: Registers selection handlers for components
- **`useRegisterState(name, value)`**: Registers and manages component state within the Clutch framework

## Utilities

```typescript
import {
  updateUrlSearchParams,
  MissingEnvVariableError,
  InvalidEnvVariableError,
  clutchElementConfig,
  logger,
} from '@clutch-creator/toolkit';
```

### Actions

- **`updateUrlSearchParams(newParams, router)`**: Updates URL search parameters while preserving existing ones. Useful for filtering, pagination, and state management through URLs.

### Error Classes

- **`MissingEnvVariableError`**: Thrown when required environment variables are missing
- **`InvalidEnvVariableError`**: Thrown when environment variables have invalid values

### Configuration

- **`clutchElementConfig(element, config)`**: Registers React components for use in the Clutch visual editor with optional configuration like icons and style selectors

### Logging

- **`logger`**: Conditional logging utility that only outputs when `window.CLUTCH_DEBUG` is enabled

### Controls Types

The toolkit exports comprehensive TypeScript types for various control types used in the Clutch editor:

```typescript
import type { Controls } from '@clutch-creator/toolkit';

// Available control types:
// Array, Checkbox, Code, Color, Combobox, Component, File, Input,
// Json, Media, Number, Object, RichText, Select, Styles, Svg,
// TextArea, Url, Action
```

## Package Exports

The toolkit is organized into modular exports for specific use cases:

### Components

```typescript
// Individual component imports
import { Image } from '@clutch-creator/toolkit/components/Image';
import { ClientImage } from '@clutch-creator/toolkit/components/ClientImage';
import { Link } from '@clutch-creator/toolkit/components/Link';
import { Seo } from '@clutch-creator/toolkit/components/Seo';
import { RichText } from '@clutch-creator/toolkit/components/RichText';
import { Svg } from '@clutch-creator/toolkit/components/Svg';
```

- **`Image`**: Advanced Next.js Image wrapper with automatic placeholder generation and optimization
- **`Link`**: Enhanced Next.js Link component with support for complex URL parameter management
- **`Seo`**: Comprehensive SEO component supporting Open Graph, Twitter Cards, and structured data
- **`RichText`**: Flexible rich text renderer supporting both string and JSX content
- **`Svg`**: SVG component wrapper for dynamic SVG rendering

## Usage Examples

### Basic State Management

```typescript
import { useRegisterState, useRegisterAction } from '@clutch-creator/toolkit';

function MyComponent() {
  const setState = useRegisterState('counter', 0);

  useRegisterAction({
    actionName: 'increment',
    action: () => setState(current => current + 1)
  });

  return <div>My Component</div>;
}
```

### URL Parameter Management

```typescript
import { updateUrlSearchParams } from '@clutch-creator/toolkit';
import { useRouter } from 'next/router';

function FilterComponent() {
  const router = useRouter();

  const handleFilter = (category: string) => {
    updateUrlSearchParams({ category }, router);
  };

  return <button onClick={() => handleFilter('electronics')}>Filter</button>;
}
```

### Component Registration

```typescript
import { clutchElementConfig } from '@clutch-creator/toolkit';

const MyComponent = () => <div>Hello World</div>;

clutchElementConfig(MyComponent, {
  icon: '🎯',
  styleSelectors: [
    { name: 'Primary Button', value: 'btn-primary' }
  ]
});
```

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `bun run test`
5. Run linting: `bun run lint`
6. **Create a changeset**: `bun run changeset` (if your changes should trigger a release)
7. Commit your changes: `git commit -m 'feat: add amazing feature'`
8. Push to your branch: `git push origin feature/amazing-feature`
9. Create a Pull Request

## 🚀 Deployment

This project uses [Changesets](https://github.com/changesets/changesets) for automated versioning and publishing:

1. Create a changeset: `bun run changeset`
2. Push changes to `main` branch
3. GitHub Actions will automatically:
   - Create a "Release PR" with version updates
   - When merged, publish NPM packages and create GitHub releases

## License

MIT

## Contributing

This toolkit is maintained by the Clutch team. For issues and feature requests, please visit our [GitHub repository](https://github.com/clutch-creator/toolkit).

## 🆘 Support

- 📚 [Documentation](https://docs.clutch.io)
- 🐛 [Report Issues](https://github.com/clutch-creator/toolkit/issues)
- 💬 [Community Discussions](https://discord.gg/j4bnupeese)
- 🌐 [Official Website](https://clutch.io)

---

Made with ❤️ by the [Clutch team](https://clutch.io)

Clutch is the next-generation visual builder that empowers creative professionals with total design freedom, advanced functionality, and top-tier performance. Learn more at [clutch.io](https://clutch.io).
