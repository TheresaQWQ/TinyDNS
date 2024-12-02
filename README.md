# Tiny DNS
A lightweight DNS server implementation written in TypeScript and powered by Bun runtime.

## Project Structure

This project is organized as a monorepo with the following packages:

- `@tinydns/protocol`: Core DNS protocol implementation for request parsing and response encoding
- `@tinydns/resolver`: Simple DNS resolver implementation
- `@tinydns/server`: DNS server implementation with UDP support (maybe more support in the future?)

## Features

- Basic DNS protocol parsing and encoding
- Standard DNS message format implementation
- Support for various DNS record types (A, AAAA, CNAME, etc.)
- UDP server support
- Standard DNS query and response flow
- DoH (DNS over HTTPS) support
