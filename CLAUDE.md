# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a DevTools Suite - a collection of client-side developer utilities that runs entirely in the browser with no server-side processing. The project is designed with privacy-first principles, ensuring sensitive data never leaves the user's device.

## Tech Stack & Architecture

- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS with dark mode support
- **Build Tool**: Vite
- **Deployment**: GitHub Pages with hash-based routing
- **State Management**: React Context API
- **Testing**: Vitest + React Testing Library
- **Code Quality**: ESLint + Prettier

## Development Commands

```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint
npm run lint:fix

# Format code
npm run format

# Test
npm run test
npm run test:ui
npm run test:coverage

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── common/          # Shared UI components (Header, Sidebar, CopyButton)
│   └── tools/           # Individual tool components (JsonFormatter, JwtDecoder, Base64Tool, etc.)
├── hooks/               # Custom React hooks (useLocalStorage, useTheme)
├── utils/               # Pure utility functions (formatters, validators, converters)
├── types/               # TypeScript type definitions
├── test/                # Test setup files
├── App.tsx              # Main application component with routing
└── main.tsx             # Application entry point
```

## Core Tools & Features

The suite includes multiple developer tools organized by priority:

**P0 (Must Have)**:
- JSON Formatter/Validator - Format, validate, minify JSON with error highlighting
- JWT Token Decoder - Decode headers/payload, verify expiration, show metadata  
- Base64 Encoder/Decoder - Text and file encoding with URL-safe variant support

**P1 (Should Have)**:
- URL Encoder/Decoder, Hash Generator (MD5, SHA variants), UUID Generator, Unix Timestamp Converter

**P2 (Nice to Have)**:
- Text Diff Checker, Regex Tester, Color Converter

## Security & Privacy Requirements

- **Zero external API calls** - All processing must be client-side only
- **No data transmission** - Sensitive data must never leave the user's device
- **No persistent storage** of sensitive data
- **Content Security Policy** headers required
- **Subresource Integrity** for external libraries

## Routing

Uses React Router with hash-based routing for GitHub Pages compatibility:
- `/` - Redirects to `/json-formatter`
- `/json-formatter` - JSON formatting tool
- `/jwt-decoder` - JWT token decoder (placeholder)
- `/base64-tool` - Base64 encoder/decoder (placeholder)
- And more tools...

## Key Development Principles

- All tools must work offline after initial load
- Performance target: tool switching < 100ms, operations < 50ms
- Support Chrome/Edge, Firefox, Safari (last 2 versions)
- WCAG 2.1 AA accessibility compliance
- Mobile-responsive design with dark/light theme support
- Vite base path set to `/devtools-project/` for GitHub Pages

## Utility Functions

Key utilities are located in `src/utils/`:
- `formatters.ts` - JSON formatting, minifying, key sorting
- `validators.ts` - JSON, Base64, JWT validation
- `converters.ts` - Base64, JWT decoding, URL encoding/decoding