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

## API Reference

### State Management Hooks

#### `useRegisterState(name, value)`

Registers a state to be globally bindable in clutch.

**Type Signature:**

```typescript
useRegisterState<T>(name: string, value: T): (newValue: T) => void
```

**Example:**

```typescript
import { useRegisterState } from '@clutch-creator/toolkit';
import { useState } from 'react';

function Counter() {
  const [counter, setCounter] = useState(0);

  // Register the state so it can be accessed globally in Clutch
  useRegisterState<number>('count', counter);

  const increment = () => setCounter(prev => prev + 1);
  const reset = () => setCounter(0);

  return (
    <div>
      <button onClick={increment}>Increment</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

#### `useRegisterAction(options)`

Registers actions for components that can be triggered by events.

**Type Signature:**

```typescript
useRegisterAction<T extends (...args: unknown[]) => unknown>(
  options: TRegisterActionOptions<T>
): void

interface TRegisterActionOptions<T> {
  name: string;
  action: T;
  props?: Record<string, unknown>;
  wrapper?: React.FunctionComponent<{
    children: React.ReactNode;
    [key: string]: unknown;
  }>;
  styleSelectors?: TStyleSelector[];
}

interface TStyleSelector {
  name: string;
  value: string;
}
```

**Example:**

```typescript
import { useRegisterAction } from '@clutch-creator/toolkit';
import { useState } from 'react';

type TSetToggled = (toggled: boolean) => void;

function TodoItem({ id, text, completed }) {
  const [toggled, setToggled] = useState(false);

  useRegisterAction<TSetToggled>({
    name: 'setToggled',
    action: (newValue) => {
      setToggled((value) => newValue);
    },
    props: {
      'data-toggled': toggled
    },
    styleSelectors: [
      { name: 'Toggled', value: '&:[data-toggled=true]' }
    ]
  });

  return <div className={completed ? 'completed' : ''}>{text}</div>;
}
```

#### `useRegisterSelect(setVisibility, activeTrail)`

Registers a handler to be called when the element is selected in clutch.

**Type Signature:**

```typescript
useRegisterSelect(
  setVisibility: (shouldBeVisible: boolean) => void,
  activeTrail?: boolean
): null
```

**Example:**

```typescript
import { useRegisterSelect } from '@clutch-creator/toolkit';
import { useState } from 'react';

function ConditionalContent({ children }) {
  const [isVisible, setIsVisible] = useState(true);

  useRegisterSelect(
    (shouldBeVisible) => setIsVisible(shouldBeVisible),
    true // activeTrail - whether it should be called when a child is selected
  );

  if (!isVisible) return null;

  return <div className="conditional-content">{children}</div>;
}
```

### Utilities

#### `updateUrlSearchParams(newParams, router)`

Updates URL search parameters while preserving existing ones. Useful for filtering, pagination, and state management through URLs.

**Type Signature:**

```typescript
updateUrlSearchParams(
  newParams: Record<string, unknown>,
  router: NextRouter
): Record<string, unknown>
```

**Example:**

```typescript
import { updateUrlSearchParams } from '@clutch-creator/toolkit';
import { useRouter } from 'next/router';

function ProductFilters() {
  const router = useRouter();

  const handleCategoryFilter = (category: string) => {
    updateUrlSearchParams({ category, page: 1 }, router);
    // URL: /products?category=electronics&page=1
  };

  const handlePriceRange = (min: number, max: number) => {
    updateUrlSearchParams({
      priceMin: min.toString(),
      priceMax: max.toString()
    }, router);
    // URL: /products?category=electronics&page=1&priceMin=100&priceMax=500
  };

  const clearFilters = () => {
    updateUrlSearchParams({
      category: null,
      priceMin: null,
      priceMax: null
    }, router);
    // URL: /products
  };

  return (
    <div>
      <button onClick={() => handleCategoryFilter('electronics')}>
        Electronics
      </button>
      <button onClick={() => handlePriceRange(100, 500)}>
        $100-$500
      </button>
      <button onClick={clearFilters}>Clear Filters</button>
    </div>
  );
}
```

#### `clutchElementConfig(element, config)`

Registers React components for use in the Clutch visual editor with optional configuration.

**Type Signature:**

```typescript
clutchElementConfig(
  element: React.FunctionComponent,
  config: {
    icon?: string;
    styleSelectors?: { name?: string; value: string }[];
  }
): void
```

**Example:**

```typescript
import { clutchElementConfig } from '@clutch-creator/toolkit';

const Button = ({ children, variant = 'primary', ...props }) => (
  <button className={`btn btn-${variant}`} {...props}>
    {children}
  </button>
);

const Card = ({ title, children, ...props }) => (
  <div className="card" {...props}>
    <h3 className="card-title">{title}</h3>
    <div className="card-content">{children}</div>
  </div>
);

// Register components with Clutch editor
clutchElementConfig(Button, {
  icon: '🔘',
  styleSelectors: [
    { name: 'Hover', value: '&:hover' },
    { name: 'Disabled', value: '&:disabled' },
  ]
});

clutchElementConfig(Card, {
  icon: '🃏',
  styleSelectors: [
    { name: 'Card Hover', value: '&:hover' },
  ]
});
```

#### `logger`

Conditional logging utility with different methods for development and debugging.

**Type Signature:**

```typescript
logger: {
  log(...args: unknown[]): void;      // Only in development
  debug(...args: unknown[]): void;    // Only when window.CLUTCH_DEBUG = true
  warn(...args: unknown[]): void;     // In development or server
  error(...args: unknown[]): void;    // In development or server
}
```

**Example:**

```typescript
import { logger } from '@clutch-creator/toolkit';

function DataProcessor({ data }) {
  // Always logs in development
  logger.log('Processing data:', data);

  // Only logs when window.CLUTCH_DEBUG = true
  logger.debug('Debug info:', data);

  try {
    const processed = processData(data);
    logger.log('Data processed successfully:', processed);
    return processed;
  } catch (error) {
    logger.error('Error processing data:', error);
    logger.warn('Falling back to default data');
    return getDefaultData();
  }
}

// In browser console to enable debug logging:
// window.CLUTCH_DEBUG = true;
```

#### `cloneChildren(children, props)`

Clones React children and applies the given props to each child element. Filters out debug-related props and handles both single children and arrays of children.

**Type Signature:**

```typescript
cloneChildren(
  children: React.ReactNode,
  props: Record<string, unknown>
): React.ReactNode
```

**Example:**

```typescript
import { cloneChildren } from '@clutch-creator/toolkit';

function WrapperComponent({ children, className, onClick }) {
  // Clone children and add common props
  const clonedChildren = cloneChildren(children, {
    className: `child-element ${className}`,
    onClick: onClick,
    'data-wrapper': true
  });

  return <div className="wrapper">{clonedChildren}</div>;
}

// Usage
function App() {
  return (
    <WrapperComponent className="highlighted" onClick={() => console.log('clicked')}>
      <button>Button 1</button>
      <button>Button 2</button>
    </WrapperComponent>
  );
}
// Both buttons will receive className="child-element highlighted" and onClick handler
```

### Error Classes

#### `MissingEnvVariableError`

Thrown when required environment variables are missing.

**Type Signature:**

```typescript
class MissingEnvVariableError extends Error {
  constructor(envName: string);
}
```

**Example:**

```typescript
import { MissingEnvVariableError } from '@clutch-creator/toolkit';

function initializeApp() {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const dbUrl = process.env.DATABASE_URL;

  if (!apiKey) {
    throw new MissingEnvVariableError('NEXT_PUBLIC_API_KEY');
  }

  if (!dbUrl) {
    throw new MissingEnvVariableError('DATABASE_URL');
  }

  // Initialize app with environment variables
  return { apiKey, dbUrl };
}

// Usage with error handling
try {
  const config = initializeApp();
} catch (error) {
  if (error instanceof MissingEnvVariableError) {
    console.error('Configuration error:', error.message);
    // Handle missing environment variable
  }
}
```

#### `InvalidEnvVariableError`

Thrown when environment variables have invalid values.

**Type Signature:**

```typescript
class InvalidEnvVariableError extends Error {
  constructor(envName: string);
}
```

**Example:**

```typescript
import { InvalidEnvVariableError } from '@clutch-creator/toolkit';

function validateConfig() {
  const port = process.env.PORT;
  const nodeEnv = process.env.NODE_ENV;

  if (port && isNaN(parseInt(port))) {
    throw new InvalidEnvVariableError('PORT');
  }

  if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
    throw new InvalidEnvVariableError('NODE_ENV');
  }

  return {
    port: port ? parseInt(port) : 3000,
    nodeEnv: nodeEnv || 'development',
  };
}

// Usage
try {
  const config = validateConfig();
} catch (error) {
  if (error instanceof InvalidEnvVariableError) {
    console.error('Invalid configuration:', error.message);
    process.exit(1);
  }
}
```

### Controls Types

The toolkit exports comprehensive TypeScript types for various control types used in the Clutch editor:

```typescript
import type { Controls } from '@clutch-creator/toolkit';

// Available control types:
// Array, Checkbox, Code, Color, Combobox, Component, File, Input,
// Json, Media, Number, Object, RichText, Select, Styles, Svg,
// TextArea, Url, Action
```

**Example:**

```typescript
import type { Controls } from '@clutch-creator/toolkit';

type TSomeComponentProps = {
  // props.image will use a media control
  image: Controls["Media"],
  /**
   * You can also annotate a prop to set a control
   * @control CustomControl
   */
  anotherProp: string
}

export function SomeComponent = (props: TSomeComponentProps) {
  // ...
}
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
import { ApplyHooks } from '@clutch-creator/toolkit/components/ApplyHooks';
import { NotFoundRedirect } from '@clutch-creator/toolkit/components/NotFoundRedirect';
import { Slot } from '@clutch-creator/toolkit/components/Slot';
```

- **`Image`**: Advanced Next.js Image wrapper with automatic placeholder generation and optimization
- **`ClientImage`**: Client-side image component for dynamic image loading
- **`Link`**: Enhanced Next.js Link component with support for complex URL parameter management
- **`Seo`**: Comprehensive SEO component supporting Open Graph, Twitter Cards, and structured data
- **`RichText`**: Flexible rich text renderer supporting both string and JSX content
- **`Svg`**: SVG component wrapper for dynamic SVG rendering
- **`ApplyHooks`**: Component for applying multiple hooks to children components
- **`NotFoundRedirect`**: Component for handling 404 redirects
- **`Slot`**: Utility component for passing props to children (uses `cloneChildren` internally)

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

To run toolkit locally in a clutch project, create a symlink of toolkit:

```bash
bun link
```

Then on the project dir:

```bash
bun link @clutch-creator/toolkit
```

You'll also need to add some configuration to the project next config, make sure the root path is back enough to where it englobes the toolkit location:

```js
const nextConfig: NextConfig = withClutch({
  transpilePackages: ['@clutch-creator/toolkit'],
  turbo: {
    root: path.join(__dirname, '../../../../..'),
  },
  outputFileTracingRoot: path.join(__dirname, '../../../../..'),
});
```

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
