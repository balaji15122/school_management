const errorHandler = (err, req, res, next) => {
  console.error('[Error Details]:', err);

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    const value = Object.values(err.keyValue).join(', ');

    let message = `Duplicate value '${value}' for field(s): ${field}.`;
    if (field.includes('admissionNumber')) {
      message = `A student with admission number '${err.keyValue.admissionNumber}' already exists in this school.`;
    } else if (field.includes('code')) {
      message = `A school with code '${err.keyValue.code}' already exists.`;
    } else if (field.includes('email')) {
      message = `The email address '${err.keyValue.email}' is already registered.`;
    }

    return res.status(409).json({
      success: false,
      message,
      duplicateField: field,
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Resource not found with id of ${err.value}`,
    });
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: 'Database validation error',
      errors: messages,
    });
  }

  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode || 500);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
