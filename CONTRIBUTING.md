# Contributing to EtherVault3 CLI

Thank you for your interest in contributing to ETHERVAULT3-CLI-HD-Wallet! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:
1. **Search existing issues** to avoid duplicates
2. **Check the documentation** for solutions
3. **Verify the issue** with the latest version

When creating an issue, include:
- **Clear title** describing the problem
- **Detailed description** of the issue
- **Steps to reproduce** the problem
- **Expected vs actual behavior**
- **Environment details** (OS, Node.js version, etc.)
- **Screenshots/logs** if applicable

### Suggesting Features

We welcome feature suggestions! Please:
1. **Check existing issues** for similar requests
2. **Describe the feature** clearly
3. **Explain the use case** and benefits
4. **Consider implementation** complexity
5. **Provide examples** if possible

### Code Contributions

#### Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ethervault3-cli-wallet.git
   cd ethervault3-cli-wallet
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

#### Development Guidelines

##### Code Style
- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow the project's ESLint configuration
- **Prettier**: Use Prettier for code formatting
- **Naming**: Use descriptive variable and function names
- **Comments**: Add JSDoc comments for public functions

##### Code Structure
- **Modular Design**: Keep functions focused and single-purpose
- **Error Handling**: Always include proper error handling
- **Type Safety**: Use strict TypeScript types
- **Async/Await**: Prefer async/await over Promises
- **Validation**: Validate all user inputs

##### Testing
- **Unit Tests**: Write tests for new functions
- **Integration Tests**: Test feature interactions
- **Error Cases**: Test error scenarios
- **Edge Cases**: Test boundary conditions

#### Pull Request Process

1. **Update Documentation**: Update README, CHANGELOG, and code comments
2. **Add Tests**: Include tests for new functionality
3. **Update Types**: Add TypeScript types if needed
4. **Test Thoroughly**: Test your changes extensively
5. **Commit Messages**: Use clear, descriptive commit messages
6. **Create PR**: Submit a pull request with detailed description

##### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

## 🏗️ Development Setup

### Prerequisites
- **Node.js** 18.0 or higher
- **npm** 8.0 or higher
- **Git** for version control
- **TypeScript** knowledge

### Environment Setup

1. **Clone and install**:
   ```bash
   git clone https://github.com/RAHULDINDIGALA-32/ethervault3-cli-wallet.git
   cd ethervault3-cli-wallet
   npm install
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   # Edit .env with your Infura project ID
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Run in development**:
   ```bash
   npm start
   ```

### Project Structure

```
src/
├── index.ts          # Main application entry point
├── wallet.ts         # Wallet operations and transactions
├── storage.ts        # Secure storage and encryption
├── networks.ts       # Network configurations
└── utils.ts          # Utility functions
```

### Key Components

#### Storage System (`storage.ts`)
- **Encryption**: AES-256-GCM implementation
- **Key Derivation**: PBKDF2 with SHA-512
- **Data Management**: Wallet and transaction storage
- **Security**: Secure file handling

#### Wallet Operations (`wallet.ts`)
- **HD Wallet**: Hierarchical Deterministic wallet
- **Transactions**: Send, receive, and track
- **Airdrop**: Bulk token distribution
- **Account Management**: Multi-account support

#### Main Application (`index.ts`)
- **CLI Interface**: Interactive command-line interface
- **Menu System**: Navigation and user interaction
- **Authentication**: Master password management
- **Error Handling**: Comprehensive error management

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- --grep "wallet operations"

# Run with coverage
npm run test:coverage
```

### Test Categories
- **Unit Tests**: Individual function testing
- **Integration Tests**: Feature interaction testing
- **Security Tests**: Encryption and authentication testing
- **Performance Tests**: Speed and memory usage testing

## 📝 Documentation

### Code Documentation
- **JSDoc Comments**: Document all public functions
- **Inline Comments**: Explain complex logic
- **README Updates**: Update documentation for new features
- **API Documentation**: Document any new APIs

### Documentation Standards
- **Clear Examples**: Provide usage examples
- **Error Cases**: Document error scenarios
- **Type Information**: Include TypeScript types
- **Dependencies**: List any new dependencies

## 🔒 Security Guidelines

### Security Considerations
- **Never log sensitive data**: No passwords, private keys, or mnemonics
- **Validate all inputs**: Sanitize user inputs
- **Use secure defaults**: Implement secure-by-default patterns
- **Handle errors securely**: Don't expose sensitive information
- **Update dependencies**: Keep dependencies current

### Security Testing
- **Input Validation**: Test all input validation
- **Error Handling**: Verify error messages don't leak data
- **Encryption**: Test encryption/decryption functionality
- **Authentication**: Test authentication mechanisms

## 🚀 Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Security review completed
- [ ] Performance testing done

## 💡 Ideas for Contributions

### Beginner-Friendly
- **Documentation**: Improve README, add examples
- **Error Messages**: Make error messages more user-friendly
- **CLI Improvements**: Enhance user interface
- **Testing**: Add more test cases

### Intermediate
- **New Features**: Add requested features
- **Performance**: Optimize existing code
- **Refactoring**: Improve code structure
- **Integration**: Add new network support

### Advanced
- **Security**: Enhance encryption methods
- **Architecture**: Improve overall design
- **Performance**: Optimize for large datasets
- **Advanced Features**: Complex functionality

## 🤔 Questions?

### Getting Help
- **GitHub Issues**: Ask questions in issues
- **Discussions**: Use GitHub Discussions
- **Code Review**: Request code review
- **Documentation**: Check existing docs

### Contact
- **Author**: RAHUL DINDIGALA
- **GitHub**: [@RAHULDINDIGALA-32](https://github.com/RAHULDINDIGALA-32)
- **Email**: rahul.dindigala32@outlook.com

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- **README.md**: Contributor list
- **CHANGELOG.md**: Release notes
- **GitHub**: Contributor statistics
- **Documentation**: Code comments

---

**Thank you for contributing to EtherVault3 CLI! 🎉**

Your contributions help make this project better for everyone in the Web3 community.
