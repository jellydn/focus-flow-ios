# Focus Flow Pomodoro Timer - Development Makefile
# Expo React Native project with TypeScript, Bun, and Biome

.PHONY: help install dev dev-web dev-ios dev-android build build-web build-ios build-android
.PHONY: test test-watch test-ui test-coverage lint lint-fix format type-check
.PHONY: clean clean-cache clean-deps prebuild eject expo-doctor
.PHONY: start-simulator ios-simulator android-emulator tunnel
.PHONY: publish preview deploy-web update-ota

# Default target
help: ## Show this help message
	@echo "Focus Flow Pomodoro Timer - Development Commands"
	@echo "================================================"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Installation and Setup
install: ## Install dependencies using bun
	@echo "📦 Installing dependencies..."
	bun install

install-clean: clean-deps install ## Clean install dependencies

setup: install ## Setup project for development
	@echo "🛠️  Setting up development environment..."
	@echo "✅ Dependencies installed"
	@echo "🔧 Run 'make dev' to start development server"

# Development
dev: ## Start Expo development server
	@echo "🚀 Starting Expo development server..."
	bun start

dev-web: ## Start development server for web
	@echo "🌐 Starting web development server..."
	bun start --web

dev-ios: ## Start development server for iOS
	@echo "📱 Starting iOS development server..."
	bun start --ios

dev-android: ## Start development server for Android
	@echo "🤖 Starting Android development server..."
	bun start --android

dev-tunnel: ## Start development server with tunnel
	@echo "🌐 Starting development server with tunnel..."
	bun start --tunnel

# Building
build: type-check-src lint ## Run all quality checks for src
	@echo "✅ All quality checks passed"

build-web: ## Build for web production
	@echo "🌐 Building for web..."
	bunx expo export --platform web

build-ios: ## Build for iOS
	@echo "📱 Building for iOS..."
	bunx eas build --platform ios

build-android: ## Build for Android
	@echo "🤖 Building for Android..."
	bunx eas build --platform android

build-all: ## Build for all platforms
	@echo "🚀 Building for all platforms..."
	bunx eas build --platform all

# Testing
test: ## Run tests
	@echo "🧪 Running tests..."
	bun test

test-watch: ## Run tests in watch mode
	@echo "👀 Running tests in watch mode..."
	bun test --watch

test-ui: ## Run tests with UI
	@echo "🎨 Running tests with UI..."
	bun run test:ui

test-coverage: ## Run tests with coverage
	@echo "📊 Running tests with coverage..."
	bun run test:coverage

# Code Quality
lint: ## Check code with biome
	@echo "🔍 Checking code quality..."
	bun run lint

lint-fix: ## Fix linting issues automatically
	@echo "🔧 Fixing linting issues..."
	bun run lint:fix

format: ## Format code with biome
	@echo "💅 Formatting code..."
	bun run format

type-check: ## Check TypeScript types (all files)
	@echo "🔍 Checking TypeScript types..."
	bun run type-check

type-check-src: ## Check TypeScript types (src only)
	@echo "🔍 Checking TypeScript types in src/..."
	bunx tsc --noEmit --project tsconfig.src.json

quality: lint type-check ## Run all quality checks
	@echo "✅ All quality checks completed"

# Cleaning
clean: ## Clean cache and temporary files
	@echo "🧹 Cleaning cache and temporary files..."
	rm -rf .metro-cache
	rm -rf node_modules/.cache
	rm -rf .expo
	bunx expo start --clear-cache

clean-cache: ## Clear Metro and Expo cache
	@echo "🧹 Clearing Metro and Expo cache..."
	rm -rf .metro-cache
	rm -rf .expo
	bunx expo start --clear-cache

clean-deps: ## Remove node_modules and lockfile
	@echo "🧹 Removing dependencies..."
	rm -rf node_modules
	rm -f bun.lock

clean-all: clean-deps clean ## Full clean (deps + cache)
	@echo "🧹 Full clean completed"

# Expo Commands
prebuild: ## Generate native directories
	@echo "⚙️  Generating native directories..."
	bunx expo prebuild

prebuild-clean: ## Clean prebuild and regenerate
	@echo "🧹 Clean prebuild..."
	bunx expo prebuild --clean

eject: ## Eject from Expo managed workflow
	@echo "⚠️  Ejecting from Expo managed workflow..."
	@echo "This is irreversible. Continue? [y/N]"
	@read -r CONFIRM && [ "$$CONFIRM" = "y" ] && bunx expo eject

expo-doctor: ## Run Expo doctor for health check
	@echo "🩺 Running Expo doctor..."
	npx expo-doctor

expo-install: ## Install Expo SDK compatible packages
	@echo "📦 Installing Expo SDK compatible packages..."
	bunx expo install --fix

# Simulators and Emulators
ios-simulator: ## Open iOS Simulator
	@echo "📱 Opening iOS Simulator..."
	open -a Simulator

android-emulator: ## Start Android emulator
	@echo "🤖 Starting Android emulator..."
	$(ANDROID_HOME)/emulator/emulator -avd Pixel_4_API_30 || echo "Android emulator not found or configured"

# Deployment
publish: build-web ## Publish to Expo
	@echo "🚀 Publishing to Expo..."
	bunx expo publish

preview: ## Create preview build
	@echo "👀 Creating preview build..."
	bunx eas build --platform all --profile preview

deploy-web: build-web ## Deploy web build
	@echo "🌐 Deploying web build..."
	@echo "Web build ready for deployment in dist/"

update-ota: ## Push OTA update
	@echo "📡 Pushing OTA update..."
	bunx eas update

# Development Utilities
doctor: expo-doctor ## Alias for expo-doctor

info: ## Show project and environment info
	@echo "📋 Project Information:"
	@echo "========================"
	@echo "Project: Focus Flow Pomodoro Timer"
	@echo "Platform: Expo React Native + TypeScript"
	@echo "Package Manager: Bun"
	@echo "Linter: Biome"
	@echo "Testing: Vitest"
	@echo ""
	bunx expo --version
	bun --version
	node --version

deps-update: ## Update dependencies
	@echo "📦 Updating dependencies..."
	bun update

deps-outdated: ## Check for outdated dependencies
	@echo "📦 Checking for outdated dependencies..."
	bun outdated

# Quick Development Workflow
quick-start: install dev-web ## Quick start for web development

quick-check: lint type-check test ## Quick quality check

quick-fix: lint-fix format ## Quick fix formatting issues

# Environment specific
dev-prod: ## Start development server in production mode
	@echo "🚀 Starting development server in production mode..."
	NODE_ENV=production bun start

# Monitoring and Debugging
logs: ## Show Expo logs
	@echo "📋 Showing Expo logs..."
	bunx expo logs

bundle-analyze: ## Analyze bundle size
	@echo "📊 Analyzing bundle size..."
	bunx expo export --dump-sourcemap
	@echo "Sourcemap generated for analysis"

# Git workflow helpers
commit-check: quality ## Pre-commit quality check
	@echo "✅ Pre-commit checks passed"

pre-push: test quality ## Pre-push validation
	@echo "✅ Pre-push validation passed"
