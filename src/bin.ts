import path from 'node:path'
import { z } from 'zod'
import * as Cli from './Cli.js'
import * as Skillgen from './Skillgen.js'
import * as Typegen from './Typegen.js'

const gen = Cli.create('gen', { description: 'Code generation utilities.' })
  .command('types', {
    description: 'Generate type definitions for development.',
    options: z.object({
      dir: z.string().optional().describe('Project root directory'),
      entry: z.string().optional().describe('Entrypoint path (absolute)'),
      output: z.string().optional().describe('Output path (absolute)'),
    }),
    async run({ options }) {
      const dir = options.dir ?? '.'
      const entry = options.entry ?? dir
      const output = options.output ?? path.join(dir, 'clac.generated.ts')
      await Typegen.generate(entry, output)
      return { dir, entry, output }
    },
  })
  .command('skills', {
    description: 'Generate Markdown skill files from a CLI definition.',
    options: z.object({
      dir: z.string().optional().describe('Project root directory'),
      entry: z.string().optional().describe('Entrypoint path (absolute)'),
      output: z.string().optional().describe('Output directory'),
      depth: z.number().default(1).describe('Grouping depth (0 = single file)'),
    }),
    async run({ options }) {
      const dir = options.dir ?? '.'
      const entry = options.entry ?? dir
      const output = options.output ?? (options.depth === 0 ? dir : path.join(dir, 'skills'))
      const files = await Skillgen.generate(entry, output, options.depth)
      return { files }
    },
  })

Cli.create('clac').command(gen).serve()
