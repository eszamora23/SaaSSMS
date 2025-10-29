/**
 * Standardized API Response Utilities
 */

/**
 * Success response
 */
const successResponse = (message = null, data = null) => {
  const response = {
    success: true,
  };

  if (message) {
    response.message = message;
  }

  if (data !== null) {
    response.data = data;
  }

  return response;
};

/**
 * Created response (201)
 */
const createdResponse = (message = 'Resource created successfully', data) => {
  return successResponse(message, data);
};

/**
 * No content response (204)
 */
const noContentResponse = () => {
  return { success: true };
};

/**
 * Paginated response
 */
const paginatedResponse = (data, pagination, message = null) => {
  const response = {
    success: true,
    data,
    pagination,
  };

  if (message) {
    response.message = message;
  }

  return response;
};

module.exports = {
  successResponse,
  createdResponse,
  noContentResponse,
  paginatedResponse,
};
