import { Cli, z } from 'incur'

const cli = Cli.create('myapp', { version: '1.0.0' })
  .command('deploy', {
    description: 'Deploy the app',
    options: z.object({
      zone: z.string().optional()
        .describe('Availability zone')
        .meta({ deprecated: true }),
      region: z.string().optional()
        .describe('Target region'),
    }),
    run: ({ options }) => ({ deployed: true, ...options }),
  })

cli.serve()
