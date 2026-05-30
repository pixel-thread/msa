import corsLib from 'cors';

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'https://mfsa.vercel.app',
];

export const cors = corsLib({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-user-id',
    'x-client-type',
    'x-csrf-token',
    'x-trace-id',
  ],
  maxAge: 86400,
});
