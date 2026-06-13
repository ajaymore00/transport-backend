import { authenticator } from 'otplib';

const DEFAULT_WINDOW = 1; // allow small clock drift

export const generateSecret = () => authenticator.generateSecret();
export const generateToken = (secret) => authenticator.generate(secret);
export const verifyToken = (token, secret) => authenticator.check(token, secret);

export const setOptions = (opts = {}) => {
  if (opts.step) authenticator.options = { ...authenticator.options, step: opts.step };
  if (opts.window !== undefined) authenticator.options = { ...authenticator.options, window: opts.window };
};

setOptions({ window: DEFAULT_WINDOW });
