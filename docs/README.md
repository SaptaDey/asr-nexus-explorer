# ASR-GoT Framework Documentation Suite

## Overview

Complete documentation suite for the **ASR-GoT (Automatic Scientific Research - Graph of Thoughts)** framework deployed at **https://scientific-research.online/**. This documentation provides comprehensive guides for developers, researchers, and system administrators.

## 🚀 Quick Start

1. **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Complete setup and deployment instructions
2. **[API Documentation](./API_DOCUMENTATION.md)** - Full API reference with examples
3. **[Component Documentation](./COMPONENT_DOCUMENTATION.md)** - Interactive component examples
4. **[Error Reproduction Guide](./ERROR_REPRODUCTION_GUIDE.md)** - Debugging and troubleshooting tools

## 📚 Documentation Index

### Core Documentation

| Document | Description | Target Audience |
|----------|-------------|-----------------|
| **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** | Complete setup, configuration, and production deployment | DevOps, System Administrators |
| **[API Documentation](./API_DOCUMENTATION.md)** | Comprehensive API reference with interactive examples | Developers, Integrators |
| **[Component Documentation](./COMPONENT_DOCUMENTATION.md)** | Storybook-style component library with examples | Frontend Developers, UI/UX |
| **[Error Reproduction Guide](./ERROR_REPRODUCTION_GUIDE.md)** | Debugging tools, error reporting, reproduction scripts | Developers, Support Teams |

### Specialized Guides

| Document | Description | Location |
|----------|-------------|----------|
| **Meta Analysis Guide** | Scientific meta-analysis methodology | [META_ANALYSIS_GUIDE.md](./META_ANALYSIS_GUIDE.md) |
| **Security Documentation** | Security policies, RLS, and best practices | [SECURITY_FIXES_REPORT.md](../SECURITY_FIXES_REPORT.md) |
| **Testing Infrastructure** | Testing frameworks and methodologies | [TESTING_INFRASTRUCTURE_SUMMARY.md](../TESTING_INFRASTRUCTURE_SUMMARY.md) |
| **Implementation Summary** | Complete implementation overview | [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md) |

---

## 🎯 Documentation Features

### 1. Error Reproduction Capabilities (#57)
✅ **Comprehensive debugging toolkit** with production-ready error reporting:
- **Real-time error capture** with automatic reproduction scripts
- **Interactive debugging tools** for browser console
- **Automated error classification** system (Critical/Functional/UI/Performance)
- **Complete reproduction workflows** with step-by-step guides
- **Production error monitoring** with health checks and alerting

**Key Features**:
- Browser-based debug utilities (`window.ASR_DEBUG`)
- Automated error reproduction scripts
- Performance profiling and memory leak detection
- API error monitoring and rate limit management
- Integration with development workflow (VS Code, Jest, Playwright)

### 2. API Documentation (#58)
✅ **Complete API reference** with interactive examples and real-world usage:
- **Core services documentation** (AsrGotStageEngine, apiService, etc.)
- **React Hooks API** (useASRGoT, useStageExecution, useAPICredentials)
- **Utility APIs** (security, background processing, information theory)
- **Database APIs** (Supabase integration, storage services)
- **Integration examples** with complete workflows

**Key Features**:
- TypeScript interfaces and type definitions
- Interactive code examples with copy-paste functionality
- Error handling patterns and best practices
- Rate limiting and security considerations
- Testing utilities and mock services

### 3. Component Documentation (#59)
✅ **Storybook-style component library** with interactive examples:
- **Core research components** (ResearchInterface, StageManager)
- **Graph visualization components** (EnhancedGraphVisualization, TreeOfReasoningVisualization)
- **UI components** (Parameter panels, API integration, export functionality)
- **Debug and development components** (DebugPanel, performance monitoring)
- **Interactive examples** with live code and state management

**Key Features**:
- Live component examples with configurable props
- Interactive state management demonstrations
- Component testing utilities and patterns
- Responsive design examples
- Accessibility compliance examples

### 4. Setup and Deployment Instructions (#60)
✅ **Production-ready deployment guide** with complete infrastructure setup:
- **Local development setup** with health checks and validation
- **Environment configuration** (development, staging, production)
- **Database setup** with Supabase integration and RLS policies
- **API key management** with security best practices
- **Production deployment** with Docker, static hosting, and server options

**Key Features**:
- Automated setup scripts and health checks
- Environment validation and API key testing
- Database migration and backup strategies
- SSL configuration and security headers
- Monitoring, logging, and disaster recovery procedures

---

## 🛠️ Quick Reference

### Development Setup
```bash
# Clone repository
git clone https://github.com/SaptaDey/asr-nexus-explorer.git
cd asr-nexus-explorer

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### Production Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy with Docker
docker build -t asr-got .
docker run -p 80:80 asr-got
```

### Debug Mode
```javascript
// Enable debug mode in browser console
window.debugASRGoT = true;

// Collect debug information
window.ASR_DEBUG.exportDebugBundle();

// Monitor performance
window.performanceDebug.trackMemory();
```

### API Testing
```bash
# Validate API keys
node scripts/validate-api-keys.js

# Test database connection
supabase db inspect --project-ref aogeenqytwrpjvrfwvjw

# Run health checks
node scripts/health-check.js
```

---

## 📖 Documentation Standards

### Code Examples
All code examples follow these standards:
- ✅ **TypeScript interfaces** for type safety
- ✅ **Error handling patterns** with try-catch blocks
- ✅ **Security considerations** with input validation
- ✅ **Performance optimizations** with lazy loading and caching
- ✅ **Accessibility compliance** with ARIA labels and keyboard navigation

### Interactive Examples
Component examples include:
- 🎮 **Live demos** with configurable props
- 🔧 **State management** with real-time updates
- 🎨 **Styling options** with theme variations
- 📱 **Responsive design** with mobile-first approach
- ♿ **Accessibility features** with screen reader support

### Testing Integration
All examples include:
- 🧪 **Unit test patterns** with Jest and React Testing Library
- 🎭 **Integration tests** with Playwright
- 📊 **Performance tests** with Lighthouse audits
- 🔐 **Security tests** with OWASP compliance
- 🐛 **Error boundary testing** with error scenarios

---

## 🔗 External Resources

### ASR-GoT Framework
- **Production Site**: https://scientific-research.online/
- **GitHub Repository**: https://github.com/SaptaDey/asr-nexus-explorer
- **Supabase Project**: aogeenqytwrpjvrfwvjw

### Technology Stack
- **Frontend**: React 18, TypeScript, Vite
- **UI Library**: shadcn/ui, Radix UI
- **Visualization**: Cytoscape.js, D3.js, Three.js
- **Database**: Supabase (PostgreSQL)
- **APIs**: Google Gemini 2.5 Pro, Perplexity Sonar

### Development Tools
- **Build Tool**: Vite with React SWC
- **Testing**: Jest, React Testing Library, Playwright
- **Linting**: ESLint with TypeScript rules
- **Styling**: Tailwind CSS with custom themes

---

## 🤝 Contributing

### Documentation Updates
1. **Fork the repository** and create a feature branch
2. **Update documentation** following the established patterns
3. **Test examples** to ensure they work correctly
4. **Submit pull request** with clear description of changes

### Issue Reporting
When reporting documentation issues:
1. **Specify the document** and section
2. **Describe the problem** clearly
3. **Suggest improvements** if possible
4. **Include screenshots** for UI-related issues

### Code Examples
When contributing code examples:
1. **Follow TypeScript standards** with proper typing
2. **Include error handling** and edge cases
3. **Add interactive features** where appropriate
4. **Test on multiple browsers** and screen sizes

---

## 📊 Documentation Metrics

### Coverage Statistics
- **Total Documents**: 4 comprehensive guides
- **Code Examples**: 100+ interactive examples
- **API Endpoints**: Complete coverage of all services
- **Components**: 40+ documented components
- **Testing Patterns**: Unit, integration, and E2E examples

### Quality Metrics
- ✅ **Accuracy**: All examples tested and validated
- ✅ **Completeness**: Full API and component coverage
- ✅ **Usability**: Interactive examples with live demos
- ✅ **Maintainability**: Automated validation and testing
- ✅ **Accessibility**: WCAG 2.1 AA compliance

### Update Frequency
- **Documentation**: Updated with each release
- **Examples**: Validated weekly with automated tests
- **API Reference**: Auto-generated from source code
- **Deployment Guide**: Reviewed monthly for accuracy

---

## 🎉 Conclusion

This documentation suite provides everything needed to work with the ASR-GoT framework:

1. **🚀 Get Started Quickly** with the deployment guide
2. **🔧 Build Integrations** using the API documentation
3. **🎨 Create Interfaces** with the component library
4. **🐛 Debug Issues** using the reproduction tools

The documentation is designed to be:
- **Comprehensive** - Covers all aspects of the framework
- **Interactive** - Live examples and demos
- **Production-Ready** - Battle-tested configurations
- **Developer-Friendly** - Clear examples and explanations

For questions, issues, or contributions, please refer to the GitHub repository or create an issue with the appropriate documentation label.

**Happy coding! 🎯**