import { describe, expect, it } from 'vitest'

import { compactSchema } from '../src/compact'

describe('compactSchema', () => {
  it('removes additionalProperties: false', () => {
    const schema = {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
      additionalProperties: false,
    }

    expect(compactSchema(schema)).toEqual({
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    })
  })

  it('keeps additionalProperties: true', () => {
    const schema = {
      type: 'object',
      properties: { id: { type: 'string' } },
      additionalProperties: true,
    }

    expect(compactSchema(schema)).toEqual({
      type: 'object',
      properties: { id: { type: 'string' } },
      additionalProperties: true,
    })
  })

  it('simplifies nullable anyOf to type array', () => {
    const schema = {
      type: 'object',
      properties: {
        logo: {
          anyOf: [
            { type: 'string', format: 'uri' },
            { type: 'null' },
          ],
        },
      },
      required: ['logo'],
    }

    expect(compactSchema(schema)).toEqual({
      type: 'object',
      properties: {
        logo: { type: ['string', 'null'], format: 'uri' },
      },
      required: ['logo'],
    })
  })

  it('simplifies nullable string with constraints', () => {
    const schema = {
      type: 'object',
      properties: {
        name: {
          anyOf: [
            { type: 'string', maxLength: 500 },
            { type: 'null' },
          ],
        },
      },
      required: ['name'],
    }

    expect(compactSchema(schema)).toEqual({
      type: 'object',
      properties: {
        name: { type: ['string', 'null'], maxLength: 500 },
      },
      required: ['name'],
    })
  })

  it('keeps non-nullable anyOf as-is', () => {
    const schema = {
      type: 'object',
      properties: {
        value: {
          anyOf: [
            { type: 'string' },
            { type: 'number' },
          ],
        },
      },
      required: ['value'],
    }

    expect(compactSchema(schema)).toEqual({
      type: 'object',
      properties: {
        value: {
          anyOf: [
            { type: 'string' },
            { type: 'number' },
          ],
        },
      },
      required: ['value'],
    })
  })

  it('strips date verbose metadata', () => {
    const schema = {
      type: 'object',
      properties: {
        scheduledAt: {
          type: 'string',
          format: 'date-time',
          deprecated: true,
          title: 'Unsupported Date',
          description: 'Date is not supported. Use z.coerce.date() if you need a string-compatible input',
        },
      },
      required: ['scheduledAt'],
    }

    expect(compactSchema(schema)).toEqual({
      type: 'object',
      properties: {
        scheduledAt: { type: 'string', format: 'date-time' },
      },
      required: ['scheduledAt'],
    })
  })

  it('keeps deprecated on non-date schemas', () => {
    const schema = {
      type: 'object',
      properties: {
        old: { type: 'string', deprecated: true },
      },
      required: ['old'],
    }

    expect(compactSchema(schema)).toEqual({
      type: 'object',
      properties: {
        old: { type: 'string', deprecated: true },
      },
      required: ['old'],
    })
  })

  it('removes MAX_SAFE_INTEGER maximum', () => {
    const schema = {
      type: 'object',
      properties: {
        count: { type: 'integer', exclusiveMinimum: 0, maximum: 9007199254740991 },
      },
      required: ['count'],
    }

    expect(compactSchema(schema)).toEqual({
      type: 'object',
      properties: {
        count: { type: 'integer', exclusiveMinimum: 0 },
      },
      required: ['count'],
    })
  })

  it('keeps normal maximum values', () => {
    const schema = {
      type: 'object',
      properties: {
        limit: { type: 'integer', minimum: 1, maximum: 50 },
      },
      required: ['limit'],
    }

    expect(compactSchema(schema)).toEqual({
      type: 'object',
      properties: {
        limit: { type: 'integer', minimum: 1, maximum: 50 },
      },
      required: ['limit'],
    })
  })

  it('recursively cleans nested objects', () => {
    const schema = {
      type: 'object',
      properties: {
        nested: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
          additionalProperties: false,
        },
      },
      required: ['nested'],
      additionalProperties: false,
    }

    expect(compactSchema(schema)).toEqual({
      type: 'object',
      properties: {
        nested: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
      },
      required: ['nested'],
    })
  })

  it('recursively cleans array items', () => {
    const schema = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: { id: { type: 'string' } },
            additionalProperties: false,
          },
        },
      },
      required: ['items'],
      additionalProperties: false,
    }

    expect(compactSchema(schema)).toEqual({
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: { id: { type: 'string' } },
          },
        },
      },
      required: ['items'],
    })
  })

  it('cleans allOf sub-schemas', () => {
    const schema = {
      allOf: [
        {
          type: 'object',
          properties: { orgId: { type: 'string' } },
          required: ['orgId'],
          additionalProperties: false,
        },
        {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
          additionalProperties: false,
        },
      ],
    }

    expect(compactSchema(schema)).toEqual({
      allOf: [
        { type: 'object', properties: { orgId: { type: 'string' } }, required: ['orgId'] },
        { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
      ],
    })
  })

  it('returns undefined for undefined input', () => {
    expect(compactSchema(undefined)).toBeUndefined()
  })

  it('cleans nullable date inside anyOf', () => {
    const schema = {
      type: 'object',
      properties: {
        expiresAt: {
          anyOf: [
            {
              type: 'string',
              format: 'date-time',
              deprecated: true,
              title: 'Unsupported Date',
              description: 'Date is not supported.',
            },
            { type: 'null' },
          ],
        },
      },
      required: ['expiresAt'],
    }

    expect(compactSchema(schema)).toEqual({
      type: 'object',
      properties: {
        expiresAt: { type: ['string', 'null'], format: 'date-time' },
      },
      required: ['expiresAt'],
    })
  })
})
