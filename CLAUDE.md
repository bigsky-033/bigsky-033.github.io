# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **DevTools Suite** - a privacy-first collection of client-side developer utilities that runs entirely in the browser with no server-side processing. Built as a **learning project** to explore AI-assisted development workflows, this demonstrates modern React + TypeScript development patterns with comprehensive testing.

**Current Status**: ✅ **Production Ready** - All 8 planned tools are fully implemented, tested (381 tests), and deployed.

## Tech Stack & Architecture

- **Framework**: React 18+ with TypeScript (strict mode)
- **Styling**: Tailwind CSS with dark/light theme support  
- **Build Tool**: Vite with optimized production builds
- **Routing**: React Router with hash-based routing (GitHub Pages compatible)
- **State Management**: React Context API + hooks
- **Testing**: Vitest + React Testing Library (381 comprehensive tests)
- **Code Quality**: ESLint + Prettier with React/TypeScript best practices
- **Deployment**: GitHub Actions → GitHub Pages (automated CI/CD)

## Development Commands

```bash
# Development
npm run dev                 # Start dev server with HMR
npm run preview            # Preview production build

# Build & Quality
npm run build              # Production build
npm run lint               # ESLint checks
npm run lint:fix           # Auto-fix ESLint issues
npm run format             # Prettier formatting

# Testing
npm run test               # Run tests in watch mode
npm run test:ui            # Run tests with UI
npm run test:coverage      # Generate coverage report
```

## Deployment Configuration

The project is configured for GitHub Pages deployment:

- **Repository**: `bigsky033/bigsky-033.github.io` 
- **Live URL**: `https://bigsky-033.github.io/`
- **Base Path**: `/` (configured for user GitHub Pages sites)
- **Deployment**: Automated via GitHub Actions on push to `main`
- **Workflow**: Lint → Test (381 tests) → Build → Deploy

### GitHub Pages Setup
- Repository Settings → Pages → Source: "GitHub Actions"
- Workflow includes comprehensive quality checks before deployment
- All tests must pass for deployment to proceed

## Project Structure

```
src/
├── components/
│   ├── common/              # Shared UI components
│   │   ├── Header.tsx       # App header with branding
│   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   └── CopyButton.tsx   # Reusable copy-to-clipboard
│   └── tools/               # Individual tool components
│       ├── JsonFormatter/           # ✅ JSON formatting & validation
│       ├── JwtDecoder/             # ✅ JWT token decoding & analysis
│       ├── Base64Tool/             # ✅ Base64 encoding/decoding
│       ├── UrlEncoder/             # ✅ URL encoding utilities
│       ├── HashGenerator/          # ✅ Cryptographic hash generation
│       ├── UuidGenerator/          # ✅ UUID generation (v1, v4, v5)
│       ├── TimestampConverter/     # ✅ Unix timestamp conversion
│       └── AsciiUnicodeConverter/  # ✅ Character encoding utilities
├── hooks/                   # Custom React hooks
│   └── useLocalStorage.ts   # Persistent storage hook
├── utils/                   # Pure utility functions
│   ├── formatters.ts        # JSON formatting utilities
│   ├── validators.ts        # Input validation functions
│   ├── converters.ts        # Data conversion utilities
│   ├── hashers.ts          # Hash generation (MD5, SHA variants)
│   ├── uuid.ts             # UUID generation utilities
│   └── timestamp.ts        # Timestamp conversion utilities
├── types/                   # TypeScript type definitions
└── test/                    # Test setup and configuration
```

## Implemented Tools & Features

All 8 planned tools are **fully implemented and tested**:

### ✅ **P0 Tools (Must Have) - COMPLETED**
1. **JSON Formatter/Validator** (`/json-formatter`)
   - Format, validate, minify JSON with error highlighting
   - Customizable indentation, key sorting
   - Large file support (up to 10MB)

2. **JWT Token Decoder** (`/jwt-decoder`) 
   - Decode headers/payload with syntax highlighting
   - Verify expiration, show metadata (iat, exp, iss, etc.)
   - Visual expiration indicators

3. **Base64 Encoder/Decoder** (`/base64-tool`)
   - Text and file encoding with URL-safe variant support
   - Auto-detection of Base64 format
   - Proper Unicode handling

4. **ASCII/Unicode Converter** (`/ascii-unicode-converter`)
   - Convert text to/from ASCII codes (decimal, hex, octal, binary)
   - Unicode code point support (U+XXXX format)
   - Character encoding detection and HTML entity support

### ✅ **P1 Tools (Should Have) - COMPLETED**
5. **URL Encoder/Decoder** (`/url-encoder`)
   - Component vs full URI encoding
   - Query parameter parsing and building
   - Multiple encoding types support

6. **Hash Generator** (`/hash-generator`)
   - MD5, SHA-1, SHA-256, SHA-512 support
   - Text and file input with comparison features
   - Cross-platform compatibility (Web Crypto API + crypto-js fallback)

7. **UUID Generator** (`/uuid-generator`)
   - v1, v4, v5 UUID generation with bulk options
   - Multiple format options (with/without dashes, case options)
   - UUID parsing and validation

8. **Unix Timestamp Converter** (`/timestamp-converter`)
   - Bidirectional conversion with timezone support
   - Real-time current timestamp, relative time display
   - Auto-detection of seconds vs milliseconds

## Security & Privacy Implementation

- **Zero external API calls** - All processing is client-side only
- **No data transmission** - Sensitive data never leaves user's device  
- **No persistent storage** of sensitive data (only UI preferences)
- **Content Security Policy** ready
- **Subresource Integrity** for external libraries
- **Cross-platform crypto compatibility** (handles both browser and Node.js environments)

## Quality Assurance

### Test Coverage
- **381 comprehensive tests** across all components and utilities
- **13 test files** covering every major feature
- **100% pass rate** in both local and CI environments
- **Cross-environment compatibility** (browser and Node.js)

### Code Quality
- **TypeScript strict mode** for maximum type safety
- **ESLint compliance** with React/TypeScript best practices
- **Prettier formatting** for consistent code style
- **Automated CI/CD** pipeline ensuring quality

### Performance
- **Initial load**: < 3 seconds on 3G connection
- **Tool switching**: < 100ms navigation
- **Operations**: < 50ms for most transformations
- **Bundle size**: ~369KB optimized for production

## Key Development Principles

- **Privacy-first**: All tools work offline after initial load
- **Performance-optimized**: Sub-100ms tool switching, sub-50ms operations
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation
- **Mobile-responsive**: Clean interface across all device sizes
- **Testing**: Every feature has comprehensive test coverage
- **Type-safe**: Strict TypeScript throughout the codebase

## Utility Functions Organization

### Core Utils (`src/utils/`)
- `formatters.ts` - JSON formatting, minifying, key sorting
- `validators.ts` - JSON, Base64, JWT, URL validation functions
- `converters.ts` - Base64, JWT decoding, URL encoding/decoding, ASCII/Unicode conversion
- `hashers.ts` - MD5, SHA-1/256/512 hash generation with cross-platform support
- `uuid.ts` - UUID generation (v1, v4, v5) with parsing and validation
- `timestamp.ts` - Unix timestamp conversion with timezone and relative time support

### Testing Strategy
- **Component tests**: UI interaction, rendering, accessibility
- **Utility tests**: Pure functions, edge cases, error handling
- **Integration tests**: End-to-end workflows across components
- **Cross-platform tests**: Browser and Node.js environment compatibility

## AI-Assisted Development Notes

This project serves as a reference for AI-assisted development patterns:

- **Comprehensive testing**: Every feature built with test-first approach
- **Type safety**: Leveraging TypeScript's strict mode for better AI assistance
- **Documentation**: Detailed inline documentation for better AI context
- **Error handling**: Robust error boundaries and validation throughout
- **Performance**: Optimized patterns for modern React development

## Common Tasks

When working on this project:

1. **Adding new tools**: Follow existing patterns in `src/components/tools/`
2. **Adding utilities**: Create in `src/utils/` with comprehensive tests
3. **Routing**: Update `src/App.tsx` and `src/components/common/Sidebar.tsx`
4. **Testing**: Ensure both component and utility tests are included
5. **Documentation**: Update README.md and CLAUDE.md as needed

## Important Reminders

- **Never create files** unless absolutely necessary for the requested feature
- **Always prefer editing** existing files over creating new ones
- **Never proactively create** documentation files (*.md) unless explicitly requested  
- **Follow existing patterns** for consistency across the codebase
- **Maintain test coverage** for all new functionality
- **Test cross-platform compatibility** especially for crypto operations