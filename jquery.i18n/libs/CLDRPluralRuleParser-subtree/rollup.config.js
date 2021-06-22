import pkg from './package.json'
import esbuild from 'rollup-plugin-esbuild'

export default [
  // browser-friendly UMD build
  {
    input: 'src/CLDRPluralRuleParser.js',
    output: {
      name: 'pluralRuleParser',
      file: pkg.browser,
      format: 'umd'
    },
    plugins: [
      esbuild({
        minify: true
      })
    ]
  },
  // CommonJS (for Node) build.
  {
    input: 'src/CLDRPluralRuleParser.js',
    output: {
      file: pkg.main,
      format: 'cjs',
      exports: 'default'
    },
    plugins: [
      esbuild({
        minify: true
      })
    ]
  },
  // ES module (for bundlers) build.
  {
    input: 'src/CLDRPluralRuleParser.js',
    output: {
      file: pkg.module,
      format: 'es',
      exports: 'default'
    },
    plugins: [
      esbuild({
        minify: true
      })
    ]
  }
]
