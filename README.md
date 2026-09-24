# FintrixAI

## Run the project

Start MongoDB and Ganache first. Ganache must listen on port `7545`, and the
contracts must already be deployed with `npx truffle migrate --reset
--network development` from `Fintrix-Blockchain`.

Install JavaScript dependencies once:

```bash
npm install
npm --prefix Fintrix-Backend install
npm --prefix Fintrix-Blockchain install
npm --prefix Fintrix-Frontend install
```

Then start the ML API, backend, blockchain API, and frontend together:

```bash
npm run dev
```

The frontend runs at `http://localhost:5173`. The backend, ML API, and
blockchain API run on ports `5001`, `8000`, and `3001` respectively.

`npm run dev` repairs or creates `Fintrix-Ml/venv` and installs its pinned
dependencies before starting. On macOS it also installs Homebrew's `libomp`
runtime when needed by XGBoost.