# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.1.1] - 2022-09-16

### Changed

- build is only called when there are things to build
  - helps quiet logs when @bundles is not in use

## [3.1.0] - 2022-09-14

### Added

- Sandbox watcher
- user-land esbuild config loaded from ./esbuild.config.js
- Logging output

### Changed

- internal file structure
- slimmer esbuild defaults in favor of user config

## [3.0.5] - 2022-09-10
