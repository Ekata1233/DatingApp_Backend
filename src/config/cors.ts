import cors, { CorsOptions } from "cors";

const allowedOrigins = [
  "http://localhost:3000",
  "https://dating-landing-page-two.vercel.app",
  "https://www.welvors.com",
  "https://welvors.com/"
];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests without Origin
    // (Postman, mobile apps, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS Error: ${origin} is not allowed`));
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
  ],

  exposedHeaders: [
    "Content-Length",
    "Content-Disposition",
  ],

  optionsSuccessStatus: 204,
};

export default cors(corsOptions);