# BKKHackMap

A tool to help BKKHack members collaborate on projects.

# Development

This webapp is a single page application, and contains client-side code only. The server-side functionality is provided by:

- Github Issues - This is the primary data store. The client-side code makes GitHub API calls to persist data as GitHub issue comments.
- Heroku - A very small, free instance running [GateKeeper](https://github.com/prose/gatekeeper) to hide the GitHub OAuth secret.

The client-side code uses written in ES6, with [Vue.js](https://vuejs.org/) for the UI. It uses webpack and babel for transpilation to ES5.

To get started, clone this repo and run:

1. `npm install` -- downloads development and runtime dependencies.
2. `npm run dev` or `npm start` -- starts up webpack development webserver to serve the application, monitor changes and rebuild assets on change.

The following commands are also available:

- `npm run build` -- builds the assets (js, sourcemaps, etc). Source is minified.
- `npm run lint` -- checking code style according to eslint setup.

# Initial Deployment

1. For GitHub authentication, create a GitHub app. You will receive a client id and a secret token.
    - The client id should be set in `src/github-oauth.js`
    - The secret token should be configured in the `bkkhackmap` heroku instance.
2. Create a new GitHub issue tagged with "BKKHack Main Thread". This issue will be used as the back-end data store.
3. Create a black and transparent SVG that represents the floor plan of BKKHack. Save it as `images/floorplan.svg`.
