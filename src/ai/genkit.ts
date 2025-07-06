import {configureGenkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {genkit} from 'genkit';

configureGenkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracing: true,
});
