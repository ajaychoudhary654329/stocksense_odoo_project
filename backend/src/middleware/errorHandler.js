const errorHandler = (err, req, res, next) => {
  console.error('Error Log:', err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'SERVER_ERROR';

  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Resource not found with id of ${err.value}`;
  }

  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered for '${field}'`;
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: code,
      message: message,
      details: err.details || null,
    },
  });
};

module.exports = errorHandler;
