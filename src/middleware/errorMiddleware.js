const errorMiddleware = (err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    data: null,
  });
};

const notFoundMiddleware = (req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found`, data: null });

module.exports = { errorMiddleware, notFoundMiddleware };
