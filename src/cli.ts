#!/usr/bin/env node
import process from 'node:process'

import { callProcedure, fetchIntrospection } from './client'

const HELP = `Usage: trpc <base-url> [procedure] [input]

Discover and call tRPC procedures.

Arguments:
  base-url    Base URL of the tRPC server
  procedure   Procedure path (e.g. user.list, user.getById)
  input       JSON input (e.g. '{"id":1}')

Options:
  --query                   Force procedure type to query
  --mutation                Force procedure type to mutation
  -t, --transformer <type>  Wire format: json | superjson (default: auto from introspection)
  -H, --header <key:value>  Custom header (repeatable)
  --path <path>             Introspection endpoint path (default: _introspect)
  -h, --help                Show this help message

Examples:
  trpc http://localhost:3000
  trpc http://localhost:3000 user.list
  trpc http://localhost:3000 user.getById '{"id":1}'
  trpc http://localhost:3000 user.create '{"name":"Alice"}' --mutation
  trpc http://localhost:3000 -t superjson`

interface ParsedArgs {
  baseUrl: string | undefined
  procedure: string | undefined
  input: string | undefined
  type: 'query' | 'mutation' | undefined
  transformer: 'json' | 'superjson' | undefined
  headers: Record<string, string>
  introspectionPath: string
}

function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {
    baseUrl: undefined,
    procedure: undefined,
    input: undefined,
    type: undefined,
    transformer: undefined,
    headers: {},
    introspectionPath: '_introspect',
  }

  const positional: string[] = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (arg === '-h' || arg === '--help') {
      console.log(HELP)
      process.exit(0)
    }

    if (arg === '--query') {
      result.type = 'query'
      continue
    }

    if (arg === '--mutation') {
      result.type = 'mutation'
      continue
    }

    if (arg === '-t' || arg === '--transformer') {
      const value = argv[++i]
      if (value !== 'json' && value !== 'superjson') {
        console.error(`Invalid transformer: ${value}. Use json or superjson.`)
        process.exit(1)
      }
      result.transformer = value
      continue
    }

    if (arg === '--path') {
      result.introspectionPath = argv[++i]
      continue
    }

    if (arg === '-H' || arg === '--header') {
      const value = argv[++i]
      if (!value || !value.includes(':')) {
        console.error('Header must be in key:value format.')
        process.exit(1)
      }
      const colonIdx = value.indexOf(':')
      result.headers[value.slice(0, colonIdx).trim()] = value.slice(colonIdx + 1).trim()
      continue
    }

    if (arg.startsWith('-')) {
      console.error(`Unknown option: ${arg}`)
      process.exit(1)
    }

    positional.push(arg)
  }

  result.baseUrl = positional[0]
  result.procedure = positional[1]
  result.input = positional[2]

  return result
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (!args.baseUrl) {
    console.log(HELP)
    process.exit(1)
  }

  const headers = Object.keys(args.headers).length > 0 ? args.headers : undefined

  try {
    if (!args.procedure) {
      // Introspection mode
      const result = await fetchIntrospection(args.baseUrl, {
        path: args.introspectionPath,
        headers,
      })
      console.log(JSON.stringify(result, null, 2))
      return
    }

    // Call procedure
    let input: unknown
    if (args.input) {
      try {
        input = JSON.parse(args.input)
      }
      catch {
        console.error(`Invalid JSON input: ${args.input}`)
        process.exit(1)
      }
    }

    const result = await callProcedure(args.baseUrl, args.procedure, {
      type: args.type,
      input,
      transformer: args.transformer,
      headers,
    })

    console.log(JSON.stringify(result, null, 2))
  }
  catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

main()
