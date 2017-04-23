# BKKHackMap

A tool to help BKKHack members collaborate on projects

# Development

- `npm run build:dev` -- build the javascript into bundles in development mode. Source is not minified.
- `npm run build:dist` -- build the javascript into bundles. Source is minified with dead-code elimination.
- `npm run build` -- build the javascript into bundles. Runs `build:dist` if on the gh-pages git branch, `build:dev` otherwise.
- `npm run watch` -- start up webpack development webserver to serve the application, monitor changes and rebuild assets on change.
